# Hướng dẫn triển khai An Gia (CareConnect)

Dự án này đã được cấu hình để triển khai dễ dàng lên **Render** (Backend) và **Vercel** (Mobile Web).

## 1. Triển khai Backend (Render)
- **Repo:** Đẩy code lên GitHub.
- **Service Type:** Web Service.
- **Build Command:** `cd backend && npm install && npm run build`
- **Start Command:** `cd backend && npm start`
- **Lưu ý về Database:** 
  - Tôi đã cấu hình lệnh `build` để **tự động** khởi tạo Database và nạp dữ liệu demo (`seed`) mỗi khi bạn deploy.
  - Vì dùng SQLite, dữ liệu sẽ quay về trạng thái ban đầu mỗi khi server khởi động lại (rất phù hợp để demo).
- **Environment Variables:**
  - `DATABASE_URL`: `file:./prisma/dev.db`
  - `PORT`: `3000`

## 2. Triển khai Mobile Web (Vercel)
- **Repo:** Đẩy cùng một repo lên GitHub.
- **Framework Preset:** `Other` hoặc `Create React App`.
- **Build Command:** `cd mobile && npm install && npm run build:web`
- **Output Directory:** `mobile/dist`
- **Environment Variables:**
  - `EXPO_PUBLIC_API_URL`: URL của backend Render bạn vừa tạo (ví dụ: `https://angia-api.onrender.com`)

## 3. Dữ liệu Demo có sẵn
Hệ thống đã được cài đặt sẵn dữ liệu demo để thuận tiện cho việc trình chiếu:
- **Ông bà (Elder):** 
  - Số điện thoại: `0901234567`
  - Thuốc sẵn có: Omega-3, Men tiêu hóa, Calcium, Huyết áp.
- **Con cái (Caregiver):**
  - Số điện thoại: `0987654321`

---
*Chúc bạn có buổi demo thành công!*
