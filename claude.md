# 🏗️ DACK – Agentic Engineer Roadmap

> **Dự án:** Hệ thống thương mại điện tử bán vật liệu xây dựng (DACK)
> **Cập nhật:** 2026-03-05
> **Stack:** ASP.NET Core 8 (BE) + Vanilla JS/HTML/CSS (FE)

---

## 📋 Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Các lệnh quan trọng](#4-các-lệnh-quan-trọng)
5. [Quy tắc code chung](#5-quy-tắc-code-chung)
6. [Clean Code (Backend C#)](#6-clean-code-backend-c)
7. [Clean Code (Frontend JS/HTML/CSS)](#7-clean-code-frontend-jshtmlcss)
8. [Kiến trúc API & Luồng dữ liệu](#8-kiến-trúc-api--luồng-dữ-liệu)
9. [Giới hạn & Lưu ý hệ thống](#9-giới-hạn--lưu-ý-hệ-thống)
10. [Lộ trình Agentic Engineer](#10-lộ-trình-agentic-engineer)

---

## 1. Tổng quan kiến trúc

```
DACK/
├── BE_DACK/          # Backend – ASP.NET Core 8 Web API
│   └── BE_DACK/
│       ├── Controllers/   # API endpoints (REST)
│       ├── Models/
│       │   ├── Entities/  # EF Core entity classes & DbContext
│       │   └── Model/     # DTOs, request/response models
│       ├── Service/       # Business logic services
│       ├── Helpers/       # Utility/helper classes
│       └── Program.cs     # App bootstrap & DI container
└── FE_DACK/          # Frontend – Vanilla JS + HTML + CSS
    ├── src/           # Các trang HTML (index, shop, cart, ...)
    ├── js/            # JavaScript modules theo trang
    │   └── api/       # Service layer gọi API (axios, gemini, ...)
    ├── css/           # Stylesheets
    └── scss/          # SCSS source (compile ra CSS)
```

**Mô hình giao tiếp:** FE gọi REST API lên BE qua HTTP. BE xác thực bằng JWT Bearer token.

---

## 2. Công nghệ sử dụng

### Backend (`BE_DACK`)

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| .NET / ASP.NET Core | 8.0 | Web API framework |
| Entity Framework Core | 8.0.21 | ORM – truy vấn SQL Server |
| EF Core SQL Server | 8.0.21 | Provider cho SQL Server |
| Microsoft.AspNetCore.Authentication.JwtBearer | 8.0.16 | Xác thực JWT |
| System.IdentityModel.Tokens.Jwt | 7.1.2 | Tạo & xác minh JWT token |
| CloudinaryDotNet | 1.27.8 | Upload & lưu trữ ảnh |
| Swashbuckle.AspNetCore (Swagger) | 6.6.2 | Tài liệu hóa API |
| VNPay SDK | (tích hợp thủ công) | Thanh toán trực tuyến |
| SMTP Gmail | – | Gửi email thông báo |
| SQL Server | – | Cơ sở dữ liệu chính |

### Frontend (`FE_DACK`)

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| HTML5 | – | Cấu trúc trang |
| CSS3 / SCSS | – | Styling & responsive |
| Vanilla JavaScript (ES Modules) | ES2020+ | Logic phía client |
| Bootstrap | 5.x | CSS framework, grid, components |
| jsPDF | ^2.5.2 | Export PDF phía client |
| jspdf-autotable | ^3.8.4 | Xuất bảng sang PDF |
| Axios (axiosClient.js) | – | HTTP client gọi API |
| Gemini AI API | – | Chatbot tư vấn sản phẩm |
| Tiny Slider | – | UI slider/carousel |

---

## 3. Cấu trúc thư mục

### Backend

```
BE_DACK/
├── Controllers/
│   ├── ProductController.cs        # CRUD sản phẩm, tìm kiếm, lọc
│   ├── CustomerController.cs       # Đăng ký, đăng nhập, profile
│   ├── OrderController.cs          # Đặt hàng, lịch sử đơn hàng
│   ├── ShoppingCartController.cs   # Giỏ hàng
│   ├── PaymentController.cs        # VNPay, xác nhận thanh toán
│   ├── PromotionController.cs      # Khuyến mãi, mã giảm giá
│   ├── ForumController.cs          # Diễn đàn, bình luận
│   ├── ShipperController.cs        # Quản lý shipper
│   ├── DoanhThuController.cs       # Thống kê doanh thu (Admin)
│   ├── ContractController.cs       # Hợp đồng
│   └── Controller.cs               # Base controller (nếu dùng)
├── Models/
│   ├── Entities/                   # Entity maps trực tiếp với DB table
│   │   ├── DACKContext.cs          # EF Core DbContext chính
│   │   ├── Product.cs
│   │   ├── Customer.cs
│   │   ├── Order.cs / OrderDetail.cs
│   │   ├── ShoppingCart.cs / ShoppingCartDetail.cs
│   │   ├── Payment.cs
│   │   ├── Promotion.cs / ProductPromotion.cs
│   │   ├── ForumPost.cs / ForumComment.cs
│   │   ├── Shipper.cs
│   │   └── ...
│   └── Model/                      # DTO, request/response models
├── Service/
│   ├── Cloud.cs                    # ICloudinaryService implementation
│   ├── GuiEmailServices.cs         # Email sending service
│   └── VnpayServices/              # VNPay integration (nhiều file)
├── Helpers/                        # Các hàm tiện ích dùng chung
├── Program.cs                      # Entry point, DI, middleware pipeline
└── appsettings.json                # Cấu hình (DB, JWT, Cloudinary, VNPay)
```

### Frontend

```
FE_DACK/
├── src/                            # HTML pages
│   ├── index.html                  # Trang chủ
│   ├── shop.html                   # Danh sách sản phẩm
│   ├── cart.html                   # Giỏ hàng
│   ├── payment.html                # Thanh toán
│   ├── orders.html / order-detail.html
│   ├── blog.html                   # Diễn đàn/bài viết
│   ├── login.html / forgot-password.html
│   ├── profile.html
│   ├── favorites.html
│   ├── contact.html
│   ├── services.html
│   └── admin.html                  # Dashboard admin
├── js/
│   ├── api/
│   │   ├── axiosClient.js          # Cấu hình Axios baseURL + interceptors
│   │   ├── userStatus.js           # Kiểm tra trạng thái đăng nhập
│   │   ├── geminiService.js        # Gemini AI chatbot service
│   │   └── favoriteService.js      # API yêu thích sản phẩm
│   ├── shop.js                     # Logic trang shop (lọc, phân trang)
│   ├── admin.js                    # Logic trang admin
│   ├── orders.js                   # Logic trang đơn hàng
│   ├── cart.js                     # Logic giỏ hàng
│   ├── payment.js                  # Logic thanh toán
│   ├── chatbot.js / chatbotConfig.js  # Widget chatbot
│   ├── forum.js                    # Logic diễn đàn
│   └── ...
├── css/                            # Compiled CSS, custom styles
└── scss/                           # SCSS source files
```

---

## 4. Các lệnh quan trọng

### Backend (ASP.NET Core)

```bash
# Chạy backend (development)
cd BE_DACK/BE_DACK
dotnet run

# Build project
dotnet build

# Publish production
dotnet publish -c Release -o ./publish

# EF Core Migrations
dotnet ef migrations add <TênMigration>
dotnet ef database update
dotnet ef migrations remove          # Xóa migration cuối cùng
dotnet ef database drop              # Xóa toàn bộ DB (NGUY HIỂM)

# Xem danh sách packages
dotnet list package

# Thêm package mới
dotnet add package <PackageName> --version <version>

# Swagger UI (sau khi chạy)
# Truy cập: http://localhost:<port>/swagger
```

### Frontend (Vanilla JS)

```bash
# Cài đặt dependencies (jsPDF, ...)
cd FE_DACK
npm install

# Không có build step – dùng VS Code Live Server hoặc
# mở trực tiếp file HTML bằng trình duyệt (port mặc định: 5500)
# http://127.0.0.1:5500/src/index.html

# Biên dịch SCSS → CSS (nếu dùng sass CLI)
npx sass scss/main.scss css/main.css --watch

# Kiểm tra lỗi JS (nếu có ESLint)
npx eslint js/
```

### Git

```bash
# Clone dự án
git clone <repo-url>

# Tạo branch mới (theo feature)
git checkout -b feature/<ten-tinh-nang>

# Commit chuẩn
git add .
git commit -m "feat: <mô tả ngắn>"

# Push lên remote
git push origin feature/<ten-tinh-nang>

# Pull request → merge vào main
```

---

## 5. Quy tắc code chung

### Nguyên tắc đặt tên

| Loại | Convention | Ví dụ |
|---|---|---|
| C# Class | PascalCase | `ProductController`, `OrderDetail` |
| C# Method | PascalCase | `GetAllProducts()`, `CreateOrder()` |
| C# Variable/Field | camelCase | `productList`, `totalPrice` |
| C# Private field | _camelCase | `_context`, `_cloudinary` |
| C# Interface | IPascalCase | `ICloudinaryService`, `IVnpay` |
| JS Function | camelCase | `fetchProducts()`, `renderCart()` |
| JS Variable | camelCase | `cartItems`, `userId` |
| JS Class | PascalCase | `GeminiService` |
| HTML id/class | kebab-case | `product-card`, `btn-add-to-cart` |
| CSS/SCSS variable | kebab-case | `--primary-color`, `--font-size-lg` |
| DB Table/Column | PascalCase | `OrderDetails`, `ProductId` |
| API Endpoint | kebab-case | `/api/products`, `/api/shopping-cart` |

### Commit Message Convention

```
feat:     Thêm tính năng mới
fix:      Sửa bug
refactor: Tái cấu trúc code (không thay đổi chức năng)
style:    Thay đổi format, CSS (không thay đổi logic)
docs:     Cập nhật tài liệu
chore:    Maintenance tasks (cập nhật deps, chuỗi cấu hình)
test:     Thêm hoặc sửa test
```

Ví dụ: `feat: thêm tính năng lọc sản phẩm theo giá`

---

## 6. Clean Code (Backend C#)

### 6.1 Controller – Chỉ xử lý HTTP

```csharp
// ✅ ĐÚNG – Controller mỏng, delegate logic xuống service
[HttpGet]
public async Task<IActionResult> GetProducts([FromQuery] ProductFilterDto filter)
{
    var result = await _productService.GetFilteredAsync(filter);
    return Ok(result);
}

// ❌ SAI – Nhét business logic trực tiếp vào controller
[HttpGet]
public async Task<IActionResult> GetProducts()
{
    var products = await _context.Products
        .Where(p => p.Price > 100 && p.Stock > 0)
        .OrderByDescending(p => p.CreatedAt)
        .ToListAsync();
    // Tính toán, format dữ liệu thêm ở đây...
    return Ok(products);
}
```

### 6.2 Sử dụng DTOs – Không expose Entity trực tiếp

```csharp
// ✅ Dùng DTO để trả về dữ liệu
public class ProductResponseDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
}

// ❌ Không trả thẳng Entity (có thể lộ dữ liệu nhạy cảm)
return Ok(product); // Product entity chứa nhiều field không cần thiết
```

### 6.3 Async/Await – Luôn dùng cho I/O

```csharp
// ✅ Async tất cả database operations
public async Task<List<ProductResponseDto>> GetAllAsync()
{
    return await _context.Products
        .Select(p => new ProductResponseDto { ... })
        .ToListAsync();
}

// ❌ Không dùng .Result hoặc .Wait() – gây deadlock
var products = _context.Products.ToListAsync().Result; // NGUY HIỂM
```

### 6.4 Xử lý lỗi chuẩn

```csharp
// ✅ Trả HTTP status code phù hợp
if (product == null)
    return NotFound(new { message = "Sản phẩm không tồn tại." });

if (!ModelState.IsValid)
    return BadRequest(ModelState);

try
{
    await _context.SaveChangesAsync();
    return Ok(new { message = "Thành công", data = result });
}
catch (Exception ex)
{
    return StatusCode(500, new { message = "Lỗi server", detail = ex.Message });
}
```

### 6.5 Dependency Injection (DI) chuẩn

```csharp
// Program.cs – Đăng ký service đúng scope
builder.Services.AddScoped<IProductService, ProductService>();  // Per-request
builder.Services.AddSingleton<IVnpay, Vnpay>();                 // Shared toàn app
builder.Services.AddTransient<IEmailService, EmailService>();   // Mỗi lần inject mới

// Inject vào constructor – KHÔNG dùng service locator
public class ProductController : ControllerBase
{
    private readonly DACKContext _context;
    private readonly ICloudinaryService _cloudinary;

    public ProductController(DACKContext context, ICloudinaryService cloudinary)
    {
        _context = context;
        _cloudinary = cloudinary;
    }
}
```

### 6.6 JWT – Bảo vệ endpoint

```csharp
// Endpoint yêu cầu xác thực
[Authorize]
[HttpGet("profile")]
public IActionResult GetProfile() { ... }

// Chỉ Admin mới truy cập được
[Authorize(Roles = "Admin")]
[HttpDelete("{id}")]
public IActionResult DeleteProduct(int id) { ... }

// Endpoint công khai
[AllowAnonymous]
[HttpGet("products")]
public IActionResult GetProducts() { ... }
```

### 6.7 Naming & Structuring

```csharp
// ✅ Đặt tên method rõ ràng, phản ánh hành động
GetProductByIdAsync(int id)
CreateOrderAsync(CreateOrderDto dto)
UpdateProductStockAsync(int productId, int quantity)
DeletePromotionAsync(int promotionId)

// ✅ Mỗi method nên làm 1 việc (SRP)
// ✅ Viết comment tiếng Việt cho logic phức tạp
// ✅ Dùng var khi kiểu dữ liệu rõ ràng từ ngữ cảnh
var products = await _context.Products.ToListAsync();
```

---

## 7. Clean Code (Frontend JS/HTML/CSS)

### 7.1 JavaScript – Module Pattern

```javascript
// ✅ Mỗi file JS phục vụ 1 trang/tính năng
// ✅ Dùng ES Modules (import/export)

// axiosClient.js – cấu hình 1 lần, dùng lại nhiều nơi
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5155/api',
    headers: { 'Content-Type': 'application/json' }
});

axiosClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default axiosClient;
```

### 7.2 Tách biệt API calls và UI logic

```javascript
// ✅ ĐÚNG – Tách riêng tầng gọi API
// api/productService.js
export const getProducts = async (filters) => {
    const response = await axiosClient.get('/products', { params: filters });
    return response.data;
};

// shop.js – chỉ lo render UI
import { getProducts } from './api/productService.js';

async function loadProducts() {
    try {
        const products = await getProducts({ page: 1, limit: 12 });
        renderProductGrid(products);
    } catch (error) {
        showErrorToast('Không thể tải sản phẩm. Vui lòng thử lại.');
    }
}
```

### 7.3 Xử lý lỗi gọi API

```javascript
// ✅ Luôn wrap trong try/catch với thông báo cho người dùng
async function addToCart(productId, quantity) {
    try {
        await axiosClient.post('/shopping-cart', { productId, quantity });
        showSuccessToast('Đã thêm vào giỏ hàng!');
        updateCartBadge();
    } catch (error) {
        if (error.response?.status === 401) {
            redirectToLogin();
        } else {
            showErrorToast('Có lỗi xảy ra. Vui lòng thử lại.');
        }
        console.error('addToCart error:', error);
    }
}
```

### 7.4 DOM Manipulation chuẩn

```javascript
// ✅ Cache DOM elements, không query lặp lại
const productGrid = document.getElementById('product-grid');
const cartBadge = document.querySelector('.cart-badge');

// ✅ Dùng template literals cho HTML động
function renderProductCard(product) {
    return `
        <div class="product-card" data-id="${product.productId}">
            <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${formatCurrency(product.price)}</p>
            <button class="btn btn-add-to-cart" data-id="${product.productId}">
                Thêm vào giỏ
            </button>
        </div>
    `;
}

// ✅ Event delegation thay vì gán event cho từng element
productGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-to-cart');
    if (btn) addToCart(btn.dataset.id, 1);
});
```

### 7.5 Xác thực & bảo mật phía client

```javascript
// ✅ Lưu token đúng cách
localStorage.setItem('token', token);
localStorage.setItem('userId', userId);
localStorage.setItem('role', role);

// ✅ Kiểm tra quyền trước khi show admin UI
function checkAdminAccess() {
    const role = localStorage.getItem('role');
    if (role !== 'Admin') {
        window.location.href = '/src/index.html';
        return false;
    }
    return true;
}

// ✅ Sanitize dữ liệu trước khi render vào DOM (ngừa XSS)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}
```

### 7.6 CSS / SCSS

```scss
// ✅ Dùng CSS Custom Properties cho theme
:root {
    --primary-color: #e67e22;
    --secondary-color: #2c3e50;
    --text-muted: #7f8c8d;
    --border-radius: 8px;
    --transition: 0.3s ease;
}

// ✅ SCSS nesting có cấu trúc
.product-card {
    border-radius: var(--border-radius);
    transition: transform var(--transition);

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .product-name {
        font-weight: 600;
        color: var(--secondary-color);
    }
}

// ✅ Mobile-first responsive
.product-grid {
    display: grid;
    grid-template-columns: 1fr;  // Mobile

    @media (min-width: 576px) { grid-template-columns: repeat(2, 1fr); }
    @media (min-width: 992px) { grid-template-columns: repeat(3, 1fr); }
    @media (min-width: 1200px) { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 8. Kiến trúc API & Luồng dữ liệu

### Route Convention

```
GET    /api/products                  # Lấy danh sách sản phẩm
GET    /api/products/{id}             # Lấy chi tiết sản phẩm
POST   /api/products                  # Tạo sản phẩm mới (Admin)
PUT    /api/products/{id}             # Cập nhật sản phẩm (Admin)
DELETE /api/products/{id}             # Xóa sản phẩm (Admin)

POST   /api/customer/register         # Đăng ký
POST   /api/customer/login            # Đăng nhập → trả JWT token

GET    /api/shopping-cart/{userId}    # Lấy giỏ hàng
POST   /api/shopping-cart             # Thêm vào giỏ hàng
DELETE /api/shopping-cart/{id}        # Xóa khỏi giỏ hàng

POST   /api/order                     # Tạo đơn hàng
GET    /api/order/customer/{id}       # Đơn hàng của khách

POST   /api/payment/create-vnpay      # Tạo link thanh toán VNPay
GET    /api/payment/return-vnpay      # Callback từ VNPay
```

### Response Format chuẩn

```json
// Thành công
{
    "message": "Thành công",
    "data": { ... }
}

// Thành công – danh sách phân trang
{
    "data": [...],
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1
}

// Lỗi
{
    "message": "Mô tả lỗi",
    "errors": { "field": ["Chi tiết lỗi"] }
}
```

### Luồng xác thực JWT

```
FE Login → POST /api/customer/login
         ← { token: "eyJ...", userId: 5, role: "Customer" }

localStorage.setItem('token', token)

FE Request → Header: Authorization: Bearer eyJ...
           → BE validates JWT → trả dữ liệu hoặc 401
```

---

## 9. Giới hạn & Lưu ý hệ thống

### Giới hạn kỹ thuật

| Hạng mục | Giá trị / Ghi chú |
|---|---|
| Port Backend | `http://localhost:5155` (xem `launchSettings.json`) |
| Port Frontend | `http://127.0.0.1:5500` (VS Code Live Server) |
| DB | SQL Server – tên instance: `MSI`, DB: `TTNT` |
| JWT Key | Lưu trong `appsettings.json` – **KHÔNG commit key thật lên git** |
| Cloudinary | Free tier – giới hạn 25 credit/tháng, 25GB bandwidth |
| VNPay | Đang dùng **Sandbox** – chỉ test, không nhận tiền thật |
| File upload | Ảnh upload qua Cloudinary, không lưu local |
| CORS | Hiện `AllowAll` – nên restrict khi deploy production |
| Email | SMTP Gmail – giới hạn 500 email/ngày với free account |

### Lưu ý bảo mật

> ⚠️ **QUAN TRỌNG:** Các thông tin sau **KHÔNG được** commit lên Git public:
> - Connection string (username/password DB)
> - JWT secret key
> - Cloudinary API Key/Secret
> - VNPay HashSecret
> - SMTP password

```bash
# Thêm vào .gitignore
appsettings.json          # Chứa secrets
appsettings.*.json
*.user
.env
```

Dùng **User Secrets** (development) hoặc **Environment Variables** (production):
```bash
dotnet user-secrets set "Jwt:Key" "your-secret-key"
dotnet user-secrets set "ConnectionStrings:Connection" "your-connection-string"
```

### Giới hạn Gemini AI (Chatbot)

- Gemini API có rate limit (requests/phút theo tier free)
- Chatbot chỉ nên trả lời về sản phẩm/dịch vụ của dự án
- Không gửi thông tin nhạy cảm của user lên Gemini

---

## 10. Lộ trình Agentic Engineer

### Giai đoạn 1: Nền tảng (Foundation) 🟢

- [x] Hiểu kiến trúc BE/FE tách biệt
- [x] Nắm vững REST API conventions
- [x] Thành thạo JWT Authentication flow
- [x] Biết dùng Swagger để test API
- [x] Git workflow cơ bản (branch, commit, PR)

### Giai đoạn 2: Core Development 🔵

- [ ] Tối ưu EF Core queries (Include, Select, AsNoTracking)
- [ ] Viết Middleware tùy chỉnh (logging, error handling global)
- [ ] Implement Pagination chuẩn (server-side)
- [ ] Tách Frontend thành ES Modules hoàn chỉnh
- [ ] Implement caching (Response Caching hoặc Memory Cache)
- [ ] Validation tập trung (FluentValidation hoặc Data Annotations)

### Giai đoạn 3: Nâng cao (Advanced) 🟡

- [ ] Chuyển sang Repository Pattern + Unit of Work
- [ ] Thêm Unit Tests (xUnit cho BE, Jest cho FE)
- [ ] Implement Refresh Token (bảo mật JWT tốt hơn)
- [ ] Rate Limiting cho API (chống spam/DDoS)
- [ ] Image optimization trước khi upload Cloudinary
- [ ] Logging tập trung (Serilog hoặc NLog)
- [ ] Health check endpoint (`/api/health`)

### Giai đoạn 4: Production-ready 🔴

- [ ] Migrate sang **Next.js** hoặc **React** cho Frontend
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker containerization
- [ ] Environment-based configuration (Dev/Staging/Prod)
- [ ] SSL/HTTPS (không dùng `RequireHttpsMetadata = false`)
- [ ] Lock down CORS (chỉ cho phép frontend domain cụ thể)
- [ ] Database indexing & query optimization
- [ ] Monitoring & Alerting (Application Insights hoặc Prometheus)

---

## Checklist trước khi commit code

```
☐ Code không chứa thông tin nhạy cảm (password, key, ...)
☐ API mới đã được test trên Swagger
☐ Không có console.log() thừa trong JS production
☐ Tên biến/hàm rõ ràng, có comment cho logic phức tạp
☐ Response trả về đúng HTTP status code
☐ Xử lý null/undefined, edge cases
☐ UI hiển thị đúng trên mobile (responsive)
☐ Commit message theo convention (feat/fix/refactor/...)
```

---