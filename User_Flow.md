# LUỒNG NGƯỜI DÙNG (USER FLOW) - AN GIA

## I. THEO DÕI SỨC KHỎE VÀ SINH HOẠT HÀNG NGÀY

### 1. Phía Người Cao Tuổi (Module Ông Bà)
*   **Trang chủ thân thiện**: Hiển thị lời chào cá nhân hóa và câu hỏi thăm sức khỏe ("Hôm nay ông thấy thế nào?").
*   **Quản lý thuốc thông minh**:
    *   **Widget nhắc nhở nhanh**: Hiển thị loại thuốc sắp đến giờ uống ngay tại trang chủ để ông bà không quên.
    *   **Lịch thuốc chi tiết**: Phân loại theo buổi (Sáng/Trưa/Tối) với các thẻ màu sắc rõ ràng (Xanh: Đã uống, Vàng: Chưa uống).
    *   **Xác nhận linh hoạt**: Ông bà có thể "Xác nhận đã uống" hoặc "Hủy xác nhận" (Untick) nếu bấm nhầm.
    *   **Tùy chỉnh danh sách**: Cho phép xóa thuốc khỏi lịch trình với Popup xác nhận chuyên nghiệp, tránh thao tác nhầm.
    *   **Theo dõi tiến độ**: Thanh tiến độ khổng lồ hiển thị số liều đã uống/tổng số liều trong ngày.

### 2. Phía Con Cái (Module Con Cái)
*   **Giám sát thời gian thực**: 
    *   Màn hình chính cập nhật tức thì trạng thái từ AI ("Đang hoạt động bình thường", "Vừa uống thuốc X xong").
    *   Chuyển đổi nhanh giữa các đối tượng theo dõi (Bố hoặc Mẹ).
*   **Xem chi tiết sức khỏe**: 
    *   Nút **"Xem chi tiết"** dẫn tới màn hình thống kê: Tổng quan số liều đã uống/chưa uống và danh sách thuốc cụ thể theo từng buổi.
*   **Giám sát an ninh**: Xem camera trực tiếp với các thẻ trạng thái AI (ví dụ: "AI: Phát hiện di chuyển") và tính năng xem toàn màn hình.

---

## II. PHẢN ỨNG TRONG TÌNH HUỐNG KHẨN CẤP (SOS)

Luồng này được tối ưu hóa để kích hoạt sự chú ý ngay lập tức và tận dụng "thời gian vàng".

### 1. Kích hoạt và Đếm ngược (Phía Ông Bà)
*   **Kích hoạt một chạm**: Ông bà chỉ cần chạm vào nút SOS khổng lồ (không cần nhấn giữ phức tạp).
*   **Thời gian chờ 3 giây**: Hệ thống rung mạnh và hiển thị bộ đếm ngược 3 giây. Đây là khoảng thời gian để ông bà nhấn "HỦY" nếu vô tình bấm nhầm mà không làm con cái lo lắng.
*   **Âm thanh cảnh báo**: Còi báo động (Siren) dồn dập kèm giọng nói nhắc nhở liên tục: *"[Tên ông/bà] cần được hỗ trợ"*.

### 2. Phát tín hiệu và Kết nối (Phía Ông Bà)
*   **Gửi tín hiệu**: Sau 3 giây đếm ngược, tín hiệu SOS được gửi lên hệ thống và tới máy con cái.
*   **Tự động gọi điện**: Ứng dụng tự động hiện popup gọi điện tới số người thân đã cài đặt sẵn.
*   **Thoát an toàn**: Sau khi gọi xong, ông bà có nút "QUAY LẠI TRANG CHỦ" để dừng báo động và quay về giao diện bình thường.

### 3. Cảnh báo Nguy cấp và Hỗ trợ (Phía Con Cái)
*   **Báo động cường độ cao**: 
    *   Màn hình máy con cái nhấp nháy đỏ rực liên tục.
    *   Âm thanh còi hú vang lên (cần nhấn **"KÍCH HOẠT ÂM THANH SOS"** một lần duy nhất lúc mở app trên iPhone).
    *   Thông báo đè xuất hiện: **"CẢNH BÁO NGUY CẤP! [Tên ông/bà] CẦN GIÚP ĐỠ!"**.
*   **Hành động tức thì**: 
    *   Con cái nhấn **"XEM VỊ TRÍ & HỖ TRỢ NGAY"** để mở bản đồ định vị hoặc camera.
    *   Hệ thống sẽ tự động tắt tiếng còi hú khi con cái bắt đầu thao tác hỗ trợ hoặc xem camera để tránh làm phiền việc liên lạc.
