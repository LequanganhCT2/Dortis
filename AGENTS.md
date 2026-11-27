# AGENTS.md — DORTIS Coding, UI/UX & Animation Rules

> Áp dụng riêng cho Dortis. Đọc trước khi sửa code. Không áp dụng quy tắc nghiệp vụ hoặc nhận diện của SAW hay dự án khác vào Dortis.

## 1. Quy trình làm việc — tiết kiệm token

- Đọc yêu cầu, xác định phạm vi, dùng `rg` / `rg --files` hoặc công cụ tìm kiếm repository để tìm đúng file. Chỉ đọc phần code liên quan và dependency cần thiết; không quét toàn bộ source, `node_modules`, `dist`, lockfile hoặc log dài nếu không cần.
- Quy trình: tìm code → đọc phần cần thiết → sửa trực tiếp → kiểm tra có trọng tâm → báo cáo. Không đọc lại file chưa đổi, chạy lại lệnh đã thành công hoặc phân tích dài dòng.
- Ưu tiên minimal token usage, minimal file reading, minimal code changes, reuse existing code, targeted testing và no fake test results.
- Kiểm tra branch, trạng thái mã nguồn, thay đổi của người dùng trước khi sửa. Không ghi đè thay đổi sẵn có; không refactor hoặc cài thư viện ngoài phạm vi yêu cầu.
- Không tự thay nghiệp vụ, routing, API, database, RLS hoặc cấu hình deployment. Không tự commit, push, merge hoặc deploy nếu người dùng chưa yêu cầu hoặc chưa có chỉ dẫn triển khai áp dụng cho tác vụ.

## 2. Định danh dự án và kiến trúc

- GitHub: `LequanganhCT2/Dortis`; nhánh production: `main`.
- Website: `https://dortis.vercel.app`; Vercel production: `quang-anh10/dortis`. Không nhầm với `quang-anh12/dortis-profile`. Xác minh lại project, domain và commit thực tế trước khi triển khai.
- Frontend: React + Vite. Backend, Auth và Storage: Supabase, project Dortis (`whkqdusoowrrhtvejrie`). Không coi trạng thái kết nối hoặc deployment lịch sử là trạng thái hiện tại.
- Tách page, component, utility, service và logic dữ liệu; ưu tiên cấu trúc có sẵn. Public portfolio và Admin dùng chung renderer khi phù hợp, không nhân đôi toàn bộ website để tạo editor.
- Portfolio Form là cấu trúc dùng chung; nội dung, hình ảnh, layout, typography và motion override thuộc từng nghệ sĩ/instance. Không ghi dữ liệu nghệ sĩ vào master template.

## 3. Nhận diện và giao diện

- Public portfolio: nghệ thuật, tinh tế, có chiều sâu, ưu tiên hình ảnh, câu chuyện và nhận diện nghệ sĩ. Không biến public portfolio thành dashboard SaaS.
- Admin: giữ Header/Navbar dùng chung ổn định khi điều hướng; không animate lại khung điều hướng hoặc làm mất vị trí thao tác. Giao diện công cụ gọn, nhất quán font, icon, spacing, trạng thái focus và disabled.
- Header public nhẹ, trong suốt theo template được duyệt; không tự thêm nền trắng, logo hoặc mục menu đã bị yêu cầu loại bỏ.
- Silk Atelier (Template 01): bảo toàn nhận diện và hiệu ứng được duyệt. Silk Flow (Template 02): nhận diện riêng, nền sáng, lụa xanh trong mờ, nếp gấp rộng và nhẹ; không làm thành bản sao Template 01. Màu cụ thể lấy từ cấu hình palette hiện tại.
- Không áp một màu/font lên mọi nghệ sĩ; không đổi palette khác khi sửa một template. Giữ desktop/mobile, độ tương phản và khả năng đọc tiếng Việt.

## 4. HTML/CSS dùng chung — BẮT BUỘC

