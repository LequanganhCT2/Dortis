# Long Nhật Website — QA report

Document: DORTIS-LNS-WEB-001 · 15/11/2026.

## Đã chuẩn bị kiểm thử tự động

- Test adapter từ `artist_profiles.sections`: không tạo video/link/booking giả, lọc URL nguy hiểm, lọc ảnh trùng.
- Test release gate: không public khi chưa đủ audit/giấy phép/booking/duyệt design.
- Router: `/admin/portfolio` cần vai trò Admin; `/portfolio/long-nhat` chưa phát hành.
- Website preview: Quick Portfolio và Immersive Journey cùng dữ liệu, toggle desktop/mobile; gallery ảnh thật có lightbox bàn phím Escape/Arrow.

## Chưa thể xác nhận tự động

- Visual QA trình duyệt thực tại 360, 390, 430, 768, 1024, 1440px và Safari iPhone.
- LCP/INP/CLS p75 trên thiết bị và mạng thực tế.
- So sánh font/màu với từng trang PDF gốc, quyền tư liệu, link video/booking.
- Phê duyệt nội dung bởi Giám đốc DORTIS.

Chỉ cập nhật phần "đã vượt qua" sau khi có kết quả CI/Vercel của bản phát hành.
