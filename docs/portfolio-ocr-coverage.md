# Dortis – OCR cho Portfolio hỗn hợp PDF và ảnh

**Mục tiêu:** Đọc tất cả trang PDF dù đã có text layer, vì một trang có thể đồng thời có chữ selectable và chữ nằm trong ảnh Canva/Figma. Không hứa trích xuất chính xác 100%.

## Luồng

1. PDF.js đọc lớp chữ; giữ nguyên văn bản gốc.
2. Chạy Tesseract.js `vie+eng` **trên tất cả trang** của Portfolio (mặc định quét liên tiếp 24 trang đầu, trang chưa quét còn lại được hiển thị để Admin quét tiếp).
3. OCR toàn trang bằng `PSM.SPARSE_TEXT`; với tài liệu ngang hoặc trang có ít chữ thì đọc thêm hai cột có phần giao nhau. "Quét sâu" thêm hai nửa trên/dưới, độ phân giải cao hơn.
4. Trả kết quả **ngay sau từng trang** qua `onResult` và cập nhật bảng tạm trong trình duyệt. Dừng quét không xóa kết quả các trang đã hoàn thành.
5. Giữ các nguồn: text layer, tổng OCR, kết quả từng vùng. Ghép dòng khác nhau; bỏ bớt trùng gần đúng; không bao giờ xóa văn bản nguồn chỉ vì OCR không nhìn thấy.
6. Admin đối chiếu từng trang, sửa chữ và xác nhận rồi mới lưu `artist_profiles.sections`. Chỉ giữ dữ liệu đã duyệt, không upload PDF hay ảnh trang lên Supabase.
7. Thao tác sửa chữ thủ công được giữ nguyên khi quét lại.

## Giới hạn và điều kiện kiểm thử

- OCR trên thiết bị client tiêu thụ CPU/RAM, đặc biệt với nhiều trang và pass. Worker và canvas được giải phóng theo trang.
- Bộ ngôn ngữ và engine có thể cần tải từ CDN lần đầu. Nếu tải lỗi sẽ hiển thị lỗi, không giả định đã đọc thành công.
- Với file PDF LA TRINH, chưa có tệp gốc trong cuộc hội thoại này (chỉ có ảnh chụp). Kiểm thử tích hợp trên đúng file đó vẫn chưa được xác minh.
- Tiêu đề, tên riêng, số liệu 10 năm và nội dung booking cần kiểm tra bằng mắt; confidence không chứng minh tính đúng của từng ký tự.
- File trên máy Admin không bị trang web xóa. PDF không lưu lên server trong luồng nhập mới.
