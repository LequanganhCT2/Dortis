# Dortis — Dải lụa liền mạch xuyên suốt Portfolio

Ngày 16/11/2026.

## Thiết kế

- Portfolio sử dụng **một trường Canvas duy nhất** ở cấp trang, không dựng lại lụa ở đầu mỗi section.
- Bốn nhánh đỏ, vàng ánh kim, hồng và đồng chuyển động độc lập với chu kỳ 19, 27, 23 và 32 giây.
- Hình học gồm các đường **chéo lớn vắt ngang màn hình**, giao cắt rồi tách ra. Phần lớn đoạn đường gần thẳng theo hướng chéo; đoạn đảo chiều được bo ở ngoài biên viewport.
- Mỗi Form giữ riêng hai lựa chọn kiểu và hướng lụa; cả ba mẫu Editorial Story, Cinematic Stage và Minimal Signature dùng chung kiến trúc.
- Ảnh nghệ sĩ nằm trong ô Grid độc lập, giữ nguyên độ sắc nét. Layer Studio tiếp tục hỗ trợ kéo thả.
- Chế độ giảm chuyển động của hệ điều hành dừng animation.

## Kiến trúc

- ribbonGeometry.js: sinh các tọa độ nhánh theo không gian toàn bộ tài liệu.
- RibbonSilk.jsx: bốn Canvas theo toàn bộ chiều cao của Portfolio, vẽ lại khi kích thước hoặc lựa chọn Form thay đổi; không vẽ lại mỗi frame.
- portfolio-continuous-silk.css: một nền xuyên suốt, màu chữ dễ đọc, ảnh giữ sắc nét và các nhánh có thời gian chuyển động riêng.
- PortfolioTemplateSite.jsx: lắp đúng một nền toàn trang trong preview và bản xuất bản.
- RibbonPortfolioSection.jsx: chỉ còn Grid ảnh và văn bản, không tự tạo nền lụa từng trang.
- SectionArtboard.jsx: khi nền toàn trang hoạt động, không vẽ lặp nền riêng trong artboard.

## Kiểm thử

Chạy npm test && npm run build. Kiểm tra trên desktop/mobile, portfolio dài nhiều section, hình ảnh nhiều ô, giao diện kéo thả và bản đã xuất bản.
