# DORTIS / Generic Portfolio PDF Ingestion

Ngày cập nhật: 15/11/2026.

## Luồng dữ liệu áp dụng cho nhiều Portfolio

```text
Chọn file PDF (bất kỳ chủ thể Portfolio)
    → pdf.js đọc từng trang ngay trên trình duyệt Admin
    → tiêu đề gợi ý + body text gốc + trạng thái trang có/không có text layer
    → Admin nhìn PDF trong trình xem, sửa và xác nhận từng trang
    → INSERT artist_profiles (draft; sections JSONB)
    → /admin/artists: mỗi record là một người/chủ thể
    → /admin/templates: gán một hoặc nhiều template
    → artist_website_instances: các section kế thừa text đã duyệt
    → Admin tự tải từng ảnh gốc lên bucket private theo slot, không trích ảnh PDF
```

Không có quy tắc chỉ dành cho Long Nhật Singer, ca sĩ hoặc PDF 8 trang.
Hệ thống nhận nhiều lĩnh vực và số trang khác nhau (hiện giới hạn 60 trang, 100 MiB/file).

### Giới hạn chính xác và bảo toàn bằng chứng

- `extractArtistPdf` sử dụng PDF.js để đọc **lớp chữ chọn được** của PDF trước. Sau đó OCR tiếng Việt + tiếng Anh bằng Tesseract.js chạy trong trình duyệt cho cả trang có chữ lẫn trang chứa chữ dạng ảnh (tự động lần lượt tới 60 trang, có thể dừng và quét tiếp). Admin có thể chạy OCR từng trang hoặc quét lại các trang chưa duyệt.
- Khi PDF là ảnh quét / chữ đã flatten, OCR dùng ảnh render của PDF để gợi ý văn bản. Không đảm bảo chính xác 100%, nhất là tên riêng, dấu và số liệu. Nếu OCR không nhận diện được thì vẫn phải nhập thủ công.
- `sections.rawText` giữ văn bản từ PDF theo từng trang. Trong màn hình duyệt có `pdfText`, `ocrText`, độ tin cậy và văn bản ghép có lọc trùng. Sửa tay không bị tự động ghi đè khi quét lại.
- Cả tiêu đề gợi ý và loại bố cục đều phải được Admin đối chiếu. `reviewed=true` mới cho phép lưu.
- Người dùng có thể đổi tên, vai trò, từng tiêu đề, từng phần text. Hệ thống không khẳng định OCR chính xác tuyệt đối.
- Chỉ lưu `artist_profiles` (bản nháp) sau khi đã xác nhận mọi trang.
- PDF **không được upload**, không tạo `artist_profile_sources`, không tạo ảnh PDF hoặc crop. Browser object URL được thu hồi khi hủy/hoàn tất.
- PDF trên máy của Admin không bị xóa bởi website, vì web không có quyền xóa file cá nhân.
- PDF từ các quy trình **cũ** còn trên Supabase không bị xóa tự động: một số Portfolio đã công khai theo chế độ nguyên bản vẫn phụ thuộc vào các tệp đó. Xóa phải là migration riêng có audit.
- Nội dung đã duyệt vẫn phải xác minh claim và quyền sử dụng trước khi công khai. Mặc định `status=draft` và chưa có ảnh.

## Form dùng chung

- Templates: bố cục và số slot ảnh, hỗ trợ chỉnh sửa kế thừa.
- Profiles: dữ liệu PDF đã được duyệt, tách biệt với Template.
- Instances: bản sao nội dung riêng cho từng phép gán form × nghệ sĩ. Tự nạp các mục vào slot trống; Admin có thể gán lại trang bất kỳ.
- Giữ ảnh riêng `content.images[sectionId:index]` và các sửa đổi thủ công khi nạp lại nguồn.
- Không tự suy đoán email/booking khi PDF không có mục liên hệ.

## QA bắt buộc

1. PDF ca sĩ 8 trang có trang ảnh quét.
2. PDF nhiếp ảnh 3 trang, gallery ảnh.
3. PDF thiết kế/biên đạo 20 trang không có "Gala Dinner" hay ca hát.
4. PDF có tiêu đề dài, đoạn xuống dòng, trùng text; không tự xóa nội dung.
5. Nhập hồ sơ mới thành công, không xuất hiện PDF/ảnh phụ trong Storage.
6. Gán hồ sơ mới vào 2 form: chữ lấy đúng nguồn, không lẫn với người khác.
7. Chỉnh form gốc không ghi đè ảnh, chữ từng instance.
8. Hạn chế sản phẩm: cần kiểm thử tích hợp có session Admin thật, Safari/mobile và PDF scan nhiều trang.

## OCR trong trình duyệt (bổ sung 15/11/2026)

- Bộ nhận dạng: Tesseract.js 7, `createWorker(['vie','eng'])` dùng một worker cho nhiều trang. Ảnh trang render bằng PDF.js với giới hạn 3,5 triệu pixel để tránh tràn bộ nhớ.
- Dữ liệu nhận dạng (traineddata) và engine WebAssembly có thể được tải từ CDN vào trình duyệt ở lần OCR đầu. PDF/trang ảnh **không được tải lên Supabase hay dịch vụ OCR**.
- Tự OCR tất cả trang của PDF (tối đa 60 trang/file), kể cả trang có text layer; có tiến độ từng trang, có thể dừng và quét tiếp các trang chưa duyệt.
- Văn bản PDF và OCR được giữ riêng để đối chiếu; các khối có tọa độ chuẩn hóa được ghép theo vị trí, ưu tiên chữ PDF gốc và bổ sung khối OCR không trùng. Database lưu nội dung đã duyệt cùng xuất xứ từng khối; phần sửa tay không bị ghi đè.
- Nếu lỗi tải mô hình/không hỗ trợ WebAssembly, luồng nhập PDF vẫn hoạt động theo chế độ đọc lớp chữ và nhập tay. Không tự đoán chữ.
- OCR chạy trong trình duyệt, có thể mất thêm thời gian và tiêu hao CPU/bộ nhớ tùy số trang/độ phân giải.
- Các con số và tên người cần đối chiếu với PDF. Không thể cam kết không sai sót tuyệt đối; hệ thống bắt buộc xác nhận từng trang.
