# OCR reading order – DORTIS

Ngày sửa 15/11/2026.

### Nguyên nhân đã kiểm tra từ mã
- Bản cũ ghép toàn bộ đầu ra OCR (full, left, right, top, bottom) bằng từng dòng và làm các từ trùng/lỗi chen vào văn bản chính.
- Văn bản PDF gốc trước đây có thể gộp hai cột nằm cùng cao độ (Y), nên thứ tự chữ bị lộn xộn.

### Thay đổi
1. OCR toàn trang yêu cầu Tesseract.js `blocks:true`, lấy các paragraph và vị trí `bbox`. Các dòng trong cùng paragraph được giữ liền và sắp theo vị trí.
2. Chỉ chọn **một bản OCR chính** cho ô văn bản. Không tự nối OCR cắt cột và cắt nửa trang. Phần khác chỉ là phương án để Admin xem/nhấn thêm riêng.
3. PDF text layer tách các cụm chữ cách xa nhau trên cùng một hàng trước khi sắp xếp các cột.
4. Nguồn PDF gốc và OCR được giữ riêng. Admin có thể chọn bản dùng, bổ sung theo khối hoặc theo vùng, sửa thủ công và xác nhận.
5. OCR lại thay thế bản OCR trước thay vì tích lũy lỗi của các lần quét.
6. Tiêu đề chỉ được gợi ý từ paragraph có dấu hiệu là heading, không lấy đại dòng OCR đầu tiên.

### Giới hạn
- Đây là heuristics theo bố cục PDF, không phải mô hình đọc hiểu ngữ nghĩa; layout poster quá phức tạp vẫn phải kiểm tra.
- Không có PDF LA TRINH gốc trong cuộc trò chuyện, nên không thể kiểm chứng độ chính xác từng đoạn ngay trên file đó.
- Các ảnh và PDF nguồn được xử lý tại trình duyệt, chỉ văn bản đã được xác nhận mới lưu vào cơ sở dữ liệu; không ảnh hưởng các hồ sơ đã lưu.
