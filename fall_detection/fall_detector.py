import math
import time
import numpy as np
from collections import deque

class FallDetector:
    def __init__(self, aspect_ratio_threshold=1.5, spine_angle_threshold=40, drop_velocity_threshold=0.8):
        """
        Khởi tạo Fall Detector dựa trên các luật heuristic kết hợp theo dõi vận tốc.
        :param aspect_ratio_threshold: Ngưỡng tỷ lệ w/h (bbox width / height). 
        :param spine_angle_threshold: Ngưỡng góc của cột sống so với trục ngang (độ). 
        :param drop_velocity_threshold: Ngưỡng tốc độ rơi (chiều cao cơ thể / giây).
        """
        self.aspect_ratio_threshold = aspect_ratio_threshold
        self.spine_angle_threshold = spine_angle_threshold
        self.drop_velocity_threshold = drop_velocity_threshold
        
        # Lưu lịch sử vị trí theo track_id: { track_id: deque([(time, center_y, height), ...]) }
        self.history = {}
        
        # Lưu trạng thái ngã của từng track_id
        self.fall_state = {}

    def calculate_angle(self, p1, p2):
        """Tính góc giữa đường nối 2 điểm với trục ngang (từ 0 -> 90 độ)"""
        dx = abs(p2[0] - p1[0])
        dy = abs(p2[1] - p1[1])
        if dx == 0:
            return 90.0
        angle = math.degrees(math.atan(dy / dx))
        return angle

    def process(self, bbox, keypoints, track_id=None):
        """
        Phân tích bbox và keypoints từ YOLOv8-pose kết hợp history (nếu có track_id)
        """
        current_time = time.time()
        
        x1, y1, x2, y2 = bbox
        width = x2 - x1
        height = y2 - y1
        center_y = (y1 + y2) / 2
        
        # 1. Tính Aspect Ratio của bounding box
        aspect_ratio = width / height if height > 0 else 0
        
        # 2. Tính góc cột sống (Spine Angle)
        def get_pt(idx):
            if len(keypoints[idx]) == 3:
                x, y, conf = keypoints[idx]
                if conf > 0.5:
                    return (x, y)
            elif len(keypoints[idx]) == 2:
                return (keypoints[idx][0], keypoints[idx][1])
            return None

        ls = get_pt(5)
        rs = get_pt(6)
        lh = get_pt(11)
        rh = get_pt(12)
        
        is_horizontal = False
        reasons = []

        # Điều kiện 1: Bbox nằm ngang (Người đang nằm)
        if aspect_ratio > self.aspect_ratio_threshold:
            is_horizontal = True
            reasons.append(f"AR: {aspect_ratio:.2f}")

        spine_angle = None
        # Điều kiện 2: Cột sống nằm ngang
        if ls and rs and lh and rh:
            mid_shoulder = ((ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2)
            mid_hip = ((lh[0] + rh[0]) / 2, (lh[1] + rh[1]) / 2)
            
            spine_angle = self.calculate_angle(mid_shoulder, mid_hip)
            if spine_angle < self.spine_angle_threshold:
                is_horizontal = True
                reasons.append(f"Angle: {spine_angle:.1f} deg")
                
        is_fall = False
        drop_velocity = 0.0
        
        # Nếu có Tracking ID, ta có thể tính vận tốc rơi
        if track_id is not None:
            if track_id not in self.history:
                self.history[track_id] = deque(maxlen=15) # Lưu khoảng 0.5s với 30fps
            
            history = self.history[track_id]
            history.append((current_time, center_y, height))
            
            if len(history) > 5:
                # Lấy frame xa nhất trong lịch sử
                old_time, old_cy, old_h = history[0]
                dt = current_time - old_time
                if dt > 0:
                    dy = center_y - old_cy 
                    # Vận tốc rơi chuẩn hóa (chiều cao cơ thể / giây). dy > 0 là đang đi xuống.
                    drop_velocity = (dy / height) / dt if height > 0 else 0
            
            # Kích hoạt trạng thái Ngã: Nếu tư thế nằm ngang + Vận tốc rơi đủ lớn
            if is_horizontal and drop_velocity > self.drop_velocity_threshold:
                self.fall_state[track_id] = current_time
                reasons.append(f"Vel: {drop_velocity:.1f}/s")
                
            # Duy trì trạng thái Ngã trong một khoảng thời gian (3 giây)
            if track_id in self.fall_state:
                if current_time - self.fall_state[track_id] < 3.0:
                    is_fall = True
                    if is_horizontal:
                        # Reset timer nếu người đó vẫn còn nằm ngang, chỉ hết ngã khi họ đứng dậy
                        self.fall_state[track_id] = current_time
                else:
                    del self.fall_state[track_id]
        else:
            # Fallback nếu không có tracking: chỉ cần tư thế nằm ngang
            if is_horizontal:
                is_fall = True
                
        metrics = {
            "AR": aspect_ratio,
            "Angle": spine_angle,
            "Vel": drop_velocity
        }
        return is_fall, reasons, metrics
