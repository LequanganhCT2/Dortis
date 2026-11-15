# DORTIS / Kiến trúc phát triển dài hạn

**Bản định hướng v1** — nhánh phát triển, không tự thay production.  
Nền tảng: React/Vite, Supabase Auth + Postgres/RLS, Vercel.

## Phân quyền

| Nghiệp vụ | Guest | Admin |
|---|---:|---:|
| Xem DORTIS public và hồ sơ đã xuất bản | ✓ | ✓ |
| Đăng nhập | Không có UI đăng nhập guest | ✓ (email/password) |
| Quản trị Media, nội dung, hồ sơ | ✗ | ✓ |
| Xem bản nháp Long Nhật Singer | ✗ | ✓ |
| Phát hành Long Nhật Singer | ✗ (chưa duyệt) | Chỉ khi đủ input & quyền phát hành |

Quyền trên giao diện chỉ là UX. Quyền **ghi** phải được Supabase RLS kiểm tra bằng JWT `app_metadata.role=admin`. Không dùng `user_metadata` do người dùng có thể tự sửa. Không có signup/guest account, không public service-role key. Guest xem anonymous public data.

## Phân lớp

```text
src/
  app/
    routes.js             # Định tuyến tường minh / điều kiện phát hành
    AppRouter.jsx         # Chọn các trang, tách Admin khỏi Public
  core/
    auth/roles.js         # Quyền và chính sách khả năng truy cập (pure)
  infrastructure/
    supabase/client.js    # Một Supabase client dùng chung
  features/
    admin/AdminWorkspace.jsx     # Shell admin, navbar và quick-edit
    media/
      config/mediaGroups.js      # Cấu hình danh sách khu vực chỉnh sửa
      hooks/useSiteImages.js     # Public read model
    portfolio/long-nhat/
      data.js                    # Trạng thái nguồn/chờ duyệt
      LongNhatPortfolio.jsx     # Bản nháp nội bộ, Quick/Immersive
  pages/
    DortisHome.jsx              # Trang public cũ được tách khỏi entry
  shared/ui/
    index.jsx                   # UiButton/UiPanel/UiStatus/UiNavLink
    ui.css                      # Một file style chung cho phần mới
  main.jsx                     # Entry gọn, không chứa nghiệp vụ
```

Dữ liệu/logic cần qua các module `core`, `features`, `infrastructure`; UI dùng component `shared`. Lớp công khai không import `AdminPage` để lấy Supabase client nữa.

## Lộ trình chuyển đổi phần legacy

1. Hoàn thành **lớp nền**: route, RBAC, Admin Navbar, UI primitives, Portfolio draft, tests (đợt này).
2. Trích xuất dần các component HomePage từ `src/pages/DortisHome.jsx` theo từng feature (Hero, Services, Projects, FAQ, Contact). Không làm lại tất cả CSS trong một commit để tránh lỗi layout.
3. Chuẩn hóa Media repository/service và validation phía server/RLS; xóa logic upload trùng khi đã có regression test.
4. Tách các editor legacy (`AdminMediaEditor`, `AdminHeroCards`, `AdminMediaSlots`, `AdminArtistProfiles`) thành module riêng theo use case; chuyển CSS cũ thành tokens + shared utilities có kiểm thử visual.
5. Chỉ sau khi nhận và phân tích Portfolio: xây design system Long Nhật độc lập, hoàn thiện Quick EPK/Immersive và booking CTA đúng tài sản cấp phép.

**Clean Architecture thực dụng:** Dependency direction `UI → use case → data contract → infrastructure` là đích đến. Đợt này đặt ranh giới chính, **chưa tuyên bố toàn bộ các editor cũ đã đạt Clean Architecture**.

## Nguyên tắc thay đổi

- Một cấu hình Media duy nhất trong `mediaGroups.js`; navbar và editor dùng chung.
- Một Supabase client tại `infrastructure`; không import client từ component admin.
- Không hardcode thông tin booking/artist vào component; public page chỉ đọc dữ liệu `published`.
- Mọi thao tác cập nhật bảo vệ bằng `app_metadata.role`, RLS, mutation acknowledgement.
- Giữ UX không full reload khi chuyển tab trong admin.
- Thay đổi lớn làm trên feature branch; CI build/test rồi mới duyệt merge.

## Phòng tránh lộ bản nháp Portfolio

Bảng `site_content` hiện có policy SELECT công khai vì đó là dữ liệu website đã phát hành. **Không** ghi Portfolio Long Nhật chưa duyệt, nguồn nội bộ, thông tin booking riêng tư hay asset hạn chế quyền vào bảng này. Giai đoạn hiện tại chỉ đặt placeholder không nhạy cảm trong code. Khi nhận tài liệu thật, cần một repository/table nháp **private** có RLS admin-only, sau đó chỉ xuất snapshot đã duyệt sang bảng public.

Các trang public và Admin được tách bằng `React.lazy`/dynamic import nhằm giảm JS của Guest; việc tách bundle **không thay thế RLS hoặc xác thực từ Supabase**.

## Nguyên tắc kiểm thử/phát hành

- `npm test`: route, roles, điều kiện release Long Nhật và bộ kiểm thử Media cũ.
- `npm run build`: Vite build với lazy routes.
- Chạy trên nhánh `feat/clean-architecture-long-nhat`; Vercel Preview, không tự gán alias `dortis.vercel.app`.
- Chỉ merge sau khi nghiệm thu visual, kiểm tra login/logout, Back/Forward, sticky quick-edit, mobile và dữ liệu đang có.

## Sửa lỗi điều hướng và tải trang đầu (15/11/2026)

