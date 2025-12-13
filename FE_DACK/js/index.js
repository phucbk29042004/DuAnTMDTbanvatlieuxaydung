// js/index.js
import api from "./api/axiosClient.js";
import { fetchFavoriteIds, toggleFavorite } from "./api/favoriteService.js";

const API_BASE_URL = api.defaults.baseURL?.replace(/\/$/, "") || "";
const FALLBACK_IMAGE = "../images/product-1.png";
let favoriteIds = new Set();

// Format giá tiền VNĐ
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + "đ";
}

function formatDate(dateString) {
  if (!dateString) return "";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function resolveImageUrl(path) {
  if (!path) return FALLBACK_IMAGE;
  const cleanedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (/^https?:\/\//i.test(cleanedPath)) {
    return cleanedPath;
  }
  return API_BASE_URL ? `${API_BASE_URL}/${cleanedPath}` : cleanedPath;
}

// Lấy URL hình ảnh đầu tiên từ mảng hinhAnh
function getProductImage(product) {
  if (!product) return FALLBACK_IMAGE;
  const images = product.hinhAnh;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") return resolveImageUrl(first);
    if (first?.url) return resolveImageUrl(first.url);
    if (first?.hinhAnh) return resolveImageUrl(first.hinhAnh);
    if (first?.HinhAnh) return resolveImageUrl(first.HinhAnh);
  }
  if (typeof images === "string") {
    return resolveImageUrl(images);
  }
  if (product.imageUrl) {
    return resolveImageUrl(product.imageUrl);
  }
  if (product.anhSanPham) {
    return resolveImageUrl(product.anhSanPham);
  }
  return FALLBACK_IMAGE;
}

async function initFavoriteState() {
  try {
    favoriteIds = await fetchFavoriteIds();
  } catch (error) {
    console.warn("Không thể tải danh sách yêu thích:", error.message || error);
    favoriteIds = new Set();
  }
}

function isProductFavorite(productId) {
  return favoriteIds.has(Number(productId));
}

function ensureAuthenticatedForFavorite() {
  if (!localStorage.getItem("token")) {
    const confirmLogin = confirm("Vui lòng đăng nhập để sử dụng danh sách yêu thích. Bạn có muốn chuyển đến trang đăng nhập?");
    if (confirmLogin) {
      window.location.href = "login.html";
    }
    return false;
  }
  return true;
}

function updateFavoriteButton(button, isFavorite) {
  if (!button) return;
  button.classList.toggle("active", isFavorite);
  button.setAttribute("aria-pressed", isFavorite ? "true" : "false");
  button.title = isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích";
  const icon = button.querySelector("i");
  if (icon) {
    icon.classList.toggle("fas", isFavorite);
    icon.classList.toggle("far", !isFavorite);
  }
}

async function handleFavoriteToggle(button, productId) {
  if (!ensureAuthenticatedForFavorite()) {
    return;
  }
  try {
    const result = await toggleFavorite(productId);
    if (result?.isFavorite) {
      favoriteIds.add(productId);
    } else {
      favoriteIds.delete(productId);
    }
    updateFavoriteButton(button, !!result?.isFavorite);
  } catch (error) {
    if (error.message === "unauthorized" || error.response?.status === 401) {
      ensureAuthenticatedForFavorite();
      return;
    }
    alert(error.response?.data?.message || "Không thể cập nhật danh sách yêu thích.");
  }
}

// Render sản phẩm cho index.html
function renderProduct(product) {
  const imageUrl = getProductImage(product);
  const inStock = product.soLuongConLaiTrongKho > 0;
  const isFavorite = isProductFavorite(product.id);

  return `
    <div class="col-12 col-md-4 col-lg-3 mb-5 mb-md-0">
      <div class="product-item-wrapper position-relative">
        <button type="button" class="favorite-btn ${isFavorite ? 'active' : ''}" data-product-id="${product.id}" aria-label="Yêu thích sản phẩm" aria-pressed="${isFavorite}" title="${isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}">
          <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
        </button>
        <a class="product-item" href="#" data-product-id="${product.id}" style="text-decoration: none; color: inherit;">
          <img src="${imageUrl}" class="img-fluid product-thumbnail" alt="${product.tenSp}" 
               onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">
          <h3 class="product-title">${product.tenSp}</h3>
          <strong class="product-price">${formatPrice(product.gia)}</strong>
          <span class="icon-cross add-to-cart-icon" data-product-id="${product.id}">
            <img src="../images/cross.svg" class="img-fluid" alt="Thêm vào giỏ">
          </span>
        </a>
      </div>
    </div>
  `;
}

function renderPromotionProduct(promotionProduct) {
  const {
    id,
    tenSp,
    tenKhuyenMai,
    giaGoc,
    giaSauGiam,
    phanTramGiam,
    hinhAnh,
    ngayKetThuc
  } = promotionProduct;

  const imageUrl = getProductImage({ hinhAnh });
  const discountLabel = `-${Math.round(phanTramGiam)}%`;
  const deadline = ngayKetThuc ? `Hết hạn ${formatDate(ngayKetThuc)}` : "";

  const isFavorite = isProductFavorite(id);

  return `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="promotion-card h-100 position-relative">
        <button type="button" class="favorite-btn ${isFavorite ? 'active' : ''}" data-product-id="${id}" aria-label="Yêu thích sản phẩm khuyến mãi" aria-pressed="${isFavorite}" title="${isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}">
          <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
        </button>
        <div class="promotion-image">
          <img src="${imageUrl}" alt="${tenSp}" class="img-fluid"
               onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">
          <span class="promotion-discount">${discountLabel}</span>
        </div>
        <div class="promotion-body">
          <p class="promotion-name text-uppercase">${tenKhuyenMai || "Ưu đãi đặc biệt"}</p>
          <h3 class="promotion-title">${tenSp}</h3>
          <div class="promotion-price-group">
            <span class="promotion-old-price">${formatPrice(giaGoc)}</span>
            <span class="promotion-new-price">${formatPrice(giaSauGiam)}</span>
          </div>
          <p class="promotion-deadline">${deadline}</p>
          <button class="btn btn-primary btn-sm w-100 promotion-add-btn" data-product-id="${id}">
            Áp dụng ưu đãi
          </button>
        </div>
      </div>
    </div>
  `;
}

