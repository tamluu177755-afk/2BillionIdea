import math
import time
import numpy as np
from collections import deque

class FallDetector:
    def __init__(self, aspect_ratio_threshold=1.5, spine_angle_threshold=40, drop_velocity_threshold=0.8, 
                 sitting_vel_threshold=0.5, lying_duration_threshold=1.0, fall_window_threshold=3.0):
        """
        Khởi tạo Fall Detector dựa trên State Machine kết hợp theo dõi vận tốc.
        """
        self.aspect_ratio_threshold = aspect_ratio_threshold
        self.spine_angle_threshold = spine_angle_threshold
        self.drop_velocity_threshold = drop_velocity_threshold # Cho Standing
        self.sitting_vel_threshold = sitting_vel_threshold
        self.lying_duration_threshold = lying_duration_threshold
        self.fall_window_threshold = fall_window_threshold
        
        # Lưu lịch sử theo track_id: { track_id: deque([(time, center_y, height, posture), ...]) }
        self.history = {}
        
        # State Machine per track_id
        self.last_drop_time = {}       # Mốc thời gian bắt gặp vận tốc rơi lớn
        self.horizontal_start_time = {} # Mốc thời gian bắt đầu tư thế nằm ngang
        self.confirmed_fall_time = {}   # Mốc thời gian xác nhận đã ngã (để duy trì cảnh báo)

    def calculate_angle(self, p1, p2):
        """Tính góc giữa đường nối 2 điểm với trục ngang (từ 0 -> 90 độ)"""
        dx = abs(p2[0] - p1[0])
        dy = abs(p2[1] - p1[1])
        if dx == 0:
            return 90.0
        angle = math.degrees(math.atan(dy / dx))
        return angle

    def get_angle_between_vectors(self, v1, v2):
        """Tính góc (độ) giữa 2 vector"""
        dot_product = v1[0]*v2[0] + v1[1]*v2[1]
        mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
        mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
        if mag1 * mag2 == 0: return 180.0
        cosine_angle = max(-1.0, min(1.0, dot_product / (mag1 * mag2)))
        return math.degrees(math.acos(cosine_angle))

    def get_posture(self, keypoints):
        """
        Phân loại tư thế CHỈ dựa trên keypoints (Pose).
        Trả về: posture, alpha (lưng-sàn)
        """
        def get_pt(idx):
            if len(keypoints[idx]) == 3:
                x, y, conf = keypoints[idx]
                if conf > 0.5: return np.array([x, y])
            return None

        s = (get_pt(5) + get_pt(6))/2 if get_pt(5) is not None and get_pt(6) is not None else None
        h = (get_pt(11) + get_pt(12))/2 if get_pt(11) is not None and get_pt(12) is not None else None
        k = (get_pt(13) + get_pt(14))/2 if get_pt(13) is not None and get_pt(14) is not None else None
        a = (get_pt(15) + get_pt(16))/2 if get_pt(15) is not None and get_pt(16) is not None else None

        alpha = gamma = beta = spine_length = None
        rel_h_a_dist = 1.0 

        if s is not None and h is not None:
            v_spine = s - h
            spine_length = np.linalg.norm(v_spine)
            alpha = self.calculate_angle([0, 0], v_spine)
            
            if k is not None:
                v_thigh = k - h
                gamma = self.calculate_angle([0, 0], v_thigh)
                beta = self.get_angle_between_vectors(v_spine, v_thigh)
                
            if a is not None:
                # Dùng spine_length để chuẩn hóa khoảng cách thay vì height
                rel_h_a_dist = abs(a[1] - h[1]) / spine_length if spine_length > 0 else 2.0

        # --- LOGIC PHÂN LOẠI THUẦN POSE ---
        if alpha is not None:
            # 1. NẰM (Lying): Lưng thấp hơn ngưỡng cài đặt
            if alpha <= self.spine_angle_threshold:
                return 'Lying', alpha, spine_length
            
            # 2. ĐỨNG (Standing): Lưng thẳng và tỷ lệ chân đủ dài
            if alpha > max(65, self.spine_angle_threshold) and rel_h_a_dist > 0.8:
                return 'Standing', alpha, spine_length
                
            # 3. NGỒI (Sitting): Phần còn lại (Lưng cao hơn ngưỡng nằm, nhưng không đứng thẳng)
            # Bao phủ tất cả: ngồi ghế, ngồi bệt, ngồi xổm, v.v.
            if alpha > self.spine_angle_threshold:
                return 'Sitting', alpha, spine_length

        return 'Unknown', alpha, spine_length

    def process(self, bbox, keypoints, track_id=None):
        """
        Xử lý chính DỰA THUẦN TRÊN POSE
        """
        current_time = time.time()
        
        # 1. Xác định tư thế và độ dài cột sống (để chuẩn hóa)
        posture, alpha, spine_length = self.get_posture(keypoints)
        
        # Lấy tọa độ VAI để theo dõi chuyển động (nhạy hơn Hông, bắt được cả ngồi gục)
        def get_pt(idx):
            if len(keypoints[idx]) == 3 and keypoints[idx][2] > 0.5:
                return keypoints[idx][1] # Chỉ lấy Y
            return None
        
        s5_y, s6_y = get_pt(5), get_pt(6)
        shoulder_y = (s5_y + s6_y) / 2 if (s5_y is not None and s6_y is not None) else (s5_y or s6_y)

        drop_velocity = 0.0
        baseline_posture = 'Unknown'
        
        if track_id is not None and shoulder_y is not None and spine_length is not None:
            if track_id not in self.history:
                self.history[track_id] = deque(maxlen=30)
            
            history = self.history[track_id]
            
            if len(history) >= 5:
                # Tính vận tốc tức thời (so với 5 khung hình trước, khoảng 0.3 giây)
                old_time, old_sy, old_sl, _ = history[-5]
                dt = current_time - old_time
                if dt > 0 and spine_length > 0:
                    dy = shoulder_y - old_sy
                    drop_velocity = (dy / spine_length) / dt
            elif len(history) > 1:
                # Fallback nếu chưa đủ 5 khung hình
                old_time, old_sy, old_sl, _ = history[0]
                dt = current_time - old_time
                if dt > 0 and spine_length > 0:
                    dy = shoulder_y - old_sy
                    drop_velocity = (dy / spine_length) / dt
            
            if len(history) > 10:
                postures_in_history = [h[3] for h in history if h[3] != 'Unknown']
                if postures_in_history:
                    baseline_posture = max(set(postures_in_history), key=postures_in_history.count)
            
            history.append((current_time, shoulder_y, spine_length, posture))
            
            # Ngưỡng vận tốc mới (tính theo Spine Length)
            # Thường ngã đứng sẽ > 2.5 spine_length/s, ngã ngồi > 1.5 spine_length/s
            vel_thresh = self.drop_velocity_threshold
            if baseline_posture == 'Sitting':
                vel_thresh = self.sitting_vel_threshold
            
            # --- STATE MACHINE ---
            # Bước A: Ghi nhận cú rơi (Trigger)
            has_drop = False
            if drop_velocity > vel_thresh:
                self.last_drop_time[track_id] = current_time
            
            # Kiểm tra Drop của ID hiện tại
            time_since_local_drop = current_time - self.last_drop_time.get(track_id, 0)
            
            if time_since_local_drop < self.fall_window_threshold:
                has_drop = True

            # Dọn dẹp local drop quá hạn
            if time_since_local_drop >= self.fall_window_threshold:
                self.last_drop_time.pop(track_id, None)

            # Bước B: Theo dõi thời gian nằm
            if posture == 'Lying':
                if track_id not in self.horizontal_start_time:
                    self.horizontal_start_time[track_id] = current_time
            elif posture in ['Standing', 'Sitting']:
                # Chỉ xóa bộ đếm nằm khi chắc chắn đã đứng hoặc ngồi dậy
                self.horizontal_start_time.pop(track_id, None)
            # Nếu là Unknown, giữ nguyên bộ đếm cũ

            is_fall = False
            reasons = []
            lying_duration = 0
            
            # Bước C: Xác nhận ngã
            if track_id in self.horizontal_start_time:
                lying_duration = current_time - self.horizontal_start_time[track_id]
                if lying_duration > self.lying_duration_threshold:
                    if has_drop:
                        self.confirmed_fall_time[track_id] = current_time
                        reasons.append(f"Ngã từ {baseline_posture}")
            
            if track_id in self.confirmed_fall_time:
                # Duy trì trạng thái ngã nếu vẫn đang nằm hoặc unknown
                if current_time - self.confirmed_fall_time[track_id] < 5.0 and posture != 'Standing' and posture != 'Sitting':
                    is_fall = True
                    self.confirmed_fall_time[track_id] = current_time
                else:
                    self.confirmed_fall_time.pop(track_id, None)

            metrics = {
                "Angle": alpha, 
                "Vel": drop_velocity, 
                "Posture": posture, 
                "Base": baseline_posture, 
                "Drop": has_drop,
                "LyingSec": lying_duration
            }
            return is_fall, reasons, metrics
            
        else:
            # Fallback nếu không có tracking
            is_fall = (posture == 'Lying')
            return is_fall, [], {"Posture": posture}