- Homepage được import đồng bộ trong `AppRouter`: không còn màn hình Suspense toàn trang khi người dùng mở lần đầu.
- Admin và Artist Pages vẫn được tải khi cần; React Transition giữ trang cũ trong khi tải route mới.
- Điều hướng `same-origin` được bắt từ anchor thông thường, dùng History API và `popstate`; tương thích Back/Forward, nút mở tab mới và modifier keys.
- Điều hướng trong Admin sử dụng chung `clientNavigate`, không tải lại cả ứng dụng.
- Chuyển cảnh dùng opacity nhẹ; **không dùng transform trên wrapper**, để không phá fixed/sticky navbar.
- Nếu tải một module lỗi, hiển thị đường phục hồi rõ ràng thay vì treo trang trắng.
- Việc build thành công không thay thế kiểm thử UI thực tế, đặc biệt lần truy cập đầu tiên ở mạng chậm.

## Routes /login và /admin (15/11/2026)

- `/login`: duy nhất nơi hiển thị form đăng nhập. Chỉ Admin được xác thực và đi tiếp.
- `/admin` và `/admin/*`: trang riêng được bảo vệ bởi Supabase Auth và `app_metadata.role=admin`; Guest chuyển sang `/login`.
- Admin đã đăng nhập vào `/login` sẽ chuyển về `/admin`.
- Đăng nhập thành công đưa người dùng đến `/admin`; đăng xuất về `/login`.
- Hai route dùng chung một phiên kiểm tra quyền và chuyển bằng History API để không tải lại toàn bộ trang.

## Admin Sidebar + Portfolio Library (15/11/2026)

- Dashboard xuất hiện sau đăng nhập tại `/admin`, có hai khu vực chính: **Website DORTIS** và **Hồ sơ nghệ sĩ**.
- Thanh điều hướng cố định bên trái trên desktop, ngăn kéo trên mobile; chọn Media nhanh trong sidebar, không tạo Navbar ngang thứ hai.
- `/admin/artists` hiển thị **mọi Portfolio có thật** trong `artist_profiles`, lọc theo bản nháp/công khai và tìm kiếm; chọn thẻ để dùng editor PDF hiện có.
- Từ 15/11, `/admin/portfolio` là bản xem trước website nghệ sĩ Long Nhật truy cập qua nút trong thẻ Portfolio thật tại `/admin/artists`; vẫn chung Sidebar Hồ sơ nghệ sĩ.
- Không tạo hồ sơ/ảnh/chứng thực giả. Cấu trúc Long Nhật Singer trong `features/portfolio/long-nhat` được giữ lại làm tài liệu kỹ thuật nội bộ nhưng không đại diện cho một record lưu trữ.
- Chỉ dùng một file style cho workspace và tái sử dụng `UiButton`, `UiPanel`, `UiStatus`; phần danh sách được trích thành `ArtistPortfolioCatalog`.

## Long Nhật Singer Artist Website Studio (15/11/2026)

- `/admin/portfolio` — route **Admin-only** hiện rõ trong Sidebar Hồ sơ nghệ sĩ, thẻ Long Nhật của thư viện và Dashboard.
- Đọc trực tiếp `artist_profiles` và metadata `artist_profile_sources` bằng Supabase client đã xác thực; không tạo hồ sơ thứ hai, không dùng private `pdf_storage_path` làm public URL.
- Pure adapter `features/portfolio/long-nhat/websiteModel.js` mapping `sections` hiện có sang Hero, giới thiệu, thế mạnh, biểu diễn, video (nếu link thật), gallery và footer.
- `LongNhatPortfolio.jsx` quản lý hai layout Quick EPK / Immersive, xem mobile/desktop, lightbox keyboard/Escape, báo cáo điều kiện phê duyệt. CSS riêng neutral provisional **không** phải palette Long Nhật đã được duyệt.
- Existing `/artists/long-nhat` vẫn giữ nguyên; việc profile có `status=published` không mở khóa phát hành website nghệ sĩ mới. `/portfolio/long-nhat` tiếp tục hiển thị trạng thái chưa phát hành.
- Chưa có PDF visual audit, media rights approval, contact booking được phê duyệt hoặc design tokens khóa: phải hoàn thành trước khi đăng website riêng công khai.

## Portfolio Form Inheritance v2 — 15/11/2026

- `/admin/templates`: Thư viện **nhiều form Portfolio** có thể dùng chung cho nhiều nghệ sĩ.
- `/admin/portfolio`: Đường dẫn cũ về cùng trình quản lý nhiều form; không còn hardcode riêng Long Nhật.
- `artist_website_templates`: blueprint/layout, style, version và thứ tự section. Cập nhật blueprint kế thừa xuống tất cả instances.
- `artist_website_instances`: quan hệ N:M giữa `artist_profiles` và templates. Mỗi instance giữ `content.sections` + `content.images` riêng, không sửa hồ sơ công khai.
- `dortis-artist-web-drafts`: Storage **private**, RLS Admin-only; ảnh JPG/PNG/WebP/AVIF 4MB được tải lên từng slot; URL xem trước là signed URL có thời hạn.
- Phân quyền bằng `auth.jwt().app_metadata.role=admin` trên bảng và Storage; không có client-side service role.
- Tạo thêm mẫu bằng clone blueprint hoặc chỉnh section / thứ tự / layout / số slot. Không xóa dữ liệu nội dung riêng khi form thay đổi.
- Ảnh không lấy từ PDF. PDF Design Knowledge Reference chỉ cung cấp phương pháp lựa chọn layout, type, image safe zone, responsive, motion accessibility, không áp đặt palette/identity.
- Đầu ra hiện tại là **Admin-only draft**; không xuất bản website nghệ sĩ riêng khi chưa duyệt nguồn, quyền media và contact.
