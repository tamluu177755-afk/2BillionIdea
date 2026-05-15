# Real-time Fall Detection (YOLOv8-Pose)

Hệ thống phát hiện người ngã (Fall Detection) siêu nhẹ, thời gian thực.
Sử dụng **YOLOv8n-pose** cho trích xuất khung xương (pose estimation) và suy diễn bằng luật (heuristic). Rất phù hợp cho máy tính cá nhân trang bị GPU NVIDIA như **GTX 1650** kết hợp **Webcam 1080p**.

## Cấu trúc thư mục
- `setup.bat`: Kịch bản cài đặt môi trường tự động cho Windows.
- `setup.sh`: Kịch bản cài đặt môi trường cho Linux/Git Bash.
- `fall_detector.py`: Core logic phát hiện ngã (tính toán góc, tỉ lệ).
- `main.py`: File chạy chính, kết nối webcam và nhận diện.

## Cài đặt Môi trường
Mở Terminal (Command Prompt / PowerShell / Git Bash) tại thư mục `d:\2BillionIdea\fall_detection` và chạy kịch bản cài đặt:

**Trên Windows (Native CMD/PowerShell):**
```bat
setup.bat
```

**Trên Linux / Git Bash:**
```bash
./setup.sh
```

Kịch bản này sẽ:
1. Tạo một môi trường conda tên là `fall_env` với Python 3.10.
2. Cài đặt PyTorch với cấu hình CUDA 11.8 (Tối ưu cho card dòng GTX/RTX).
3. Cài đặt các thư viện `ultralytics` (YOLO) và `opencv-python`.

## Chạy Chương trình
Sau khi cài đặt xong, kích hoạt môi trường và chạy file chính:

```bash
conda activate fall_env
python main.py
```

Lần đầu chạy, hệ thống sẽ tự động tải model siêu nhẹ `yolov8n-pose.pt` (chỉ khoảng vài MB).
Nhấn phím `q` trên cửa sổ hình ảnh để thoát chương trình bất cứ lúc nào.

## Giải thích thuật toán Heuristic
Logic nhận diện (nằm trong `fall_detector.py`) dựa vào 2 yếu tố chính:
1. **Aspect Ratio (Tỷ lệ khung hình):** Tỷ lệ Chiều rộng / Chiều cao của khung bao (Bounding Box) quanh người. Nếu tỷ lệ > 1.5, người đang ở tư thế nằm ngang so với camera.
2. **Spine Angle (Góc cột sống):** Góc giữa đường trung bình nối hông và vai so với mặt đất. Nếu góc này < 40 độ, người đó không đứng thẳng mà đang ngã hoặc nằm.

Bạn có thể tùy chỉnh các thông số này trong `main.py` để phù hợp với góc đặt camera thực tế.
