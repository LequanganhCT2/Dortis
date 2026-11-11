# DORTIS — Portfolio nghệ sĩ giữ nguyên bố cục PDF

## Chọn kiểu hiển thị

Trang Admin: /admin/artists

Mỗi hồ sơ nghệ sĩ có hai chế độ:

1. **Giữ nguyên PDF (mặc định):** PDF được dựng thành ảnh WebP/JPEG chất lượng cao theo đúng từng trang. Giữ tỷ lệ, bố cục, font, hình và vị trí chữ giống nguồn. Website có chế độ cuộn liền mạch hoặc từng trang, nhấn để phóng to.
2. **Thiết kế web HTML/CSS:** Giữ các section nội dung chỉnh sửa độc lập (tiểu sử, thống kê, gallery, giải thưởng, liên hệ). Responsive linh hoạt hơn nhưng không đảm bảo bố cục giống pixel PDF.

Admin có thể xem trước giống PDF. Việc tải ảnh lên khu vực công khai chỉ thực hiện khi Admin nhấn Xuất bản; PDF gốc vẫn nằm trong bucket riêng tư.

## Tương thích hồ sơ đã xuất bản

Hồ sơ Long Nhật đã có sections[].image_url chứa đủ 8 trang PDF. Chế độ Nguyên bản tận dụng ngay các ảnh sẵn có mà không yêu cầu nhập lại. Hồ sơ xuất bản theo cách mới dùng sections[].original_page_url và original_page_path. Khi chuyển về bản nháp hoặc xóa, các ảnh đã tải lên Storage sẽ bị thu hồi.

## Bộ dựng nguyên bản

- src/artistPdfOriginal.js dùng PDF.js 6 để dựng mỗi trang PDF thành ảnh WebP/JPEG, chiều ngang mục tiêu khoảng 1850px, kích thước mỗi file dưới 5MB.
- Ảnh quá lớn được giảm nhẹ độ phân giải hoặc chất lượng để đáp ứng giới hạn Storage.
- Các ảnh có đường dẫn riêng không trùng nhau để tránh cache CDN.
- Giữ đúng tỷ lệ trang PDF và hỗ trợ phóng to trên điện thoại.
- Không đưa nguyên file PDF vào khu vực công khai.

## Giao diện người xem

Người xem có thể chuyển qua lại giữa Bản gốc PDF và Thiết kế web khi đã có đủ trang gốc. Bản gốc hỗ trợ Cuộn liền mạch, Từng trang, phóng to và chuyển trang bằng nút mũi tên hoặc phím.

## Giới hạn

Chữ được giữ đúng vị trí nhưng nằm trong ảnh trang nên không chỉnh sửa bằng DOM. Độ nét ở mức phóng rất sâu phụ thuộc độ phân giải render. Một số sai khác nhỏ về màu hoặc khử răng cưa có thể xuất hiện. Chế độ HTML/CSS vẫn dành cho biên tập nội dung.

Cần kiểm tra quyền sử dụng ảnh và thông tin riêng tư trước khi công bố.

## Tệp liên quan

- src/ArtistOriginalPages.jsx + src/artist-original.css — viewer nguyên bản
- src/ArtistPortfolioViewer.jsx — chuyển chế độ Original / HTML/CSS
- src/artistOriginalData.js — ảnh cũ/mới và xem trước Blob
- src/artistPdfOriginal.js — render PDF
- src/AdminArtistProfiles.jsx — Admin chọn chế độ và xuất bản
- src/ArtistPages.jsx — tái sử dụng ảnh cũ Long Nhật
- supabase/dortis_artist_original_mode.sql — cột render_mode
