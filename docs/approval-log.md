# Long Nhật Singer — approval log

Document ID: `DORTIS-LNS-WEB-001` · cập nhật 15/11/2026.

| Gate | Status | Bằng chứng cần có |
|---|---|---|
| Nguồn PDF có trong DB | SOURCE_DETECTED | Tên file và 8 trang metadata từ Supabase |
| Toàn bộ PDF text/visual audit | PENDING | Review từng trang với bằng chứng |
| Claim nghệ sĩ / sự kiện | IN_PORTFOLIO_UNVERIFIED | Xác nhận Giám đốc/nguồn |
| Quyền tư liệu ảnh, video, nhạc | PENDING | Danh sách giấy phép/phạm vi |
| Visual DNA / palette A-B | PENDING | Bảng so sánh dựa trên các trang PDF |
| Thiết kế Website Long Nhật | PROVISIONAL_NOT_APPROVED | Admin Preview; bản chính thức cần Giám đốc duyệt |
| Booking/email/Zalo công khai | PENDING | Xác nhận đầu mối và quyền công khai |
| Release riêng `/portfolio/long-nhat` | BLOCKED | Tất cả gate trên phải đạt |

**Không tự coi `artist_profiles.status=published` là phê duyệt website nghệ sĩ độc bản mới.**
