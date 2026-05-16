import cv2
import time
import numpy as np
import requests
import threading
import socketio
import base64
import queue
from ultralytics import YOLO
from fall_detector import FallDetector

def draw_text_with_bg(img, text, position, font=cv2.FONT_HERSHEY_SIMPLEX, scale=1.0, color=(255, 255, 255), thickness=2, bg_color=(0, 0, 0)):
    """Vẽ chữ có nền phía sau để dễ nhìn hơn"""
    (text_width, text_height), baseline = cv2.getTextSize(text, font, scale, thickness)
    x, y = position
    # Vẽ hình chữ nhật nền (phủ kín vùng chữ)
    cv2.rectangle(img, (x, y - text_height - baseline), (x + text_width, y + baseline), bg_color, -1)
    # Vẽ chữ đè lên trên
    cv2.putText(img, text, (x, y), font, scale, color, thickness)

# Cấu hình API Backend
API_BASE_URL = "http://localhost:3000/api"
COOLDOWN_SECONDS = 30

# --- CÁC LỚP HỖ TRỢ THREADING ---

class CameraStream:
    """Lớp đọc frames từ Camera liên tục ở một Thread riêng biệt để tránh block I/O"""
    def __init__(self, src=0):
        self.cap = cv2.VideoCapture(src)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        self.ret, self.frame = self.cap.read()
        self.running = True
        self.lock = threading.Lock()
        
        # Khởi tạo luồng
        self.thread = threading.Thread(target=self.update, args=())
        self.thread.daemon = True

    def start(self):
        self.thread.start()
        return self

    def update(self):
        while self.running:
            ret, frame = self.cap.read()
            with self.lock:
                self.ret = ret
                # Copy frame để luồng chính lấy không bị ghi đè
                self.frame = frame

    def read(self):
        with self.lock:
            # Trả về bản sao của frame để đảm bảo thread-safe
            return self.ret, self.frame.copy() if self.ret else (False, None)

    def isOpened(self):
        return self.cap.isOpened()

    def release(self):
        self.running = False
        self.thread.join()
        self.cap.release()

