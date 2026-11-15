# Portfolio audit — Long Nhật Singer

**Document ID:** DORTIS-LNS-WEB-001 · **Ngày tạo khung:** 15/11/2026  
**Trạng thái:** `INPUT_PENDING` — chưa có Portfolio chính thức để đọc.  
**Nguồn tin cậy:** Portfolio bản duyệt, xác nhận của nghệ sĩ/đại diện, asset gốc và văn bản phê duyệt phát hành.

## Danh mục kiểm tra nguồn

| Hạng mục | Tình trạng | Nguồn/trang |
|---|---|---|
| Tệp nguồn, version, số trang | MISSING | Chưa nhận PDF/PPTX/ảnh |
| Danh sách trang & mục đích | MISSING | Chưa thể thống kê |
| Tên hiển thị | BRIEF_ONLY | Từ master brief: Long Nhật Singer |
| Tiểu sử, thể loại, thế mạnh | MISSING | Chờ xác thực |
| Sự kiện / thành tích / đối tác / quote | MISSING | Không tự tạo claim |
| Ảnh, video, artwork và quyền sử dụng | ASSET_PENDING | Chờ file gốc + giấy phép |
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

**Không thể xác nhận hoàn thành Phase A** cho tới khi Portfolio gốc được cung cấp và được kiểm tra toàn bộ.