- Title, text, body, eyebrow, ảnh tạo mới và phần tử gốc phải dùng chung contract HTML, component trình bày, CSS và motion theo vai trò. Title dùng `h2` khi phù hợp hệ phân cấp heading; body/text dùng `p`; nhãn phụ dùng markup tương ứng. Không render mọi nội dung thành `span` với style riêng.
- Tái sử dụng selector hiện có như `.pt-ribbon__copy`, `.pt-site__copy`, `.pt-artboard__text` và lớp palette/typography của template. Với artboard, dùng chung logic tính text style của layer gốc. Kiểm tra cấu trúc thực tế trước khi dùng class.
- Quy tắc kế thừa: thuộc tính chỉnh riêng của layer → thuộc tính theo vai trò/section của instance → CSS/palette của template. Thuộc tính chưa chỉnh phải kế thừa động, không ghi giá trị mặc định thành override. Khi chuyển section hoặc đổi palette, phần chưa override tự thích ứng.
- Một nguồn định nghĩa cho mỗi chức năng/style. Không tạo bộ font, màu, keyframe hoặc reveal thứ hai chỉ cho chữ tạo mới. Có thể chia stylesheet theo chức năng; không ép toàn dự án vào một file CSS khổng lồ. CSS Studio chỉ quản lý geometry, selection, resize và panel; giao diện chữ lấy từ template.
- Cho phép khôi phục CSS template theo layer mà không reset nội dung, ảnh, vị trí hoặc hiệu ứng không liên quan. Menu lấy thông số đang áp dụng thực tế, không chỉ hiển thị giá trị mặc định lưu trong JSON.
- Scope CSS theo template/feature; tránh selector toàn cục, class trùng chức năng và lạm dụng `!important`. Dùng CSS variables/design tokens hiện có. Không hardcode màu, font hoặc kích thước riêng chỉ để sửa một trường hợp.
- Với dữ liệu cũ, bảo toàn override đã chỉnh. Nếu không thể phân biệt giá trị mặc định cũ và lựa chọn thủ công, nêu rõ giới hạn tương thích; không âm thầm ghi đè dữ liệu.

## 5. DORTIS Studio — chỉnh sửa trực tiếp

- Cùng một trang có Xem/Xem trước và Sửa ở góc phải. Guest chỉ thấy bản đã xuất bản. Admin vào Sửa được thao tác trực tiếp, không chuyển route hoặc reload không cần thiết.
- Toolbar/Inspector nổi có thể kéo tự do trong viewport, thu nhỏ, mở rộng và đặt lại vị trí. Không để menu bị che, rơi ngoài màn hình, chặn canvas hoặc buộc dùng sidebar cố định.
- Hỗ trợ các loại phần tử được yêu cầu: title, text, body, ảnh, hình khối, button, section; tái sử dụng factory và model layer. Các chức năng nâng cao chỉ báo hoàn thành khi thực sự có trong code và đã kiểm tra.
- Chọn layer, chỉnh realtime, nhấp đúp sửa chữ; kéo, resize cạnh/góc, xoay, căn chỉnh, opacity, nền, viền, shadow, font, giãn dòng/chữ, layer order, khóa/ẩn, nhân bản, xóa, chuyển section. Không giới hạn cứng vào ô nội dung ban đầu; vẫn phải giữ vùng thiết kế và responsive hợp lý.
- Tách wrapper vị trí/kích thước/xoay với phần tử nội dung chạy animation. Resize text thay đổi khung và reflow chữ, không bóp méo font. Giữ tỷ lệ ảnh khi chọn khóa tỷ lệ. Desktop/mobile lưu layout độc lập; nội dung và ảnh vẫn dùng chung nếu không có yêu cầu khác.
- Với ô số đã focus: cuộn chuột để điều chỉnh nếu phù hợp; Shift ×10, Alt ×0.2. Không chiếm wheel khi đang cuộn trang hoặc làm hỏng nhập liệu.
- Undo/Redo phải khôi phục đúng bản nháp; thao tác kéo tạo một bước lịch sử khi kết thúc, không ghi mỗi pointermove. Không reset editor khi đổi tab, cập nhật một field hoặc đồng bộ dữ liệu.
- Tách bản nháp và bản xuất bản: thay đổi realtime trên draft, debounce lưu, hiển thị đang lưu/đã lưu/lỗi. Preview không được tự xuất bản. Chỉ xuất bản khi Admin chọn Xuất bản, dùng revision/CAS và RPC hiện có; xử lý xung đột, không ghi đè phiên khác. Giữ draft private, không đẩy dữ liệu chưa xuất bản ra public.