class SocketIOStream:
    """Lớp xử lý resize, encode base64 và gửi frame qua Socket.IO ở một Thread riêng"""
    def __init__(self, sio):
        self.sio = sio
        self.q = queue.Queue(maxsize=3) # Giới hạn queue nhỏ để không lưu trữ frame cũ (tránh trễ hình)
        self.running = True
        
        self.thread = threading.Thread(target=self.run, args=())
        self.thread.daemon = True

    def start(self):
        self.thread.start()
        return self

    def send_frame(self, frame):
        # Nếu queue đầy (xử lý không kịp), loại bỏ frame cũ và cho frame mới vào
        if self.q.full():
            try:
                self.q.get_nowait()
            except queue.Empty:
                pass
        self.q.put(frame)

    def run(self):
        while self.running:
            try:
                # Đợi tối đa 0.1s để lấy frame từ queue
                frame = self.q.get(timeout=0.1)
                if self.sio.connected:
                    # Resize và mã hóa ở thread này thay vì thread chính (đã đổi về 16:9)
                    small_frame = cv2.resize(frame, (640, 360))
                    ret_enc, buffer = cv2.imencode('.jpg', small_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                    if ret_enc:
                        b64_str = base64.b64encode(buffer).decode('utf-8')
                        self.sio.emit('video_frame', {'frame': b64_str})
                self.q.task_done()
            except queue.Empty:
                pass
            except Exception as e:
                pass

    def stop(self):
        self.running = False
        self.thread.join()

# --- HẾT PHẦN THREADING ---

def main():
    # Lấy thông tin Elder mặc định từ Backend
    print("Đang lấy thông tin Elder từ hệ thống...")
    elder_profile_id = None
    try:
        response = requests.get(f"{API_BASE_URL}/elder/default", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if "elderProfile" in data and data["elderProfile"]:
                elder_profile_id = data["elderProfile"]["id"]
                print(f"Thành công: Đã lấy được elderProfileId: {elder_profile_id}")
            else:
                print("Lỗi: Không tìm thấy elderProfile trong dữ liệu trả về.")
        else:
            print(f"Lỗi: API trả về mã lỗi {response.status_code}")
    except Exception as e:
        print(f"Không thể kết nối đến Backend: {e}")
        
    if not elder_profile_id:
        print("!!! CẢNH BÁO: KHÔNG THỂ LẤY ĐƯỢC THÔNG TIN NGƯỜI CAO TUỔI !!!")
        print("Hệ thống vẫn sẽ chạy, nhưng sẽ không gửi được báo động SOS lên máy chủ.")
        print("Vui lòng đảm bảo Backend đang chạy ở cổng 3000.")

    # Khởi tạo kết nối Socket.IO tới Backend
    sio = socketio.Client()
    try:
        socket_url = API_BASE_URL.replace("/api", "")
        print(f"Đang kết nối Socket.IO tới {socket_url}...")
        sio.connect(socket_url)
        print("Kết nối Socket.IO thành công!")
    except Exception as e:
        print(f"Không thể kết nối Socket.IO: {e}")

    # Khởi tạo model YOLOv8 pose
    print("Đang tải model YOLOv8n-pose...")
    model = YOLO("yolov8n-pose.pt")
    
    # Khởi tạo Fall Detector với các ngưỡng cho trước
    detector = FallDetector(aspect_ratio_threshold=1.5, spine_angle_threshold=40, drop_velocity_threshold=0.8)
    
    # Khởi tạo Thread đọc Camera
    print("Khởi tạo luồng đọc Camera...")
    cam_stream = CameraStream(0).start()
    
    if not cam_stream.isOpened():
        print("Không thể mở webcam! Vui lòng kiểm tra lại thiết bị.")
        return

    # Khởi tạo Thread gửi Socket.IO
    print("Khởi tạo luồng truyền phát Socket.IO...")
    socket_stream = SocketIOStream(sio).start()

    print("========================================")
    print("Bắt đầu Pipeline Fall Detection.")
    print("Nhấn 'q' để thoát.")
    print("========================================")
    
    # Tạo cửa sổ hiển thị trước để gắn Trackbar
    cv2.namedWindow("Real-time Fall Detection (YOLOv8-Pose)")
    
    # Hàm callback rỗng cho Trackbar
    def nothing(x):
        pass
        
    # Tạo các thanh trượt (Trackbar)
    cv2.createTrackbar("Angle Thr.", "Real-time Fall Detection (YOLOv8-Pose)", 40, 90, nothing)
    cv2.createTrackbar("Stand Vel.(x10)", "Real-time Fall Detection (YOLOv8-Pose)", 16, 20, nothing)
    cv2.createTrackbar("Sit Vel.(x10)", "Real-time Fall Detection (YOLOv8-Pose)", 12, 20, nothing)
    cv2.createTrackbar("Lying Dur.(x10)", "Real-time Fall Detection (YOLOv8-Pose)", 10, 50, nothing)
    cv2.createTrackbar("Fall Win.(x10)", "Real-time Fall Detection (YOLOv8-Pose)", 20, 100, nothing)
    
    prev_time = time.time()
    frame_count = 0
    last_alert_time = {}
    
    def send_sos_alert(profile_id):
        if not profile_id: return
        try:
            print(">> ĐANG GỬI CẢNH BÁO SOS LÊN BACKEND...")
            payload = {
                "elderProfileId": profile_id,
                "locationAddr": "Phát hiện té ngã từ Camera AI phòng khách!"
            }
            res = requests.post(f"{API_BASE_URL}/sos", json=payload, timeout=5)
            if res.status_code == 201:
                print(">> [THÀNH CÔNG] ĐÃ GỬI BÁO ĐỘNG SOS TỚI ĐIỆN THOẠI CAREGIVER!")
            else:
                print(f">> [LỖI] Phản hồi từ Server: {res.status_code}")
        except Exception as e:
            print(f">> [LỖI] Không thể gửi cảnh báo SOS: {e}")
    
    while True:
        # Lấy frame từ luồng phụ (không bị block)
        ret, frame = cam_stream.read()
        if not ret or frame is None:
            time.sleep(0.01) # Chờ camera sẵn sàng
            continue
            
        # Đọc tham số từ Trackbar
        detector.spine_angle_threshold = cv2.getTrackbarPos("Angle Thr.", "Real-time Fall Detection (YOLOv8-Pose)")
        detector.drop_velocity_threshold = cv2.getTrackbarPos("Stand Vel.(x10)", "Real-time Fall Detection (YOLOv8-Pose)") / 10.0
        detector.sitting_vel_threshold = cv2.getTrackbarPos("Sit Vel.(x10)", "Real-time Fall Detection (YOLOv8-Pose)") / 10.0
        detector.lying_duration_threshold = cv2.getTrackbarPos("Lying Dur.(x10)", "Real-time Fall Detection (YOLOv8-Pose)") / 10.0
        detector.fall_window_threshold = cv2.getTrackbarPos("Fall Win.(x10)", "Real-time Fall Detection (YOLOv8-Pose)") / 10.0
            
        current_time = time.time()
        fps = 1 / (current_time - prev_time) if (current_time - prev_time) > 0 else 0
        prev_time = current_time
            
        # Dự đoán và theo dõi với YOLOv8 (CPU/MPS tự động nhận diện)
        results = model.track(frame, persist=True, verbose=False)
        
        r = results[0]
        annotated_frame = r.plot(boxes=False) 
        
        # Xử lý từng người trong frame
        if r.boxes is not None and r.keypoints is not None:
            boxes = r.boxes.xyxy.cpu().numpy()
            track_ids = r.boxes.id.cpu().numpy() if r.boxes.id is not None else [None] * len(boxes)
            keypoints_data = r.keypoints.data.cpu().numpy() 
            
            for i in range(len(boxes)):
                bbox = boxes[i]
                keypoints = keypoints_data[i]
                track_id = int(track_ids[i]) if track_ids[i] is not None else None
                
                is_fall, reasons, metrics = detector.process(bbox, keypoints, track_id=track_id)
                
                x1, y1, x2, y2 = map(int, bbox[:4])
                
                if is_fall:
                    t_id = track_id if track_id is not None else 'unknown'
                    
                    if elder_profile_id:
                        if t_id not in last_alert_time or (current_time - last_alert_time[t_id]) > COOLDOWN_SECONDS:
                            last_alert_time[t_id] = current_time
                            threading.Thread(target=send_sos_alert, args=(elder_profile_id,)).start()

                    color = (0, 0, 255)
                    label = "FALL DETECTED"
                    
                else:
                    color = (0, 255, 0)
                    label = "Normal"
                    
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                # Nhãn trạng thái (Normal/Fall)
                draw_text_with_bg(annotated_frame, label, (x1, y1 - 85), 
                                  scale=1.2, color=color, thickness=3)

                # Dòng thông tin tư thế (Posture)
                info_text = f"{metrics.get('Posture', '??')} (Base: {metrics.get('Base', '??')})"
                draw_text_with_bg(annotated_frame, info_text, (x1, y1 - 50), 
                                  scale=1, color=(255, 255, 0), thickness=2)

                # Dòng chi tiết vận tốc và góc
                detail_text = f"Vel: {metrics.get('Vel', 0):.1f} SL/s | Ang: {metrics.get('Angle', 0):.0f}"
                draw_text_with_bg(annotated_frame, detail_text, (x1, y1 - 10), 
                                  scale=1, color=(0, 255, 255), thickness=2)
                
                # --- DEBUG INFO ---
                debug_y = y2 + 25
                if metrics.get("Drop"):
                    draw_text_with_bg(annotated_frame, "DROP CAPTURED!", (x1, debug_y), 
                                      scale=0.6, color=(0, 165, 255), thickness=2)
                    debug_y += 25
                
                lying_sec = metrics.get("LyingSec", 0)
                if lying_sec > 0:
                    draw_text_with_bg(annotated_frame, f"Lying: {lying_sec:.1f}s", (x1, debug_y), 
                                      scale=0.6, color=(255, 255, 255), thickness=2)

        cv2.putText(annotated_frame, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        
        cv2.imshow("Real-time Fall Detection (YOLOv8-Pose)", annotated_frame)
        
        # Đẩy frame liên tục vào Thread Socket.IO để hiển thị mượt mà hơn
        frame_count += 1
        socket_stream.send_frame(annotated_frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Dọn dẹp tài nguyên
    cam_stream.release()
    socket_stream.stop()
    cv2.destroyAllWindows()
    if sio.connected:
        sio.disconnect()

if __name__ == "__main__":
    main()
