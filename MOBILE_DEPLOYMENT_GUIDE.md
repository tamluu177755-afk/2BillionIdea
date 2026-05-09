# Hướng dẫn Deploy Mobile App lên Vercel (Web Preview)

Hướng dẫn này giúp bạn đưa phần giao diện ứng dụng lên internet để có thể truy cập qua mã QR.

## Bước 1: Chuẩn bị trên Vercel
1. Truy cập [vercel.com](https://vercel.com) và kết nối với tài khoản GitHub của bạn.
2. Nhấn **"Add New"** -> chọn **"Project"** (Đây là lựa chọn mặc định để tạo một ứng dụng web mới).
3. Import repository chứa dự án `2BillionIdea`.

## Bước 2: Cấu hình Dự án
Trong màn hình "Configure Project", hãy thiết lập chính xác như sau:

1. **Root Directory:** Nhấn nút **Edit** và chọn thư mục `mobile`.
2. **Build & Output Settings:**
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `dist`
3. **Environment Variables:**
   - Thêm biến: `EXPO_PUBLIC_API_URL`
   - Giá trị: Link Backend của bạn (ví dụ: `https://an-gia-backend.onrender.com`)

## Bước 3: Triển khai và Kiểm tra
1. Nhấn **"Deploy"**.
2. Sau khi hoàn tất, Vercel sẽ cấp cho bạn một tên miền (URL).
3. Truy cập URL đó trên trình duyệt máy tính để đảm bảo giao diện hiển thị đúng.

## Bước 4: Tạo mã QR để chia sẻ
Tại thư mục gốc của dự án trên máy tính, chạy lệnh:
```bash
node generate-qr.js <URL_TU_VERCEL>
```
Mở file `web-qr.html` để lấy mã QR cho mọi người quét.

---
**Lưu ý:** Mỗi khi bạn thay đổi code ở máy và `git push`, Vercel sẽ tự động cập nhật bản web mới nhất cho bạn.