// Lấy 3 sản phẩm ngẫu nhiên
function getRandomProducts(products, count = 3) {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Load và render sản phẩm ngẫu nhiên
async function loadRandomProducts() {
  try {
    const response = await api.get("/api/Product/DanhSachSanPham");

    if (response.data && response.data.success && response.data.data) {
      const allProducts = response.data.data;
      const randomProducts = getRandomProducts(allProducts, 3);
      
      // Tìm container sản phẩm trong index.html
      const productSection = document.querySelector('.product-section .row');
      if (productSection) {
        // Lấy phần tử đầu tiên (cột mô tả) và các cột sản phẩm
        const existingProducts = productSection.querySelectorAll('.col-12.col-md-4.col-lg-3');
        
        // Xóa các sản phẩm cũ (giữ lại cột đầu tiên nếu có)
        existingProducts.forEach((el, index) => {
          if (index > 0) { // Giữ lại cột đầu tiên (mô tả)
            el.remove();
          }
        });

        // Render 3 sản phẩm ngẫu nhiên
        randomProducts.forEach((product, index) => {
          const productHtml = renderProduct(product);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = productHtml.trim();
          const productElement = tempDiv.firstChild;
          
        // Chèn sau cột đầu tiên (mô tả)
        const firstColumn = productSection.querySelector('.col-md-12.col-lg-3');
        if (firstColumn && index === 0) {
          firstColumn.insertAdjacentElement('afterend', productElement);
        } else {
          // Tìm sản phẩm cuối cùng đã được thêm
          const lastProduct = productSection.querySelector('.col-12.col-md-4.col-lg-3:last-of-type');
          if (lastProduct) {
            lastProduct.insertAdjacentElement('afterend', productElement);
          } else if (firstColumn) {
            firstColumn.insertAdjacentElement('afterend', productElement);
          } else {
            productSection.appendChild(productElement);
          }
        }
        });

        // Thêm event listener cho nút thêm vào giỏ hàng
        document.querySelectorAll(".add-to-cart-icon").forEach(icon => {
          icon.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = parseInt(icon.getAttribute("data-product-id"));
            await addToCart(productId);
          });
        });

        productSection.querySelectorAll(".favorite-btn").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = parseInt(btn.getAttribute("data-product-id"));
            await handleFavoriteToggle(btn, productId);
          });
        });
      }
    }
  } catch (error) {
    console.error("Lỗi khi load sản phẩm:", error);
  }
}

async function loadPromotionProducts() {
  const promotionContainer = document.getElementById("promotion-products");
  const promotionEmptyState = document.getElementById("promotion-empty");
  if (!promotionContainer) return;
  try {
    const response = await api.get("/api/Promotion/SanPhamKhuyenMai");
    const products = response.data?.data || [];

    if (products.length === 0) {
      promotionContainer.innerHTML = "";
      if (promotionEmptyState) {
        promotionEmptyState.style.display = "block";
      }
      return;
    }

    promotionContainer.innerHTML = products
      .slice(0, 6)
      .map(renderPromotionProduct)
      .join("");

    if (promotionEmptyState) {
      promotionEmptyState.style.display = "none";
    }

    promotionContainer.querySelectorAll(".promotion-add-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const productId = parseInt(btn.getAttribute("data-product-id"));
        const promo = products.find(item => item.id === productId);
        await addToCart(productId, {
          promotionName: promo?.tenKhuyenMai,
          discountedPrice: promo?.giaSauGiam
        });
      });
    });

    promotionContainer.querySelectorAll(".favorite-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = parseInt(btn.getAttribute("data-product-id"));
        await handleFavoriteToggle(btn, productId);
      });
    });
  } catch (error) {
    console.error("Lỗi khi load sản phẩm khuyến mãi:", error);
    promotionContainer.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger mb-0">
          Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.
        </div>
      </div>
    `;
  }
}

// Thêm sản phẩm vào giỏ hàng
async function addToCart(productId, options = {}) {
  // Kiểm tra đăng nhập
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
    window.location.href = "login.html";
    return;
  }

  try {
    const quantity = 1; // Mặc định thêm 1 sản phẩm
    const response = await api.post("/api/ShoppingCart/ThemVaoGio", {
      productId: productId,
      soLuong: quantity
    });

    if (response.data && response.data.success) {
      if (options.promotionName) {
        alert(`✅ Đã áp dụng "${options.promotionName}" và thêm sản phẩm vào giỏ hàng!`);
      } else {
        alert("✅ Đã thêm sản phẩm vào giỏ hàng!");
      }
      if (window.refreshCartBadge) {
        window.refreshCartBadge();
      }
    } else {
      alert("❌ Lỗi: " + (response.data?.message || "Không thể thêm vào giỏ hàng"));
    }
  } catch (error) {
    if (error.response?.status === 401) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      window.location.href = "login.html";
    } else {
      alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
    }
  }
}

// Khởi tạo khi trang load
document.addEventListener("DOMContentLoaded", async () => {
  await initFavoriteState();
  await Promise.all([
    loadRandomProducts(),
    loadPromotionProducts()
  ]);
});

