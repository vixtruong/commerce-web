# Commerce Web

React Storefront và backoffice dành cho [Commerce Microservices](https://github.com/vixtruong/commerce-microservices). Frontend là repository độc lập; mọi API công khai đều đi qua YARP Gateway. Backend sở hữu nghiệp vụ, phân quyền, dữ liệu và Saga.

## Công nghệ và chức năng

React 19, TypeScript strict, Vite, React Router, TanStack Query/Table, React Hook Form, Zod, Zustand, Tailwind CSS, Radix Dialog, Lucide và Recharts. Vitest, Testing Library, MSW, Playwright và Storybook phục vụ kiểm thử.

- Storefront: catalog, tìm kiếm/lọc/sắp xếp, sản phẩm, giỏ hàng, checkout bất đồng bộ, lịch sử đơn hàng và tài khoản.
- Backoffice: dashboard, sản phẩm, tồn kho/điều chỉnh/đặt giữ hàng, đơn hàng, thanh toán, giao hàng, người dùng, nhóm quyền và audit.
- Access token ở bộ nhớ; refresh token theo tab trong sessionStorage. Refresh đồng thời dùng một request; backend xoay token và từ chối replay.
- Roles là nhóm permissions. Navigation, route và action kiểm tra permissions; backend vẫn quyết định quyền và ownership.
- Checkout lưu idempotency key trước khi gửi, ngăn submit kép và chờ Saga hoàn tất. Hủy do thanh toán thất bại chỉ thông báo giải phóng hàng sau compensation.

## Chạy local

Cài Node 22 và pnpm 10.17.1. Clone hai repo cạnh nhau:

```powershell
git clone https://github.com/vixtruong/commerce-microservices.git Commerce
git clone https://github.com/vixtruong/commerce-web.git Commerce.Web
cd Commerce
git switch codex/full-stack-commerce
Copy-Item .env.example .env
docker compose up --build -d --wait --wait-timeout 300
```

Backend cần revision có API Storefront/backoffice và permissions. Xem nhánh tích hợp được ghi trong [backend README](https://github.com/vixtruong/commerce-microservices). Compose mặc định build frontend từ `../Commerce.Web`; đổi `FRONTEND_SOURCE_PATH` nếu đặt thư mục khác.

Frontend production: `http://localhost:8088`. Gateway: `http://localhost:8080`. Để dùng Vite:

```powershell
cd ../Commerce.Web
pnpm install --frozen-lockfile
pnpm dev
```

Vite chạy ở `http://localhost:5173`, proxy `/api` và `/health` đến Gateway. Không cần `.env` cho cấu hình mặc định. Có thể dùng `VITE_API_BASE_URL` để gọi Gateway URL khác; không đưa secrets vào biến `VITE_*`.

## Kiểm thử

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm build-storybook
pnpm exec playwright install chromium
Copy-Item .env.e2e.example .env.e2e
# Điền tài khoản development của backend vào .env.e2e trước khi chạy.
pnpm test:e2e
```

Cũng có thể dùng `$env:E2E_ENV_FILE = '../Commerce/.env'` để đọc cấu hình backend local, hoặc đặt biến môi trường trực tiếp. `WEB_BASE_URL=http://localhost:8088` kiểm tra nginx production; mặc định Playwright tự khởi động Vite. `API_BASE_URL` luôn là Gateway. Screenshot nằm trong `artifacts/frontend-visual`; report/trace nằm trong `playwright-report` và `test-results`. Các thư mục này và mọi credential local đều được Git ignore.

`pnpm storybook` mở các ví dụ component ở port 6006. Workflow CI chạy lint/types/unit tests/build/Storybook. Workflow E2E thủ công checkout revision backend được chọn, khởi động Compose, kiểm tra checkout thành công và payment compensation.

## Cấu trúc

`src/features` chứa nghiệp vụ; `src/api` chứa HTTP client; `src/auth` chứa current user và permissions; `src/components` chứa controls dùng chung; `src/layouts` tách Storefront/backoffice; `src/lib` chứa formatter/status/copy. Server state ở Query, UI state ở Zustand, filter ở URL và form ở React Hook Form. Routes được lazy-load.

Dockerfile build bằng Node/pnpm rồi chạy nginx không dùng root. nginx chỉ proxy đến hostname Gateway trong Compose, có SPA fallback, CSP và cache asset theo hash. Repository này không chứa backend hay kết nối database.

Payment dùng provider development và không thu thập thông tin thẻ. Product media dùng ảnh Catalog cùng origin khi có, fallback rõ ràng khi lỗi hoặc thiếu ảnh; hai SKU seed cũ vẫn có illustration mẫu ghi rõ. Product editor chọn tối đa 8 ảnh JPEG/PNG/WebP (5 MiB mỗi ảnh), xem trước, đổi ảnh chính và xóa; gallery và ảnh Cart lấy từ Catalog. Admin → Collections quản lý nhóm và product editor gán nhóm; Home/Catalog dùng số lượng và filter từ API. Bộ demo công nghệ/phụ kiện gồm 200 model/ảnh từ hãng, 60 tài khoản và 120 checkout, xem `../Commerce/docs/demo-data-guide.md`. Refund, đổi mật khẩu, sửa profile và carrier integration chưa có backend use case.

## Giao diện và quy ước phát triển

Thiết kế lấy **SkillNest làm trọng tâm**, với nền mint, sidebar/header trắng, điểm nhấn emerald, heading sans-serif đậm và metadata monospace. Góc bo giới hạn 4–8px; cấu trúc trang được thiết kế theo hành trình mua sắm và thao tác vận hành. Logbook bổ trợ phân cấp nội dung; DuelSheet không thuộc hướng thiết kế. Xem [nghiên cứu, kế hoạch và kết quả kiểm tra](docs/frontend-redesign-plan.md).

Token nằm trong `src/styles/tokens.css`; `index.css` chỉ import stylesheet theo trách nhiệm: base/controls, storefront, commerce, admin và responsive. `Brand`, `CheckoutSteps`, feedback, status và table là component dùng chung. Command palette tìm kiếm trong các khu vực mà user có quyền; catalog dùng disclosure cho bộ lọc. Không thay đổi hợp đồng API, refresh hay Saga.

Quy tắc duy trì kiến trúc, giao diện, accessibility, bảo mật và kiểm tra được ghi trong [AGENTS.md](AGENTS.md). Shared UI được mô tả trong Storybook, bao gồm workspace identity, token và loading/error/empty states.

Header ưu tiên tìm kiếm; trang chủ đưa sản phẩm/giá thật lên sớm; catalog dùng toolbar và filter có thể bỏ riêng ở URL. Chi tiết sản phẩm tách gallery và purchase panel sticky; auth tập trung vào form; checkout có order review. Dashboard dùng KPI strip và hàng đợi thao tác dựa trên summary thật.
