# Thêm từng dự án PDF vào Dortis

Đặt mỗi dự án thành một phần tử riêng trong `public/projects.json`. Đây là một file dữ liệu JSON, không phải SQL. Bạn có thể dùng **Google Drive file ID** khi PDF đã được chia sẻ cho người xem.

Ví dụ cấu trúc (dữ liệu mẫu, chưa phải dự án thật):

```json
[
  {
    "title": "Tên dự án thực tế",
    "driveId": "GOOGLE_DRIVE_FILE_ID",
    "category": "Portfolio",
    "year": "2026",
    "description": "Mô tả ngắn về dự án"
  }
]
```

Hoặc `pdfUrl` là một liên kết trực tiếp dạng HTTPS tới PDF. Chỉ sử dụng URL đáng tin cậy. Mỗi thẻ có modal xem PDF và nút mở ngoài trang.

Trạng thái hiện tại: mảng rỗng vì thư mục Drive người dùng cung cấp chưa được tài khoản kết nối cấp quyền đọc. UI sẽ tạm hiển thị các concept minh họa cũ thay vì tự tạo dự án giả.
