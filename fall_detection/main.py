import cv2
import time
import numpy as np
from ultralytics import YOLO
from fall_detector import FallDetector

def main():
    # Khởi tạo model YOLOv8 pose (n = nano, nhẹ nhất chạy cực nhanh trên GPU/CPU)
    print("Đang tải model YOLOv8n-pose...")
    model = YOLO("yolov8n-pose.pt")
    
    # Khởi tạo Fall Detector với các ngưỡng cho trước
    detector = FallDetector(aspect_ratio_threshold=1.5, spine_angle_threshold=40, drop_velocity_threshold=0.8)
    
    # Mở webcam
    # Số 0 thường là webcam mặc định của máy
    cap = cv2.VideoCapture(0)
    
    # Cố gắng set độ phân giải 1080p
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    
    if not cap.isOpened():
        print("Không thể mở webcam! Vui lòng kiểm tra lại thiết bị.")
        return

    print("========================================")
    print("Bắt đầu Pipeline Fall Detection.")
    print("Nhấn 'q' để thoát.")
    print("========================================")
    
    # Tạo cửa sổ hiển thị trước để gắn Trackbar
    cv2.namedWindow("Real-time Fall Detection (YOLOv8-Pose)")
    
    # Hàm callback rỗng cho Trackbar
    def nothing(x):
        pass
        
    # Tạo các thanh trượt (Trackbar) để chỉnh tham số trực tiếp 
    # (OpenCV chỉ hỗ trợ số nguyên, nên AR và Vel được nhân 10)
    cv2.createTrackbar("AR Thresh (x10)", "Real-time Fall Detection (YOLOv8-Pose)", 15, 30, nothing)
    cv2.createTrackbar("Angle Thresh", "Real-time Fall Detection (YOLOv8-Pose)", 40, 90, nothing)
    cv2.createTrackbar("Vel Thresh (x10)", "Real-time Fall Detection (YOLOv8-Pose)", 8, 30, nothing)
    
    prev_time = time.time()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Không thể đọc frame từ webcam.")
            break
            
        # Đọc tham số từ Trackbar và cập nhật cho detector
        detector.aspect_ratio_threshold = cv2.getTrackbarPos("AR Thresh (x10)", "Real-time Fall Detection (YOLOv8-Pose)") / 10.0
        detector.spine_angle_threshold = cv2.getTrackbarPos("Angle Thresh", "Real-time Fall Detection (YOLOv8-Pose)")
        detector.drop_velocity_threshold = cv2.getTrackbarPos("Vel Thresh (x10)", "Real-time Fall Detection (YOLOv8-Pose)") / 10.0
            
        current_time = time.time()
        fps = 1 / (current_time - prev_time) if (current_time - prev_time) > 0 else 0
        prev_time = current_time
            
        # Dự đoán và theo dõi (tracking) với YOLOv8
        results = model.track(frame, persist=True, verbose=False)
        
        # YOLOv8 trả về một list các kết quả (do ta truyền 1 ảnh nên lấy r[0])
        r = results[0]
        
        # Clone ảnh, gọi r.plot(boxes=False) để vẽ các keypoint dạng khung xương (skeleton)
        # Ta set boxes=False để tự vẽ bounding box sau cho dễ tùy chỉnh màu sắc
        annotated_frame = r.plot(boxes=False) 
        
        # Xử lý từng người trong frame
        if r.boxes is not None and r.keypoints is not None:
            boxes = r.boxes.xyxy.cpu().numpy()
            # Lấy track_id do YOLOv8 cung cấp
            track_ids = r.boxes.id.cpu().numpy() if r.boxes.id is not None else [None] * len(boxes)
            # YOLOv8 trả về tensor có shape (num_persons, 17, 3)
            keypoints_data = r.keypoints.data.cpu().numpy() 
            
            for i in range(len(boxes)):
                bbox = boxes[i]
                keypoints = keypoints_data[i]
                track_id = int(track_ids[i]) if track_ids[i] is not None else None
                
                # Truyền qua hệ thống nhận diện ngã (kèm track_id để tính vận tốc)
                is_fall, reasons, metrics = detector.process(bbox, keypoints, track_id=track_id)
                
                x1, y1, x2, y2 = map(int, bbox[:4])
                
                if is_fall:
                    # Trạng thái Ngã: Bounding box và Text màu ĐỎ
                    color = (0, 0, 255) # BGR
                    label = "FALL DETECTED"
                    
                    # Vẽ text cảnh báo KHẨN CẤP to ở góc trên cùng bên trái màn hình
                    cv2.putText(annotated_frame, "!!! FALL DETECTED !!!", (50, 100), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
                else:
                    # Trạng thái Bình thường: Xanh lá cây
                    color = (0, 255, 0)
                    label = "Normal"
                    
                # Vẽ bounding box
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                # Vẽ nhãn trạng thái (Normal/Fall)
                cv2.putText(annotated_frame, label, (x1, y1 - 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                            
                # Vẽ các chỉ số metrics thực tế (Màu Cyan / Vàng)
                info_text = f"AR: {metrics['AR']:.1f} | Vel: {metrics['Vel']:.1f}/s"
                if metrics['Angle'] is not None:
                    info_text += f" | Ang: {metrics['Angle']:.0f}"
                cv2.putText(annotated_frame, info_text, (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

        # Vẽ thông số FPS lên góc màn hình
        cv2.putText(annotated_frame, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        
        # Hiển thị frame
        cv2.imshow("Real-time Fall Detection (YOLOv8-Pose)", annotated_frame)
        
        # Nhấn 'q' để thoát
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Giải phóng camera và cửa sổ
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
