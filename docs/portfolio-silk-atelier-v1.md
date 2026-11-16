# Dortis Silk Atelier · Form duy nhất (16/11/2026)

## Trải nghiệm

- Form dùng chung cho nhiều nghệ sĩ: 8 khu vực cơ bản, nội dung vẫn lấy từ
  hồ sơ nghệ sĩ và mỗi khu vực có slot ảnh riêng.
- Một trường Canvas dải lụa đỏ-vàng kéo dài toàn bộ Portfolio, nhiều nhánh
  chéo màn hình và chuyển động độc lập.
- Một lớp quầng sáng phủ trên cùng toàn bộ Portfolio, độ trong suốt tùy chỉnh
  0–55% tại Form gốc. Lớp này dùng pointer-events:none và reduced-motion để
  không chặn thao tác, không gây rối trong chế độ giảm chuyển động.
- Preview và chỉnh sửa trực tiếp sử dụng cùng RibbonPortfolioSection:
  không đổi sang layout MotionSection khi bấm nút chỉnh, tránh chập chờn
  giữa các trang. Kéo thả chữ/ảnh, resize, tải ảnh vào slot theo khu vực.
- Form gốc giữ bố cục, tiêu đề, hướng lụa, glow; bản nghệ sĩ giữ ảnh/chữ và
  tọa độ tùy chỉnh riêng; không tự sao chép ảnh từ PDF.

## Mẫu cũ

Không xóa vật lý các bản ghi cũ vì một số bản vẫn được dùng bởi website đã
xuất bản. Migration 20261116074500_silk_atelier_single_form.sql chuyển trạng thái
các Form cũ thành archived và tạo Silk Atelier active. Admin chỉ liệt kê
status active, nên người dùng thấy một Form. Các bản xuất bản cũ tiếp tục
truy cập theo instance ID cũ. Migration tạo bản nháp La Trinh trên Form mới
với trang nguồn 1,2,3,4,5,6,7,11, không chuyển ảnh.

## Kiểm tra

npm test và npm run build trước khi deploy. Kiểm tra thủ công bằng PDF
nhiều trang, 1–6 ảnh trong mỗi khu vực, desktop/mobile, direct edit,
preview, lụa di chuyển, glow 0%/28%/55%, website đã xuất bản và link cũ.
