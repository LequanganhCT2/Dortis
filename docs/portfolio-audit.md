# Portfolio audit — Long Nhật Singer

**Document ID:** DORTIS-LNS-WEB-001 · **Ngày tạo khung:** 15/11/2026  
**Trạng thái:** `SOURCE_DETECTED_NEEDS_PAGE_AUDIT` — PDF nguồn 8 trang đã có trên Supabase, nhưng chưa kiểm tra trực tiếp toàn bộ trang text + ảnh từ file gốc.  
**Nguồn tin cậy:** Portfolio bản duyệt, xác nhận của nghệ sĩ/đại diện, asset gốc và văn bản phê duyệt phát hành.

## Danh mục kiểm tra nguồn

| Hạng mục | Tình trạng | Nguồn/trang |
|---|---|---|
| Tệp nguồn, version, số trang | SOURCE_DETECTED_NEEDS_AUDIT | Bảng `artist_profile_sources`: `PORFOLIO - LONG NHẬT SINGER.pdf`, 8 trang; chưa xác thực version PDF |
| Danh sách trang & mục đích | DB_METADATA_ONLY | Bảng `artist_profiles.sections` có 8 mục tương ứng; chưa phải kiểm tra trực tiếp từng trang PDF |
| Tên hiển thị | BRIEF_AND_DB | Brief: Long Nhật Singer; DB: Long Nhật; cần duyệt cách dùng tên trên website |
| Tiểu sử, thể loại, thế mạnh | IN_PORTFOLIO_UNVERIFIED | Nội dung đã nhập vào `artist_profiles.sections`, cần đối chiếu từng trang và xác nhận |
| Sự kiện / thành tích / đối tác / quote | MISSING | Không tự tạo claim |
| Ảnh, video, artwork và quyền sử dụng | PARTIAL_ASSET_IMPORTED | 18 ảnh web đã nhập ở 8 mục; chưa xác minh ảnh gốc/chất lượng giấy phép hoặc liên kết video chính thức |
| Font, màu, phân cấp chữ | MISSING | Cần phân tích từng trang ảnh |
| Phong cách bố cục, chất liệu nền | MISSING | Cần bằng chứng từ Portfolio |
| Email/điện thoại/Zalo booking | PUBLIC_APPROVAL_PENDING | Không công khai |
| Xác nhận release | APPROVAL_PENDING | Chặn production |

## Quy trình cập nhật khi nhận Portfolio

1. Đọc **toàn bộ trang** (vừa text vừa hình), ghi số trang/phiên bản/ngày.
2. Lập bảng **trang → nội dung → hình ảnh → chức năng website**; ảnh gốc ưu tiên hơn ảnh trích PDF.
3. Mỗi claim ghi nguồn cụ thể: `VERIFIED`, `IN_PORTFOLIO_UNVERIFIED` hoặc `MISSING`.
4. Liệt kê từng asset, đường dẫn, kích thước, quyền, mô tả và alt text.
5. Đối chiếu liên hệ với chủ sở hữu, đặt cờ `PUBLIC_APPROVED?` từng trường.
6. Chỉ chuyển sang `docs/visual-dna.md` khi có bằng chứng thị giác.
7. Không nhập dữ liệu nghệ sĩ trùng tên từ Internet như sự thật.

**Không thể xác nhận hoàn thành Phase A** cho tới khi đọc trực tiếp PDF nguồn gốc gồm tất cả trang chữ và ảnh, đối chiếu claims và kiểm tra quyền sử dụng. PDF đã được phát hiện trong Supabase nhưng bản thân truy vấn metadata không phải audit hình ảnh.

## Trạng thái nguồn hệ thống — 15/11/2026

Qua truy vấn đọc (không sửa dữ liệu) tại Supabase `whkqdusoowrrhtvejrie`:

- Bảng `artist_profiles`: hồ sơ `slug=long-nhat`, `status=published`, `render_mode=editorial`; có ảnh cover và tám mục nội dung.
- Bảng `artist_profile_sources`: tên file `PORFOLIO - LONG NHẬT SINGER.pdf`, metadata cho biết **8 trang**. File gốc đang lưu trong Storage, chưa được tải về đọc từng trang tại phiên này.
- `sections.media`: **18 ảnh** đã nhập dưới dạng ảnh web. Việc có ảnh URL không chứng minh ảnh gốc hoặc quyền phát hành cho website mới.
- Những dấu mốc, số liệu, sự kiện trong nội dung nhập được đánh dấu `IN_PORTFOLIO_UNVERIFIED`, không coi là `VERIFIED` chỉ vì record hồ sơ đã ở trạng thái `published`.

| Trang DB | Tiêu đề đang lưu | Chức năng dự kiến | Trạng thái |
|---|---|---|---|
| 1 | LONG NHẬT | Hero | Chưa đối chiếu trang PDF |
| 2 | Long Nhật | Giới thiệu | Claim cần xác minh |
| 3 | Thông tin biểu diễn | Thế mạnh | Claim cần xác minh |
| 4 | Dấu ấn biểu diễn | Selected highlights | Số liệu/claim cần xác minh |
| 5 | Gala Dinner | Tư liệu biểu diễn | Quyền ảnh cần xác minh |
| 6 | Year End Party | Tư liệu biểu diễn | Quyền ảnh cần xác minh |
| 7 | Music Show | Tư liệu biểu diễn | Quyền ảnh cần xác minh |
| 8 | Hình ảnh & Video | Thư viện ảnh | Chưa có link video chính thức được xác minh |

**Lưu ý:** Đây là mapping từ bản ghi cơ sở dữ liệu, không phải kết quả soi màu, font hoặc art direction của PDF. Thiết kế website mới chỉ chạy trong Admin Preview.
