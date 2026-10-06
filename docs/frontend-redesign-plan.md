# Commerce — product-led redesign

Ngày khảo sát: 06/10/2026. Frontend triển khai trong `D:/vixtruong/Commerce.Web`; `Commerce/src/Web` không chứa source React.

## Nghiên cứu và quyết định thiết kế

[SkillNest](https://skillnest.dukelewis.com/) là tham khảo chính: canvas mint, trắng và emerald; điều hướng rõ; metadata monospace; vùng nhấn xanh đậm. Đã xem Home, Course và Meeting công khai. Phần sau đăng nhập chưa khảo sát. Theo phản hồi của chủ dự án, không lấy hero bo tròn hay layout dashboard của SkillNest làm khuôn bắt buộc cho ecommerce.

[Logbook](https://logbook.dukelewis.com/) bổ trợ bằng phân cấp chữ lớn/nhỏ, bố cục bất đối xứng và đường phân cách mảnh. [IKEA](https://www.ikea.com/us/en/) bổ trợ cấu trúc mua sắm: tìm kiếm nổi bật, merchandising có sản phẩm thật, giá dễ thấy và lối đi đến danh mục. Không sao chép tài sản, nội dung, category, ưu đãi hay tính năng chưa được backend hỗ trợ. DuelSheet được loại hoàn toàn.

Bản đầu vẫn giữ công thức hero + ba card giới thiệu + grid + banner. Hero minh họa chung chiếm vùng nhìn đầu tiên; sidebar catalog thu hẹp sản phẩm; dashboard bốn panel có trọng lượng ngang nhau. Bo góc lớn khiến mọi vùng giống một card. Đợt này thay **cấu trúc thông tin và thứ tự thao tác**, không chỉ màu và radius.

## Hệ thống thiết kế

- Canvas gần trắng, mint cho sân khấu sản phẩm và trạng thái chọn, emerald cho CTA. Dùng white space và đường phân cách thay hộp lồng hộp.
- Radius: controls 4px, surfaces 6px, dialog tối đa 8px. Chỉ avatar và chấm trạng thái dùng hình tròn. Không pill trang trí, không hero bo góc lớn.
- Tiêu đề sans-serif đậm, dễ đọc tên sản phẩm dài; monospace dành cho SKU, eyebrow, metadata và nhãn workspace theo SkillNest.
- Storefront ưu tiên ảnh, tên, giá và hành động. Backoffice ưu tiên mật độ dữ liệu và đường đi đến thao tác. Dùng chung token/control nhưng có cấu trúc riêng.
- Không thêm package; tái sử dụng Lucide, Radix, Query, Table, RHF và Zod hiện có.

## Bản đồ bố cục mới

| Màn hình                  | Cấu trúc và lý do                                                                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell cửa hàng            | Hàng chính: brand / tìm kiếm rộng / account + cart. Hàng phụ mảnh: collection, newest và orders. Checkout có header gọn để tập trung vào đơn.                                                                                                                       |
| Home                      | Intro ngắn → merchandising bất đối xứng: một sản phẩm thật lớn, danh sách sản phẩm mới cạnh bên → collection toàn chiều ngang → đường dẫn account/order gọn. Sản phẩm, tên và giá xuất hiện ngay vùng nhìn đầu tiên; loại hero minh họa chung và ba card tính năng. |
| Catalog                   | Tiêu đề + số kết quả → search/sort/filter toolbar ngang → disclosure giá → filter đang áp dụng có nút bỏ riêng → grid 4/3/2 cột theo desktop/tablet/mobile → pagination. Không sidebar cố định; URL là nguồn state.                                                 |
| Product                   | Breadcrumb → gallery rộng / purchase panel sticky desktop. Tên, giá, availability, quantity và CTA cùng một cụm; mô tả/spec nằm riêng dưới gallery. Mobile đọc theo gallery → mua → chi tiết. Chỉ một nút Add to cart.                                              |
| Cart                      | Danh sách sản phẩm dạng hàng có separator, quantity/remove gần item; estimate sticky desktop và CTA duy nhất.                                                                                                                                                       |
| Checkout                  | Header tập trung + progress → order review có thể thu gọn trên mobile → delivery form → payment disclosure và submit. Giữ payload/idempotency đã lưu, không biến estimate thành giá chốt.                                                                           |
| Auth                      | Form nhỏ tập trung; heading là sign-in/register thực, bỏ hero marketing cạnh form. Password reveal, validation, safe return path giữ nguyên.                                                                                                                        |
| Dashboard                 | Dải số liệu tổng quan có quyền → order status distribution ở vùng chính → hàng đợi processing/low stock → stock/payment/fulfilment breakdown gọn. Không cộng tiền khác currency, không biểu đồ doanh thu giả.                                                       |
| Các trang quản trị        | Sidebar sáng và topbar gọn; toolbar + table là mặt phẳng làm việc. Form phân nhóm và panel hỗ trợ; mobile drawer/command palette giữ keyboard/focus.                                                                                                                |
| Orders/account/processing | Dùng hierarchy, separator, status và timeline thật; giữ ownership, Saga terminal/compensation semantics.                                                                                                                                                            |

## Các bước triển khai và phụ thuộc

1. Đổi token/typography/radius; trích ProductMedia để caption ảnh mẫu và missing image luôn đúng.
2. Thay shell và Home trước để xác lập tỷ lệ, chiều cao header, nhịp merchandising.
3. Thay Catalog thành toolbar/disclosure/chips; kiểm tra debounce, reset/page, back/forward và stale query.
4. Tách Product gallery/purchase/spec, refactor Auth và review Checkout/Cart.
5. Tái tổ chức Dashboard từ các summary API hiện có, áp dụng density cho backoffice.
6. Chỉnh responsive 375/768/1440; kiểm tra nội dung dài, loading/error/empty, focus và overflow.
7. Đồng bộ AGENTS hai repo, README, architecture và Storybook.
8. Chạy lint/types/unit/build/Storybook, Playwright Gateway thật, review ảnh; build lại riêng frontend Compose và mở bản kết quả.

## Ràng buộc nghiệp vụ

- Không đổi REST/DTO/auth contract, service boundaries, migrations hoặc package/lockfile.
- Permissions và authenticated ownership giữ nguyên. Query cleanup, refresh single-flight/session-generation giữ nguyên.
- Mutations không tự retry. Checkout owner-scoped durable idempotency key và payload không đổi; Saga dựa vào server state.
- Giá/tổng/stock lấy từ API. Không fake rating, wishlist, discount, category, tracking, revenue hay health.
- Ảnh seed ghi rõ sample; sản phẩm khác ghi image unavailable. Không tạo giao diện upload chưa có contract.

## Tiêu chí nghiệm thu

- Home hiển thị một sản phẩm thật có tên/giá trong vùng đầu desktop và mobile khi API có dữ liệu.
- Catalog không sidebar; search/sort/giá/chips/reset đồng bộ URL, pagination reset khi filter đổi.
- Primary controls ít nhất 44px; focus rõ, dialog Escape/focus restore hoạt động; labels và lỗi field accessible.
- Không document overflow tại 375/768/1440; bảng giữ nhãn khi chuyển card; nội dung dài không phá layout.
- Từng route có hierarchy riêng theo nhiệm vụ; không dùng border-radius lớn hơn 8px cho card/control.
- Các kiểm tra kỹ thuật và workflow thật phải qua; ghi rõ dịch vụ/phần chưa kiểm chứng.

## Kết quả kiểm tra

Đã triển khai các bước 1–8 trong source frontend và cập nhật React Frontend Rules ở cả hai repo. Tách ProductMedia/Brand/CheckoutSteps/CommandPalette và stylesheet theo trách nhiệm; không thêm dependency hoặc đổi lockfile. Thay bố cục Home, Catalog, Product, Auth, Checkout và Dashboard; shared controls/surfaces áp dụng cho các module còn lại.

| Kiểm tra                              | Kết quả thực tế                                                                                                                                                                              |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                           | Qua, không warning ESLint                                                                                                                                                                    |
| `pnpm typecheck`                      | Qua                                                                                                                                                                                          |
| `pnpm test`                           | 16 file, **38 tests qua**                                                                                                                                                                    |
| Production build                      | `pnpm build` qua trên Windows; build cuối trong Docker dùng pnpm 10.17.1 với frozen lockfile cũng qua                                                                                        |
| `pnpm build-storybook`                | Qua trên source cuối                                                                                                                                                                         |
| Playwright qua Vite/Gateway           | **8 tests qua**: checkout + refresh/double-submit, CRUD/publication/stock, permissions/JWT/ownership, thiếu tồn kho, responsive, URL filters/history, auth và palette/drawer                 |
| Playwright qua nginx `localhost:8088` | **4 tests qua** trên production build cuối: checkout thực, discovery/filter/history, auth, palette/drawer và form/access layouts                                                             |
| Responsive                            | Review và kiểm tra document overflow tại **375/768/1440px**: home/catalog, product, cart/checkout/processing/order, auth, dashboard, module tables, product/inventory forms và access/system |
| Accessibility tương tác               | Password reveal không submit; URL chip/reset đúng; dialog search nhận focus; Escape trả focus; drawer đóng sau navigation; validation field có nhãn/lỗi                                      |
| Contrast mẫu                          | Muted text trên mint: 4.76:1; muted text trên surface-muted: 4.92:1; viền input trên trắng: 3.17:1                                                                                           |
| Integration local                     | Chỉ rebuild/recreate `commerce-web`, không restart backend. HTTP 200, stylesheet cuối `index-DoWFOD-9.css` ở port 8088                                                                       |
| Diff hygiene                          | `git diff --check` qua cả hai repo; artifacts, dist, Storybook output, report và credentials được ignore                                                                                     |

Lượt test UI đầu có hai lỗi locator (heading trùng trong lúc chuyển route và tên menu không khớp). Đã sửa selector theo vùng nội dung/tên navigation thật; lượt cuối qua hết. Đây không phải thay đổi contract hay quyền.

Build có warning từ annotation của Zod và chunk lớn của Storybook; không có lỗi build. Không bật lại provider Payment Failure trong lượt local này; đã kiểm tra checkout thành công và hủy do thiếu tồn kho. Các test/payment compensation hiện có được giữ nguyên, không tuyên bố đã chạy nhánh provider failure.

Ảnh review local nằm trong `artifacts/frontend-visual`; ảnh xác minh nginx nằm trong `artifacts/frontend-production`. Report/trace ở thư mục được ignore. Catalog local hiện có hai sản phẩm active; bố cục hiển thị đúng dữ liệu đó, không thêm sản phẩm/metrics giả để lấp khoảng trống.

Không thay REST/DTO/auth contract, database schema, migrations hoặc backend business workflow. Không cần migration và không phát sinh nội dung API mới để đồng bộ Postman.


## Bổ sung demo công nghệ và nhiều ảnh — 06/10/2026

Yêu cầu: 200 sản phẩm công nghệ/phụ kiện có dữ liệu model và ảnh thực tế, nhiều tài khoản/đơn lưu thật để trình bày; collection là nhóm sản phẩm trên website. Tài khoản, địa chỉ, stock và payment/shipping là kịch bản demo, không mạo nhận người mua/giao dịch ngoài đời.

Nguồn công khai Keychron, UGREEN US, Baseus và Satechi cho 200 model/variant và giá USD chụp tại thời điểm chuẩn bị. Backend lưu manifest/source/SHA-256 và 589 ảnh; 195 model có gallery, 5 model chỉ có một ảnh phù hợp variant. UI không bịa cấu hình, rating, discount hoặc metric. Hướng dẫn và kế hoạch chi tiết ở ../Commerce/docs/demo-data-guide.md và demo-data-plan.md.

Các bước hoàn thành:

1. Catalog mở rộng brand, source, primary image, ordered imageUrls và category slug; public group counts/filter, category administration có policy, hai migration tương thích dữ liệu cũ. Cart snapshot/gRPC, Order và integration contracts giữ nguyên.
2. Home hiển thị collection thật; Catalog giữ category/search/sort/price/page trong URL; ProductMedia có fallback; ProductGallery chuyển ảnh bằng thumbnail có aria-pressed.
3. Form create/edit chọn tối đa 8 JPEG/PNG/WebP (5 MiB/ảnh), preview bằng blob, đổi primary/remove, upload chỉ lúc Save. Giữ validation, duplicate-submit/dirty warnings và metadata nguồn. API client truyền FormData qua cùng cơ chế session-generation/refresh/error, không tự retry mutation.
4. Backend stream với buffer 64 KiB, validate signature/size, SHA-256/atomic rename/cleanup. Hai Catalog dùng chung named volume catalog-images. Nginx giới hạn request 6 MiB và img-src cho phép blob preview; không nới script/connect/frame policies.
5. CartItem đọc public productQuery để giỏ cũ có ảnh mới mà không đổi snapshot giá/quantity hoặc optimistic-write ordering.
6. Import qua Gateway: 60 accounts theo role và 120 actual checkout; 108 paid/shipment và 12 cancelled do stock. Chạy lại không nhân đôi; đối chiếu stock và ảnh. Không xóa dữ liệu hay reset volumes.

Kiểm chứng thực tế:

| Kiểm tra | Kết quả |
| --- | --- |
| pnpm lint / typecheck / build | Qua trên source cuối |
| Vitest | 48 tests, 20 files qua; thêm form category load-order, ảnh/fallback, gallery, multipart, photo editor và Cart |
| Storybook | Build qua, thêm ProductPhotoEditor stories |
| Playwright production nginx/Gateway | 11 tests qua; checkout/refresh/idempotency/ownership/permissions, CRUD/stock, responsive/filter/auth/navigation, 200-product discovery, upload/replacement/gallery/cart |
| Responsive | 375/768/1440px không document overflow; scroll trước screenshot để ảnh lazy tải đầy đủ |
| Upload API | 401 anonymous, 403 Customer, 400 SVG/oversize; 201 khi file đúng, create và edit gán ordered gallery |
| Giỏ đã lưu | Ảnh Catalog hiện đúng; đổi primary rồi reload giỏ thấy ảnh mới mà không thêm lại item |
| Persistent images | Recreate Catalog-1, ảnh upload giữ checksum trong shared volume và đọc được qua Gateway |
| Dataset checks | 200 source models / 589 photo hashes / 9 group counts / 200 reconciled stock rows; checkpoint giữ 60 accounts, 120 orders sau import lặp |
| Backend | Build và 56 tests qua; không thêm package runtime |
| Postman | Source copy 51 Gateway requests cập nhật DTO/group/upload/gallery; MCP remote không có |

Lượt đầu thiếu credential local; đã dùng E2E_ENV_FILE rõ ràng. Danh mục lớn làm tên Mechanical Keyboard không còn là locator duy nhất; tests tìm SKU KEYBOARD-001. Browser phát hiện select group có thể mất giá trị khi options tải sau product; đã control giá trị và thêm regression test. Một MSW/jsdom File stream test bị timeout; unit kiểm tra fetch/FormData trực tiếp, Playwright kiểm chứng multipart thật. Build còn warning Zod annotation và chunk Storybook hiện có.

95 screenshot local ở artifacts/demo-data; trace/report/credentials/output vẫn được ignore. Các thay đổi redesign đã có trước yêu cầu này được giữ nguyên.

Lượt verify cuối 2026-10-06 04:50:41 UTC xác minh trực tiếp 60 users/roles, 120 order/payment/shipment, 200 stock row, 589 photo SHA-256 và replay 3 owner-scoped checkout keys trả đúng order ID. Global order processing=0; số tổng hệ thống gồm dữ liệu cũ và fixtures, không phải số bổ sung của bộ demo. Report ở ../Commerce/artifacts/demo-state/verification.json (ignored).
