# Carousel vòng cung DORTIS — quản lý tối đa 10 ảnh

Phần Dịch vụ trên Home Page hiển thị tối đa **5 thẻ** ở màn hình desktop; trên màn hình hẹp hiển thị khoảng **3 thẻ** để giữ cỡ chữ dễ đọc.

Có sẵn 4 thẻ dịch vụ được gắn với các slot `service-cv`, `service-brand`, `service-visual`, `service-web`.

Để thêm tối đa 6 thẻ ảnh bổ sung, đăng nhập `/admin` và tải ảnh vào `service-gallery-05` ... `service-gallery-10`. Chỉ slot đã tải ảnh mới được đưa vào vòng xoay. Như vậy hệ thống chứa tối đa 10 mục; dữ liệu nằm trong Supabase Storage và bảng `site_images`, không cần push ảnh lên GitHub.

Dùng nút mũi tên, phím trái/phải khi đặt focus vào carousel, nhấn thẻ hai bên hoặc kéo chuột/vuốt màn hình để xoay vòng liên tục. Với `prefers-reduced-motion: reduce` các chuyển động được tắt.

Để chạy trên Supabase hiện có: thực thi `supabase/dortis_service_gallery.sql`. Với project mới, tệp `dortis_admin_media.sql` cũng đã có constraint được cập nhật.
