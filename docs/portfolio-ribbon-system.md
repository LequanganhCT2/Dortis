# Dortis — Dải lụa Luxury Motion thống nhất ba Form Portfolio

Ngày 16/11/2026.

## Từ nhánh main hiện tại

Đã kiểm tra PRESET_FORMS gồm Editorial Story, Cinematic Stage và Minimal Signature.
Hai loại trình bày tiếp tục cùng tồn tại:
- Ribbon Luxury Motion: chế độ mặc định cho mọi Form, dùng cấu hình
  blueprint.visualTheme='ribbon-luxury' (mẫu cũ thiếu trường này vẫn mặc định).
- Classic: blueprint.visualTheme='classic', giữ lại các hiệu ứng trước đó.
- Tùy chỉnh từng trang của nghệ sĩ: content.scenes[sectionId][device] có quyền
  ưu tiên. Trong inspector, màu nền 'ribbon-luxury' cũng sử dụng đúng component
  SVG đang dùng bởi các trang mặc định.

## Ngôn ngữ nghệ thuật

PortfolioRibbonBackdrop.jsx + portfolio-ribbon.css dựng SVG đa lớp với
gradient kim loại vàng/đỏ, stroke ánh sáng, glow hậu cảnh và hạt sáng.
Mọi section dùng cùng chất liệu/nhịp chuyển động. Các biến thể hero/gallery/
standard chỉ thay độ nổi bật; vị trí đường cong thay rất ít theo index để tạo
nhịp chuyển cảnh nhất quán, không thay màu hoặc thiết kế giữa các trang.
Không sử dụng ảnh bitmap và không làm mờ ảnh người thật.

Các animation gồm silk breathing (21s), shimmer (19s), glow (16s),
sparkles (3.5–9.1s), biên độ nhỏ. IntersectionObserver dừng animation
khi khu vực ở ngoài viewport; media query prefers-reduced-motion loại bỏ
hoàn toàn animation. Mobile giới hạn số hạt hiển thị.

## Ảnh độc lập, không tự chồng lên nhau

RibbonPortfolioSection: mỗi file ảnh gốc của nghệ sĩ luôn nằm trong một CSS
Grid cell riêng với overflow:hidden và object-fit:cover. Không negative
margin, không absolute positioned photo; các ô placeholder vẫn là slot riêng.
Bố cục thực sự tách bản sao văn bản bên trái (hoặc trên) và album bên phải
(hoặc dưới); khi có nhiều ảnh, grid tự chia 2–3 cột theo số slot. Không ẩn
ảnh ở mobile, không crop méo, không dùng hình được cắt tự động từ PDF.

SectionArtboard layer editor: mặc định ảnh được tính toán bởi
automaticImageGeometry() cho desktop và mobile riêng, nằm trong photo-safe
region không giao với tiêu đề/nội dung; tất cả 1–10 ảnh không chồng nhau.
Nếu người dùng chủ động kéo ảnh lệch vị trí, nút 'Tự xếp ảnh' có thể khôi phục
lưới ảnh an toàn mà không thay đổi chữ, ảnh lưu hoặc source binding.

## Quy tắc kế thừa

artist_website_templates.blueprint: style, visualTheme, sections/effects/slots.
artist_website_instances.content: sections, images, scenes.
Một template có thể được gán cho nhiều nghệ sĩ; sửa ảnh/chữ/layer riêng ở
một instance không thay đổi blueprint chung và không ảnh hưởng người khác.

## Kiểm tra

npm test && npm run build.
Kiểm tra thủ công preview desktop/mobile trong /admin/templates, upload 1–10
ảnh cho một section, cắt chữ dài, chuyển giữa classic/ribbon, giảm chuyển động
hệ điều hành, kéo thả rồi bấm 'Tự xếp ảnh', dùng Enter/arrow trong layer editor.
