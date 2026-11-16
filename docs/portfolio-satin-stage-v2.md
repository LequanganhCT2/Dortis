# Dortis Silk Atelier — nền sân khấu satin V2

Thiết kế ngày 16/11/2026 dựa trên hình tham chiếu của người dùng:
lụa sân khấu đỏ, quầng sáng vàng ở trung tâm, ánh lấp lánh và lớp ánh sáng
trong suốt phía trên nội dung.

## So với nền cũ

- Bỏ renderer `RibbonSilk` khỏi Portfolio hiện tại: không còn dải dạng
  ống chéo sáng đều nhau hoặc nền dải lụa lặp lại mỗi section.
- Dùng `SilkStageBackdrop` duy nhất ở cấp `PortfolioTemplateSite`.
  Một SVG cao bằng toàn bộ Portfolio; chiều cao cập nhật bằng ResizeObserver.
- `silkFabricGeometry` tạo ba tấm satin có bề rộng biến thiên, mép gợn,
  mặt sáng/mặt tối/nếp gấp và những đoạn bay chéo thay vì nét stroke đều.
  Mỗi tấm trôi rất chậm với chu kỳ riêng.
- Có vòng sáng vàng lớn ở phần đầu, các quầng sáng và hạt lấp lánh
  tiếp tục nhẹ nhàng xuống các khu vực phía dưới.
- `PortfolioGlowOverlay` tiếp tục nằm trên cùng, có thể chỉnh opacity
  0–55%, pointer-events:none, không cản thao tác.
- Ảnh thực không bị blur; những ô chưa có ảnh được ẩn khỏi preview công khai
  và preview bình thường, chỉ hiện trong chế độ chỉnh trực tiếp để tải ảnh.
- Form dùng chung, nội dung nghệ sĩ, các vị trí kéo thả và bản đã publish
  giữ nguyên. Không thực hiện migration DB.

## Tệp chính

- src/features/portfolio/templates/SilkStageBackdrop.jsx
- src/features/portfolio/templates/silkFabricGeometry.js
- src/features/portfolio/templates/silk-stage-backdrop.css
- src/features/portfolio/templates/PortfolioTemplateSite.jsx
- src/features/portfolio/templates/RibbonPortfolioSection.jsx
- tests/portfolio-satin-stage.test.mjs

Code cũ `RibbonSilk.jsx` được giữ trong git để bảo toàn lịch sử và khả năng
phục hồi, nhưng không được import/render bởi PortfolioTemplateSite hiện tại.
Không tải bitmap của hình tham chiếu làm nền trang.

## Kiểm tra

Chạy `npm test` và `npm run build`. Đối chiếu trình duyệt ở desktop và mobile:
nền lụa phải liên tục khi cuộn giữa 8 khu vực, ánh sáng trung tâm rõ,
chữ dễ đọc, ảnh sắc nét, chỉnh trực tiếp vẫn hoạt động, giảm chuyển động
của thiết bị không phát animation.
