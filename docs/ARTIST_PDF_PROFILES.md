# DORTIS — Artist portfolio PDF to real HTML/CSS

## Quy tắc dựng trang

**Một PDF = một nghệ sĩ = một đường dẫn /artists/<slug>.**
**Một trang PDF = một section HTML/CSS**, có nội dung, bố cục và ảnh nghệ sĩ được xử lý riêng.

Không xuất bản ảnh chụp nguyên trang PDF. Bộ hiển thị cũ dùng full-page screenshot đã được thay bằng các cấu trúc:
- Tiêu đề và mô tả là văn bản HTML thực, có thể chỉnh sửa trong Admin
- Các số liệu, giải thưởng, timeline, danh sách và thông tin booking là HTML
- Ảnh trong từng section là các vùng nhỏ được trích từ PDF gốc (cropped photo media)
- Màu sắc, gradient, bố cục, bóng đổ và chữ được tái tạo bằng CSS
- Responsive trên desktop, tablet và mobile

## Ba portfolio đã được dựng bố cục

Long Nhật: 8 section, Dark Stage + Gold. Nội dung: Hero, tiểu sử, thông tin biểu diễn, thống kê, Gala Dinner, Year End Party, Music Show, hình ảnh & video.

LuDance – Ngọc Trâm: 11 section, Ivory + Rose + Gold. Nội dung: Hero, tiểu sử, hành trình biên đạo, bằng khen, thành tích, hình thức biểu diễn, giá trị nghề nghiệp, video, trích dẫn, liên hệ.

La Trinh: 12 section, Cream + Rose Ribbon. Nội dung: Hero, hành trình âm nhạc, thống kê, thể loại, sự kiện, gallery biểu diễn, song ca, đơn ca, thư viện media, liên hệ, lời cảm ơn.

Mẫu nội dung và tỷ lệ vùng ảnh được biên tập dựa trên ba PDF gốc. Một số PDF đã raster hóa phần chữ nên không thể đọc toàn bộ bằng PDF.js; các phần này cần được Admin đối chiếu và kiểm duyệt trước khi xuất bản.

## Admin

- Mở /admin/artists.
- Tải một hoặc nhiều PDF. Bản nháp dùng mẫu dựng HTML/CSS phù hợp nếu trùng ba bộ portfolio đã hỗ trợ.
- Nếu dùng bản nháp được nhập từ trước: chọn hồ sơ, áp dụng bố cục PDF gốc, kiểm tra rồi lưu lại.
- Chọn bố cục cho từng section: cover, biography, feature, stats, gallery, awards, list, media, quote, contact.
- Chỉnh nhãn, tiêu đề, dòng phụ, nội dung, danh sách thành tích, thống kê.
- Chọn từng vùng ảnh bằng tỷ lệ X, Y, W, H theo % kích thước trang PDF; không dùng vùng cả trang.
- Xem trước HTML/CSS ngay trong Admin. Ảnh chỉ được dựng tạm trong trình duyệt và không tải lên công khai khi xem trước.
- Nhấn Xuất bản sau khi kiểm duyệt nội dung và có quyền sử dụng hình ảnh.

## Xuất bản

src/artistPhotoCrops.js dùng canvas tạm để lấy từng vùng ảnh riêng. Chỉ những file ảnh nhỏ đã chọn được upload sang bucket public dortis-artist-pages. Không upload ảnh nguyên trang. Văn bản và layout trên trang /artists/<slug> là DOM/CSS thật, không phải PDF viewer.

Với PDF chưa có template, hệ thống dựng section cơ bản và yêu cầu Admin chỉnh lại từng section. Không tự động tuyên bố chuyển đổi pixel-perfect một PDF tùy ý thành HTML/CSS.

## Bảo mật

PDF gốc nằm trong bucket riêng tư dortis-artist-pdfs. Chia thành các đối tượng tối đa 4 MiB để tránh giới hạn Supabase Free và ghép lại theo đúng byte khi xuất bản. Chỉ các profile đã xuất bản mới được đọc công khai qua RLS. Trước xuất bản phải rà soát ảnh, liên hệ và thông tin cá nhân.

## Mã nguồn

- src/artistLayouts.js — mapping 31 trang PDF thành các section
- src/ArtistPortfolioSections.jsx + src/artist-editorial.css — cấu trúc HTML và CSS
- src/artistPhotoCrops.js — vùng ảnh riêng, không xuất nguyên trang
- src/AdminArtistProfiles.jsx — nhập PDF, chỉnh section, xem trước, xuất bản
- src/ArtistPages.jsx — website nghệ sĩ
- src/artistPdf.js + src/artistPdfStorage.js — đọc và lưu PDF riêng tư
- tests/artistLayouts.test.mjs — kiểm tra các mapping