## 6. Animation portfolio — BẮT BUỘC kế thừa trang

- Tìm `ScrollTextAtmosphere`, `CharacterBurst`, `DirectEditableText`, `textLayerMotion`, `PhotoReveal`, `PhotoMotion` và `scroll-text-atmosphere.css` trước khi sửa hiệu ứng. Các tên này là điểm tra cứu theo kiến trúc hiện có, phải kiểm chứng ở branch đang làm.
- Dùng một hệ thống reveal chung cho phần tử gốc và phần tử tạo mới. Không tạo IntersectionObserver, vòng RAF, CSS keyframe hay engine riêng cho từng loại chữ khi runtime chung đã đáp ứng.
- Mặc định layer mới chọn **Theo template / trang** (`inherit`), lấy motion của vai trò tương ứng trong section; nếu chưa có override, dùng hiệu ứng mặc định của trang. Phải hỗ trợ chọn hiệu ứng riêng hoặc `none` rõ ràng, không nhầm `none` với kế thừa.
- Title: bung từng ký tự có kiểm soát; body: từng từ hoặc cả khối tùy cấu hình và độ dài. Ảnh: reveal trên wrapper ảnh, giữ crop, tỷ lệ, vị trí và hiệu ứng hover độc lập. Văn bản phải là DOM thực, không vẽ chữ thiết yếu vào canvas.
- Khi cuộn tới, phần tử xuất hiện bằng fade in và chuyển động theo template; khi cuộn qua, fade out theo hướng cuộn; khi cuộn ngược, chạy lại đúng hướng nếu bật reverse. Không fade cả section làm mất nội dung đang trong viewport; không bắt mọi layer cùng chờ một hàng đợi dài.
- Đăng ký layer mới vào runtime thông qua contract hiện có (`data-pt-scroll-reveal`, motion attributes và reveal state). Cập nhật đăng ký khi thêm/xóa/đổi nội dung hoặc motion, nhưng không khởi động lại toàn bộ animation khi kéo, resize, gõ chữ hoặc rerender bình thường.
- Tôn trọng tốc độ chung của trang và override riêng từng layer (duration, delay, stagger, unit, direction). Dùng giá trị/timing đã được chuẩn hóa bởi runtime; không đưa các mặc định SAW vào portfolio. Hỗ trợ kết hợp fade, slide, scale, blur, 3D khi engine hiện có cho phép.
- Edit mode tạm dừng hiệu ứng để chọn/kéo/sửa chính xác; Xem trước hoặc phát lại kích hoạt reveal đúng vị trí cuộn hiện tại, không ép về đầu trang. Guest không thấy trạng thái chỉnh sửa.
- Tách transform kéo/xoay/resize khỏi transform animation; không để keyframe ghi đè layout, opacity đã chỉnh, z-index hoặc kiểu chữ. Không flash chữ trước lần reveal đầu tiên; không để nội dung mất vĩnh viễn khi runtime lỗi.
- Canvas/WebGL/Three.js chỉ dùng cho trang trí đã được duyệt, không bắt buộc để đọc nội dung. Giới hạn hiệu ứng nặng, glow, blur, particles; có fallback cho mobile và thiết bị không hỗ trợ. Hủy observer, RAF, animation/listener khi unmount.
- Tôn trọng `prefers-reduced-motion` ở CSS và JS; khi giảm chuyển động, nội dung hiển thị đầy đủ ngay. Giữ khả năng đọc, chọn chữ, điều hướng bàn phím và accessibility.

