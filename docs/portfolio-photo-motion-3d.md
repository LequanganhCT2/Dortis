# Dortis Silk Atelier — CSS 3D Photo Motion

Cập nhật ngày 16/11/2026.

## Điều khiển trong Admin

Mỗi ảnh được lưu riêng theo slot `artist_website_instances.content.images[sectionId:index]`, không thay đổi Form dùng chung, hồ sơ PDF hoặc ảnh gốc. Trong bảng Ảnh riêng của khu vực:

- **Kiểu chuyển động:** Tĩnh, Bay nhẹ, Chiều sâu 3D, Nghiêng theo chuột, Quỹ đạo, Nhịp thở, Hút theo chuột, Spotlight 3D.
- **Cường độ:** 0–100%, mặc định 45%.
- **Theo vị trí chuột:** có thể bật/tắt, mặc định bật.
- Lựa chọn dùng chung trong trang preview và sau khi bấm **Cập nhật website**.

Ảnh cũ mặc định `float` và cường độ 45%, nên không cần tải lại. Không sử dụng GIF/video hoặc thư viện JS animation mới.

## Kiến trúc

- `photoMotionConfig.js` xác thực mode, cường độ, pointer và tính offsets có giới hạn.
- `PhotoMotion.jsx` bọc riêng nội dung ảnh trong hai lớp, tách biệt khỏi mọi translate/scale mà Admin dùng để di chuyển/sửa kích thước ô ảnh.
- `photo-motion.css` dùng transform 3D kết hợp với animation CSS, độ mạnh theo cường độ và nhiều thời gian/biên độ khác nhau.
- Vị trí chuột chỉ cập nhật biến CSS qua requestAnimationFrame, **không set React state mỗi frame**.
- IntersectionObserver tạm dừng animation cho ảnh ngoài viewport. Trên màn hình cảm ứng không dùng mouse parallax; ở `prefers-reduced-motion` tất cả biến đổi và animation tự dừng.
- Trong chế độ chỉnh trực tiếp / kéo resize: animation bị tạm dừng, giữ nguyên hitboxes, layer position và thao tác upload.
- Có trong `RibbonPortfolioSection` (Silk Atelier), `MotionSection` (mẫu cũ) và `SectionArtboard` (các trang có layer tuỳ chỉnh).
- PNG có Aura/Glass/Bare vẫn giữ hiệu ứng nền đã chọn và bóng `drop-shadow` bám sát alpha của ảnh, không có khung bóng hình chữ nhật.
- Thay file trong cùng slot giữ lựa chọn motion cũ.

## Kiểm thử

`npm test && npm run build`.

Kiểm tra thủ công desktop/mobile, hover vào tâm và các góc ảnh, ảnh PNG có Aura, 4–6 ảnh cùng lúc, thao tác kéo ảnh khi vào Chỉnh trực tiếp, giảm chuyển động hệ thống và ảnh đã xuất bản.
