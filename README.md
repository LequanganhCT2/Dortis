# DORTIS — Artist Profile Platform

Giao diện trang chủ và hồ sơ nghệ sĩ công khai của **Dortis**, được dựng lại từ phần **HomePage** trong file `Capstone_SAW_FE.rar` mà người dùng cung cấp. Đây là dự án React + TypeScript + Vite riêng, **không** mang theo chức năng nghiệp vụ kho nông sản hay đăng nhập của SAW.

## Phạm vi đã triển khai

- Trang chủ công khai toàn màn hình: hero, thanh navigation active-pill, nội dung Dortis, thẻ tính năng, danh sách nghệ sĩ, giới thiệu hành trình, đối tác, FAQ, footer.
- Giữ và chuyển thể các hiệu ứng Home gốc: `useHomeWheelSmoothing`, `useHomeSequentialReveal` (fade-in/fade-out theo thứ tự và theo hướng cuộn), `showNavigationRipple`, CSS scroll-timeline, ảnh hero zoom, cursor ring; hỗ trợ `prefers-reduced-motion`.
- Responsive mobile, menu điện thoại mở/đóng, không có login.
- Danh sách nghệ sĩ có tìm kiếm và lọc thể loại; nhấn thẻ mở trang `/nghe-si/:slug`.
- Hồ sơ nghệ sĩ: thông tin nghệ danh, tiểu sử, khu vực, thể loại, link xã hội công khai và sản phẩm âm nhạc.
- Frontend kết nối **Supabase Data REST API** với RLS; không cần thêm package SDK. Có chế độ demo nếu chưa cấu hình public key. Không ghi database và không giả vờ là kết nối thật khi chạy demo.

## Chạy trên máy

Yêu cầu Node.js 22.12 trở lên (khuyến nghị bản 22 LTS mới nhất). Tại thư mục Dortis:

```bash
npm ci
cp .env.example .env
npm run dev
```

Trên Windows PowerShell, dùng `Copy-Item .env.example .env`. Nếu PowerShell chặn npm.ps1, chạy `npm.cmd ci` / `npm.cmd run dev`.

Mở `http://localhost:5173`. Kiểm tra build bằng `npm run build` và lint bằng `npm run lint`.

## Kết nối database Dortis

Database người dùng cung cấp: `https://whkqdusoowrrhtvejrie.supabase.co`.

1. Trong Supabase Dashboard, chọn **đúng project Dortis** (project ref `whkqdusoowrrhtvejrie`). Chạy `supabase/schema.sql` trong SQL Editor nếu hai bảng chưa có.
2. Nếu muốn xem dữ liệu minh hoạ từ DB **test**, có thể chạy `supabase/sample-data.sql`. Không cần chạy file mẫu để sử dụng thật.
3. Vào **Project Settings → API Keys**, lấy **Publishable key** (dạng `sb_publishable_...`), điền trong `.env`:

   ```dotenv
   VITE_SUPABASE_URL=https://whkqdusoowrrhtvejrie.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...YOUR_KEY...
   ```

4. Restart dev server. Frontend sẽ đọc `public.artists` và `public.artist_works`, chỉ hiển thị hồ sơ/tác phẩm có `is_published=true`.
5. Dự án Supabase gần đây có thể yêu cầu bật expose bảng trong **Integrations → Data API**; kiểm tra Data API settings nếu gặp mã `PGRST...` dù đã cấp GRANT và RLS.

**Lưu ý:** trong phiên làm việc này quyền truy cập database Supabase được chia sẻ chưa bao gồm project `whkqdusoowrrhtvejrie`. Vì vậy source đã sẵn kết nối nhưng **chưa thể xác nhận bảng đã được tạo hoặc dữ liệu được đọc thành công trên project thực tế**. Đừng đưa `service_role`, `sb_secret_...`, mật khẩu DB vào file `.env` frontend. `VITE_*` đều công khai khi build.

## Cấu trúc

```text
src/
  components/BrandMark.tsx    # Dortis logo
  components/ArtistCard.tsx   # thẻ hồ sơ nghệ sĩ
  components/ArtistCatalog.tsx# danh sách, bộ lọc, lấy dữ liệu
  pages/HomePage.tsx          # home với bố cục gốc được chuyển thể
  pages/home.css              # chuyển từ source home.css SAW
  pages/dortis.css            # theme và UI Dortis
  pages/ArtistProfilePage.tsx # chi tiết hồ sơ
  pages/profile.css           # style chi tiết hồ sơ
  hooks/                      # scroll, reveal, ripple từ Home gốc
  services/artists.ts         # data API Supabase và demo fallback
  types/artist.ts             # định nghĩa dữ liệu
  data/demo.ts                # dữ liệu giao diện chỉ để demo
supabase/schema.sql          # SQL chỉ đọc công khai, có RLS
supabase/sample-data.sql     # dữ liệu giả tùy chọn
```

## Chế độ demo và hình ảnh

Không có Publishable key => trang hiển thị 3 ca sĩ **hư cấu**, ghi rõ là hồ sơ minh hoạ. Khi đã cấu hình DB, trang dùng dữ liệu thật, không trộn demo vào DB. Dữ liệu thật không có thì có thông báo trạng thái trống, lỗi REST không được che giấu.

Các ảnh nền sân khấu trong trang chủ sử dụng URL ảnh Unsplash bên ngoài (không phải ảnh ca sĩ demo). Khi triển khai chính thức, nên thay bằng ảnh sân khấu/phát hành do chủ dự án có quyền sử dụng. Ảnh minh hoạ hero tham khảo từ một tác phẩm ảnh Unsplash của cộng đồng, các ảnh khác cũng chỉ mang tính chất moodboard. Giao diện vẫn có nền gradient nếu ảnh CDN không tải được.

## GitHub

Repo đích: https://github.com/LequanganhCT2/Dortis.git. Repo hiện trống và quyền GitHub hiện chỉ có `pull`, không có `push`; vì vậy gói này được cung cấp để bạn push sau, chưa tự cập nhật lên repo.

```bash
git clone https://github.com/LequanganhCT2/Dortis.git
# Sao chép toàn bộ nội dung thư mục Dortis vào thư mục repo đã clone.
git add .
git commit -m "feat: build Dortis artist homepage and Supabase public catalog"
git push origin main
```

Không push `.env`, `node_modules` hoặc `dist`.

## Kiểm tra an toàn source tham khảo

File `eslint.config.js` trong bản nén tham khảo có đoạn JavaScript bị làm rối nằm sau cấu hình chuẩn. Vì không liên quan đến Home UI và không thể xác minh an toàn, Dortis **không sao chép hoặc thực thi đoạn đó**; `eslint.config.js` trong gói này đã được viết lại từ đầu. Không nên chạy trực tiếp cấu hình lint trong bản RAR tham khảo trước khi tự kiểm tra kỹ.

## Kết quả kiểm tra trong phiên này

- `tsc --noEmit -p tsconfig.app.json`: đạt.
- ESLint `src --max-warnings 0`: đạt.
- Bước đóng gói Vite **chưa xác nhận** tại đây: thư mục `node_modules` trong RAR là bản cài Windows, thiếu native binding Rolldown dành cho Linux. File giao cho bạn không bao gồm `node_modules`; chạy `npm ci` trên môi trường máy của bạn trước khi `npm run build`.
