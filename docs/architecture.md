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