## 7. Animation Admin — chỉ áp dụng khi phù hợp phạm vi

- Không áp Row Stagger dashboard lên public portfolio. Với card/thống kê Admin được yêu cầu animation: các card cùng hàng xuất hiện đồng thời, hàng sau trễ 150ms; scale .65 → 1.045 → .99 → 1 kết hợp fade, mặc định 600ms, easing `cubic-bezier(.22,1,.36,1)`. Hạn chế delay tích lũy 450–600ms; không ép bố cục thay đổi để chạy animation.
- Route/view thực sự thay đổi: có thể fade out và scale 1 → .97 trong 120–160ms, sau đó enter; giữ Header/Navbar, không gọi lại API do motion. Hủy transition cũ khi điều hướng liên tục. Không tự viết lại router để thêm hiệu ứng.
- Button: hover nhẹ, nhấn scale .97, 120–160ms. Modal/dropdown: fade + scale .96–.97 → 1, 150–180ms; giữ focus trap, Escape, disabled/loading, portal và vị trí neo. Không tạo animation lồng nhau hoặc làm mất sticky/fixed.
- Nếu trang có số liệu tổng hợp thật và yêu cầu hiệu ứng: tái sử dụng Count Up, RAF + easeOutCubic khoảng 750ms, pulse nhẹ khoảng 230ms khi đạt đích. Giữ đúng giá trị API, locale và đơn vị; khi refresh animate từ giá trị hiện tại đến giá trị mới, không reset về 0. Không animate ID, ngày, mã nghệ sĩ, năm thành tựu hoặc ô đang nhập. Null/loading/error không biến thành 0.
- Nếu có biểu đồ thật: dùng thư viện hiện có, thanh tiến độ/cột/donut/line xuất hiện đúng tỷ lệ, 600–900ms; giữ tooltip, trục và empty state, không vẽ lại từ 0 khi polling. Không tạo dashboard, chart, số liệu hoặc nghiệp vụ mới chỉ để áp dụng animation.

## 8. Dữ liệu nghệ sĩ, PDF và media

- Nội dung lấy từ hồ sơ nghệ sĩ/PDF được duyệt; không tự bịa tiểu sử, giải thưởng, mốc thời gian, liên hệ, ảnh hoặc logo. Không dùng dữ liệu giả thay API thực.
- Hỗ trợ nhiều cấu trúc PDF/EPK. Trích xuất toàn bộ trang cần thiết, giữ thứ tự đọc, tiêu đề, nội dung và dấu tiếng Việt; kiểm tra thiếu chữ, trộn cột, ngắt dòng và trang ảnh scan. Nếu cần OCR, chỉ dùng đúng phần không có text và ghi rõ mức độ chắc chắn.
- Lưu dữ liệu trích xuất đúng hồ sơ; chỉ xóa PDF nguồn sau khi trích xuất, kiểm tra và lưu thành công theo workflow yêu cầu. Nếu lỗi, giữ khả năng thử lại. Không xóa ảnh/asset đang được bản xuất bản hoặc bản nháp sử dụng.
- Nội dung gốc từ PDF/profile, bản chỉnh tay, shared template, draft và published snapshot phải phân biệt rõ. Đồng bộ dữ liệu mới không ghi đè field override thủ công. Sửa text trên portfolio không tự sửa nguồn PDF/profile.
- Upload ảnh qua Storage/service hiện có; kiểm tra loại, dung lượng, quyền truy cập và đường dẫn. Giữ ảnh, mô tả, thứ tự layer và liên kết nguồn. Không thay ảnh nghệ sĩ bằng stock/AI nếu chưa được yêu cầu.

