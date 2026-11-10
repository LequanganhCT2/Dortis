# Dortis Admin - thiết lập đúng Supabase project

Trang quản trị: `/admin`.

1. Kết nối **đúng project Supabase** `whkqdusoowrrhtvejrie`. Project này hiện không có quyền qua kết nối Supabase ChatGPT; không sử dụng nhầm Supabase của Roomly hoặc Shiftly.
2. Trong Supabase > SQL Editor, chạy `supabase/dortis_admin_media.sql`. SQL tạo bảng `public.site_images`, bucket công khai `dortis-media`, RLS chỉ cho admin sửa/xóa ảnh.
3. Trong Supabase > Authentication > Users, tạo **tài khoản admin bằng email thật** và mật khẩu riêng. Sau đó dùng lệnh UPDATE `auth.users.raw_app_meta_data` mẫu ở cuối tệp SQL để đặt `role=admin`. Chỉ chủ project có quyền thực hiện. Đăng xuất và đăng nhập lại để JWT nhận quyền mới.
4. Trong Vercel > Project > Settings > Environment Variables, cấu hình `VITE_SUPABASE_URL=https://whkqdusoowrrhtvejrie.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY` là publishable key (không dùng service_role), `VITE_DORTIS_ADMIN_EMAIL` là email admin đã tạo. Redeploy sau khi thêm biến môi trường.
5. Truy cập `/admin`, đăng nhập, chọn ảnh JPG/PNG/WebP/AVIF <=5MB, tải lên hoặc gỡ ảnh từng mục. Bấm gỡ ảnh chỉ gỡ ảnh hiển thị của slot đó; **không xóa PDF nguồn**.

## Bảo mật

- Không hardcode mật khẩu vào React, .env.example hoặc GitHub. Mật khẩu được xác thực bởi Supabase Auth.
- `user_metadata` không được dùng phân quyền. Backend bắt buộc xét `app_metadata.role = admin` ở RLS.
- Client kiểm tra role để hiện UI, nhưng quyền thực sự nằm ở RLS database và Storage.
- Gỡ một ảnh dự án sẽ xóa ảnh khỏi slot, không tự khôi phục bìa mặc định; có thể tải ảnh mới sau đó.
- Chưa có người dùng admin nào được tạo tự động, vì kết nối Supabase của ChatGPT chưa được cấp quyền vào project Dortis.
