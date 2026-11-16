# DORTIS / Hệ Form Portfolio dùng chung (nhiều nghệ sĩ kế thừa)

**Nguồn phương pháp:** `DORTIS_DESIGN_KNOWLEDGE_REFERENCE_ALL_IN_ONE_v2.pdf`, 15/11/2026. Tài liệu v2 **không** phải bộ nhận diện của Long Nhật hay bất cứ nghệ sĩ nào. Các màu của form là **PROPOSED**, cần phê duyệt riêng.

## Mô hình N:M

```text
                PORTFOLIO TEMPLATES
     ┌──────────────────────────────────────┐
     │ Editorial Story / Cinematic / Minimal│
     │ style + sections + layout + slots    │
     └─────────────┬────────────────────────┘
                   │ 1:M
     ┌─────────────▼────────────────────────┐
     │ artist_website_instances             │
     │ (template_id, profile_id, content)   │
     │ ảnh/text tách theo từng nghệ sĩ       │
     └─────────────┬────────────────────────┘
                   │ M:1
             ARTIST PROFILES
```

- Một form có **nhiều nghệ sĩ kế thừa**, và một nghệ sĩ có thể dùng **nhiều form khác nhau**.
- Form chỉ giữ cấu trúc: `blueprint.sections[]`, style, layout, thứ tự và số slot ảnh.
- Instance giữ `content.sections[sectionId]` (title, eyebrow, body), `content.images[sectionId:index]` (Storage path, alt).
- Khi sửa template, `version` tăng; renderer luôn đọc **bản mới nhất** của template. Không ghi đè JSON content của các instance.
- Khi sửa ảnh hoặc chữ tại instance A, chỉ ghi instance A. Bản của nghệ sĩ B không bị thay đổi.
- Hai phiên chỉnh sửa cùng một instance không âm thầm ghi đè: `revision` làm điều kiện cập nhật.
- Không cắt, trích hoặc tự nhập ảnh từ PDF. Mọi slot trống có placeholder; Admin tải ảnh lên từng vị trí.
- Ảnh lưu riêng tại bucket private `dortis-artist-web-drafts`, giới hạn 4 MiB, MIME JPG/PNG/WebP/AVIF. Xem trước bằng signed URL 1 giờ; không sử dụng public URL.
- Mọi thao tác bảng và ảnh bắt buộc `app_metadata.role=admin` qua Supabase RLS.
- Website mới vẫn là bản nháp nội bộ, không công khai booking chưa được duyệt.

## Cách sử dụng trong Admin

1. `/login` → Dashboard → **Mẫu Portfolio** hoặc `/admin/templates`.
2. Chọn một form (Editorial / Cinematic / Minimal), hoặc tạo form mới dựa trên một form đang có.
3. Trong thẻ form chọn nghệ sĩ → **Gán form**. Nghệ sĩ sẽ xuất hiện **ngay bên dưới form**. Có thể gán thêm nhiều người.
4. Chọn nghệ sĩ đang dùng form → chỉnh text từng section, tải từng ảnh (không liên quan PDF) và xem preview Desktop/Mobile.
5. Sửa form gốc: đổi layout, thứ tự, số slot ảnh hoặc thêm section; lưu để tất cả người đang dùng kế thừa.
6. Truy cập `/admin/artists` → chọn thẻ nghệ sĩ → **Chọn mẫu Portfolio** để lọc người đó.

## QA quan trọng

- N:M: 2 nghệ sĩ 1 form, 1 nghệ sĩ 2 form, các URL ảnh khác nhau và không bị lẫn.
- Tăng phiên bản template không mất nội dung từng instance.
- Kiểm tra RLS của cả bảng và Storage với session Guest (không thể đọc).
- Test MIME và file size; lỗi upload dọn file vừa tạo nếu lưu DB lỗi.
- Nội dung không có ảnh vẫn hiển thị placeholder; tránh tải ảnh từ PDF.
- Mobile: thanh chỉnh sửa xếp trên preview, không co trang; desktop: editor trái, preview phải.
- Các phương pháp lưới editorial, split, gallery và responsive lấy từ Reference v2, **không sao chép** màu/font của ví dụ minh họa.

### Luxury ribbon backdrop

Select **Nền khu vực → Lụa đỏ ánh kim** in the instance editor to apply the
SVG backdrop to Hero or another section. Set **Nền mặc định của Portfolio**
to apply it across sections, then choose **Tắt nền lụa** wherever needed.

The instance JSON uses `defaultBackdrop: 'luxury-ribbon'` and
`sectionBackdrops: { hero: 'luxury-ribbon', contact: 'none' }`. Omit a
section setting to inherit the instance default. Leaving both settings unset
preserves existing designs. The shared renderer receives the resolved
`section.backdrop` in preview and in the published snapshot. The layer editor
uses the same backdrop behind the artboard layers; switching it off restores
the artboard gradient and original text colors.