## 9. Auth, Supabase và an toàn

- Chỉ Admin đăng nhập để quản trị; Guest đọc dữ liệu công khai, không có nút Sửa, handles, inspector hoặc draft. Không tạo thêm role/luồng đăng ký khi chưa được yêu cầu.
- Kiểm tra quyền ở backend/RLS, không chỉ ẩn nút frontend. Không nới RLS để chữa lỗi UI; giữ policy đọc snapshot và ghi draft/publish đúng quyền Admin. Không lộ service-role key, token, mật khẩu hoặc dữ liệu riêng tư.
- Tái sử dụng schema, storage bucket, service và RPC hiện có. Không tự migration hoặc sửa dữ liệu thật để test; chỉ dùng dữ liệu thử nghiệm được phép. Kiểm tra revision, lỗi mạng và lỗi upload/publish trước khi báo lưu thành công.

## 10. Kiểm thử có trọng tâm — Chrome DevTools

- Dùng Chrome DevTools MCP nếu khả dụng; tận dụng dev server/tab đang chạy. Chỉ mở trang vừa sửa, không khởi động nhiều server hoặc build liên tục.
- Với Studio: kiểm tra Guest/Admin, thêm title/text/ảnh, HTML semantic, computed font/màu/cỡ chữ so với layer gốc cùng vai trò, kế thừa khi đổi template/palette/section, override và reset CSS. Kiểm tra chữ cũ không bị thay đổi ngoài ý muốn.
- Kiểm tra fade in/out theo hai chiều cuộn, hiệu ứng chữ mới giống chữ gốc, pause khi edit, replay tại vị trí hiện tại, reduced motion; không chạy lại animation thừa khi kéo/resize/gõ chữ. Kiểm tra DOM, CSS và Performance khi giật lag.
- Kiểm tra kéo/resize/rotate, menu nổi, desktop/mobile, undo/redo, lưu draft, refresh, lỗi/xung đột và xuất bản. Chỉ thử CRUD trên dữ liệu được phép; Guest không được thấy bản nháp.
- Kiểm tra Console errors, Network requests liên quan, request trùng, first-load/direct-route/refresh và trạng thái loading không treo. Kiểm tra Template 01 không regress khi sửa Template 02. Với PDF, đối chiếu các trang nguồn trước khi xác nhận đủ text.
- Ưu tiên lint/typecheck nếu dự án có, unit/regression test liên quan; build toàn bộ khi cần xác minh tích hợp hoặc chuẩn bị production. Không sửa test chỉ để đạt PASS; cập nhật assertion khi contract nghiệp vụ thực sự thay đổi.
- Nếu không có DevTools/browser hoặc thiếu quyền Admin, báo rõ phần chưa kiểm tra. Build thành công không đồng nghĩa browser, auth, storage hoặc UI đã hoạt động đúng.

## 11. Git, Vercel và báo cáo

- Chỉ commit/push/merge/deploy theo yêu cầu. Khi triển khai Dortis, kiểm tra `main`, commit được test, đúng project `quang-anh10/dortis` và domain `dortis.vercel.app`. Không tạo commit rỗng hoặc project mới để ép deploy nếu code đã ở main; dùng deployment của đúng commit.
- Sau deploy, xác minh trạng thái READY, domain trỏ đúng commit, trang liên quan tải được và hành vi cần kiểm tra; phân biệt BUILDING, READY và đã kiểm thử thực tế. Không tự rollback hoặc đổi domain/môi trường ngoài phạm vi.
- Báo cáo ngắn: file đã sửa, logic đã thay đổi, kết quả test thật, commit/deployment nếu có, giới hạn và lỗi còn tồn tại. Không in lại toàn bộ source, không đề xuất chức năng ngoài yêu cầu. Kết thúc khi hoàn thành phạm vi đã xác định.
