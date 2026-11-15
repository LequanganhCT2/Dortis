# Dortis — OCR AI theo lựa chọn của Admin

Ngày: 15/11/2026.

## Hai chế độ tại /admin/artists

- Trên thiết bị (mặc định): PDF.js + Tesseract.js. Không gửi PDF lên dịch vụ OCR, giới hạn 100 MiB/60 trang.
- Mistral OCR 4.1 qua API (mistral-ocr-latest): đọc chữ nằm trong ảnh, tiêu đề, bảng và khối có tọa độ theo thứ tự. Giới hạn an toàn 50 MiB/60 trang. Có phí theo trang; chỉ dùng khi Admin tự bật và xác nhận gửi tài liệu.
- Gemini (tùy chọn): chỉ nhận văn bản OCR; gợi ý loại section và tiêu đề thực có trong trang, không tự điền nội dung. Khi Gemini chưa cấu hình hoặc lỗi, vẫn giữ nội dung Mistral.
- Sau OCR, Admin vẫn kiểm duyệt và chỉnh từng trang trước khi lưu artist_profiles.sections. Chỉ lưu body, text_blocks, extraction; không giữ PDF mới trong hồ sơ.

## Cấu hình

Vercel → dortis → Settings → Environment Variables:

- MISTRAL_API_KEY: API key Mistral (bắt buộc khi chọn OCR AI)
- GEMINI_API_KEY: API key Gemini (tùy chọn)
- GEMINI_MODEL: mặc định gemini-2.5-flash

Tất cả là biến môi trường CHỈ phía server: không tiền tố VITE_, không commit khóa hay truyền khóa cho browser.
Ứng dụng sử dụng sẵn biến VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY phía server để xác minh JWT; có thể dùng alias SUPABASE_URL và SUPABASE_PUBLISHABLE_KEY nếu có. Không cần service-role key.
Sau khi thêm khóa, redeploy production. API GET /api/portfolio-ocr cho Admin đã đăng nhập xem trạng thái bật/tắt mà không tiết lộ khóa.

## Luồng PDF và quyền riêng tư

1. Browser đọc số trang PDF và tạo bản xem trước; không upload nếu chọn OCR cục bộ.
2. Chỉ khi Admin chọn Mistral và đồng ý chia sẻ tài liệu, PDF mới upload vào bucket riêng tư dortis-ocr-temp tại <user-id>/<uuid>.pdf, trực tiếp từ trình duyệt.
3. Vercel API xác minh JWT (Supabase auth.getUser), app_metadata.role=admin, quyền sở hữu path, dung lượng, MIME. API tạo signed URL 10 phút bằng quyền user và gửi cho Mistral. Dữ liệu OCR trả về là text/metadata, không có hình ảnh base64.
4. API và browser đều yêu cầu xóa PDF tạm trong finally. Nếu trình duyệt đóng trước khi xóa, file cũ thuộc đúng tài khoản sẽ được dọn khi Admin lần sau upload PDF. Admin có thể kiểm tra bucket; không thể bảo đảm tệp do Mistral/Gemini nhận được bị xóa tức thì khỏi hệ thống riêng của họ.
5. PDF trên máy Admin không bị xóa. Nội dung AI phải được đối chiếu tên, số liệu, dấu và thứ tự trước khi đánh dấu đã duyệt.

Migration: supabase/migrations/20261115102100_portfolio_cloud_ocr_temp.sql tạo bucket private với các policy chỉ cho Admin trên đúng thư mục user. Các PDF cũ trong dortis-artist-pdfs không bị đụng tới.

## Kiểm thử

Chạy npm test và npm run build.
Kiểm tra PDF thực: file Canva có nhiều cột, scan ảnh, chữ nhỏ đè ảnh, tiếng Việt, nhiều trang, tài liệu >50 MB, mạng yếu, nút dừng, không còn file tạm sau khi xử lý.
Mistral/Gemini yêu cầu API key và có thể phát sinh chi phí; không có công nghệ OCR nào cam kết chính xác tuyệt đối. Chế độ Tesseract vẫn hoạt động khi chưa cấu hình Mistral.
