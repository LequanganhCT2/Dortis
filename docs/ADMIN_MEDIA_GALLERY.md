# DORTIS — Admin Media Library V2

Đã triển khai trên Supabase project Dortis: table \`site_image_gallery\`, RLS theo JWT app_metadata.role = admin, realtime cho cả \`site_images\` lẫn \`site_image_gallery\`. Migration idempotent được lưu tại \`supabase/dortis_multi_image_gallery.sql\`.

## Quản lý ảnh
- Mở \`/admin\`, đăng nhập tài khoản có quyền admin.
- Chọn khu vực ở các tab: Hero, Dịch vụ, Dự án công khai, Trải nghiệm nghệ sĩ, Triết lý, Giá trị, FAQ, Liên hệ.
- **Tải ảnh chính**: thay riêng 1 ảnh ở \`site_images\` (các ảnh chính cũ không bị xóa khi thêm album).
- **Thêm nhiều ảnh**: file input \`multiple\`, tối đa 24 ảnh bổ sung/khu vực, mỗi file tối đa 5MB (JPG/PNG/WebP/AVIF); xử lý lần lượt để tránh nghẽn.
- **Đổi thứ tự**: nút ←/→ trên từng ảnh bổ sung.
- **Xóa ảnh**: xóa đúng bản ghi và file Storage liên quan sau khi xác nhận.
- Thao tác upload thành công hiển thị ngay trên Homepage qua Supabase Realtime; nếu mạng bị ngắt, reload sẽ nạp lại từ DB.

## Cách hiển thị
- Hero: 4 thẻ không đổi; nhiều ảnh trong vùng Hero tự chuyển nhẹ trên từng thẻ.
- Dịch vụ: tối đa **10 thẻ**; **không phải 10 ảnh tổng cộng**. Mỗi thẻ có thể có nhiều ảnh và tự thay ảnh. 05–10 là các thẻ phụ chỉ xuất hiện nếu đã tải ảnh.
- Dự án công khai: ảnh của các slot đã duyệt được hiển thị thành gallery riêng; không phát hành PDF.
- Trải nghiệm nghệ sĩ, Triết lý, Giá trị, FAQ: ảnh là lớp nền mờ, bảo đảm thông tin vẫn dễ đọc.
- Liên hệ: các ảnh tự chuyển nhẹ trên bộ ba thẻ.
- Reduced motion, ẩn tab, hoặc khu vực ngoài viewport: tránh tạo chuyển động không cần thiết.

**Lưu ý:** Bucket \`dortis-media\` là public — mọi ảnh tải lên đều có thể truy cập công khai. Chỉ tải ảnh có quyền sử dụng và không có dữ liệu cá nhân, tài liệu PDF riêng tư hay thông tin nhạy cảm.

## Ảnh cũ
Không di chuyển, sao chép hay xóa các bản ghi hiện tại trong \`site_images\`. Mỗi ảnh chính vẫn được ưu tiên đầu tiên; các ảnh mới ở bảng \`site_image_gallery\`.

## Kiểm tra
- SQL: xem columns, policies, publication và xác nhận RLS.
- GitHub Actions / Vercel production: kiểm tra build và domain sau commit.
- Trình duyệt: kiểm tra tải 2–3 ảnh, đổi thứ tự, xóa 1 ảnh, reload trang (cần thao tác thủ công vì không giả mạo session admin).
