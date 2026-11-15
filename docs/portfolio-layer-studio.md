# Dortis — Visual layer editor kế thừa Form chung

## Mục tiêu

Không tạo 12 Form riêng từ mỗi Portfolio. Giữ blueprint trong artist_website_templates
và mỗi nghệ sĩ gán 1 phiên bản artist_website_instances.content khác nhau.
Bản ghi template quyết định số khu vực, tên khu vực, bố cục/effect gốc và số ảnh tối đa.
Bản ghi instance quyết định nội dung, nguồn trang PDF, ảnh riêng, và các thay đổi layer.

## Cấu trúc content

- content.sections[sectionId]: sourcePage và fieldOverrides, tiêu đề/nhãn phụ/mô tả
- content.images[sectionId:index]: file riêng trong dortis-artist-web-drafts
- content.scenes[sectionId].desktop: tùy chỉnh layer desktop
- content.scenes[sectionId].mobile: tùy chỉnh layer mobile

Mỗi scene có enabled=true, background, layers, notes[].
Các layer mặc định: eyebrow, title, body, image:0...image:N. Layer chữ trang trí
được thêm dưới ID note:<uuid>. Mỗi layer lưu x/y/w/h theo % của khung hình,
z, opacity, rotation, blur, radius, fit, font, size, color, letter spacing,
line-height, weight, hidden. Dữ liệu được sanitize ở client, không chấp nhận CSS tùy ý.

Hệ thống vẫn dùng resolveArtistPortfolio để liên kết chữ thật từ artist_profiles.
Layer chỉ sắp đặt và trang trí, không thay thế dữ liệu nguồn. Khi chỉnh text,
fieldOverrides của instance được đánh dấu, không sửa nội dung gốc đã duyệt.

## Dùng Studio

1. Vào Admin → Form Portfolio → chọn form gốc → chọn nghệ sĩ.
2. Chọn một khu vực trong cột trái.
3. Nhấn 'Bắt đầu thiết kế trang' hoặc 'Chỉnh trực tiếp trang này'.
4. Chọn layer chữ/ảnh, kéo vị trí trên canvas, kéo góc để resize, hoặc dùng
   phím mũi tên (Shift: nhanh). Chỉnh độ mờ, xoay, thứ tự z, font, màu,
   background ở bảng layer bên trái. Có thể thêm tối đa 8 lớp chữ trang trí.
5. Chuyển Desktop/Mobile để thiết kế hai bố cục độc lập.
6. Nhấn 'Xem toàn bộ bản hiện tại' để xem render qua chính renderer đã chỉnh.
7. Nhấn 'Lưu thay đổi' để ghi content phiên bản nghệ sĩ. Form gốc và
   các nghệ sĩ đang dùng cùng mẫu không bị tác động.

Mỗi khung ảnh vẫn là một slot ảnh riêng thuộc sectionId; ảnh PDF không bị tự
cắt và không bị tự gán vào website. Admin chọn ảnh gốc từ máy, tối đa 4 MB/ảnh.
Tắt Studio riêng cho một khu vực sẽ đưa khu vực đó về cách trình bày của Form gốc.

### Phạm vi

Đây là editor layer của các khu vực trong Form chung, không phải công cụ
chỉnh mọi đối tượng SVG, timeline hoạt họa, hoặc công cụ AI chỉnh ảnh.
Thứ tự layer trên canvas là z-index độc lập; dữ liệu profile và media Storage
vẫn có chính sách RLS hiện hành. Trang công khai khi triển khai phải dùng
PortfolioTemplateSite cùng content để hiển thị đúng cấu trúc đã duyệt.
