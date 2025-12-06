// js/shop.js
import api from "./api/axiosClient.js";
import { fetchFavoriteIds, toggleFavorite } from "./api/favoriteService.js";

const API_BASE_URL = api.defaults.baseURL?.replace(/\/$/, "") || "";
const FALLBACK_IMAGE = "../images/product-1.png";

const productsContainer = document.getElementById("products-container");
const loadingSpinner = document.getElementById("loading-spinner");
const noProducts = document.getElementById("no-products");
const categoryFilter = document.getElementById("category-filter");
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const clearFiltersBtn = document.getElementById("clear-filters");
const applyFiltersBtn = document.getElementById("apply-filters");
const productCountSpan = document.getElementById("product-count");
const priceMinInput = document.getElementById("price-min");
const priceMaxInput = document.getElementById("price-max");
const priceHint = document.getElementById("price-hint");
const sortSelect = document.getElementById("sort-select");
const inStockSwitch = document.getElementById("in-stock-switch");

let allProducts = []; // Lưu tất cả sản phẩm
let categories = []; // Lưu danh sách danh mục
let promotionMap = new Map();
let defaultPriceRange = { min: 0, max: 0 };

const filterState = {
  keyword: "",
  categoryId: "",
  giaMin: null,
  giaMax: null,
  sapXep: "gia-tang",
  conHang: null
};

let fetchTimeout = null;
let favoriteIds = new Set();
const currentUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch (error) {
    return null;
  }
})();

// Format giá tiền VNĐ
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + "đ";
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
    if (typeof first === "string") {
      return resolveImageUrl(first);
    }
    if (first?.url) {
      return resolveImageUrl(first.url);
    }
    if (first?.hinhAnh) {
      return resolveImageUrl(first.hinhAnh);
    }
    if (first?.HinhAnh) {
      return resolveImageUrl(first.HinhAnh);
    }
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

// Render sản phẩm
function renderProduct(product) {
  const imageUrl = getProductImage(product);
  const inStock = product.soLuongConLaiTrongKho > 0;
  const stockClass = inStock ? "text-success" : "text-danger";
  const stockText = inStock ? `Còn hàng (${product.soLuongConLaiTrongKho})` : "Hết hàng";
  const promotion = promotionMap.get(product.id);
  const hasPromotion = !!promotion;
  const isFavorite = isProductFavorite(product.id);

  return `
    <div class="col-12 col-md-4 col-lg-3 mb-5 mb-md-0">
      <div class="product-item-wrapper" style="position: relative;">
        <button type="button" class="favorite-btn ${isFavorite ? 'active' : ''}" data-product-id="${product.id}" aria-label="Yêu thích sản phẩm" aria-pressed="${isFavorite}" title="${isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}">
          <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
        </button>
        <a class="product-item" href="#" data-product-id="${product.id}" style="display: block; text-decoration: none; color: inherit;">
          <div class="product-image-wrapper" style="position: relative; width: 100%; height: 280px; overflow: hidden; background-color: #f5f5f5; border-radius: 8px; margin-bottom: 15px;">
            <img src="${imageUrl}" class="img-fluid product-thumbnail" alt="${product.tenSp}" 
                 onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"
                 style="object-fit: cover; width: 100%; height: 100%; display: block;">
            ${inStock ? `
              <span class="icon-cross add-to-cart-btn" data-product-id="${product.id}" style="position: absolute; top: 8px; right: 8px; cursor: pointer; z-index: 10; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.9); border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: all 0.3s;">
                <img src="../images/cross.svg" class="img-fluid" alt="Thêm vào giỏ" style="width: 16px; height: 16px;">
              </span>
            ` : ''}
          </div>
          <h3 class="product-title" style="font-size: 16px; margin-bottom: 8px; min-height: 48px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">${product.tenSp}</h3>
          ${product.moTa ? `<p class="product-description text-muted small" style="font-size: 13px; margin-bottom: 10px; min-height: 36px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">${product.moTa.substring(0, 100)}${product.moTa.length > 100 ? '...' : ''}</p>` : '<div style="min-height: 36px;"></div>'}
          <div class="product-price" style="font-size: 18px; color: #2c3e50; display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; font-weight: 600;">
            ${hasPromotion ? `
              <span class="old-price">${formatPrice(product.gia)}</span>
              <span class="new-price">${formatPrice(promotion.giaSauGiam)}</span>
              <span class="discount-badge">-${Math.round(promotion.phanTramGiam)}%</span>
            ` : `
              <span>${formatPrice(product.gia)}</span>
            `}
          </div>
          <span class="stock-info ${stockClass} small d-block mt-1" style="font-size: 12px; margin-bottom: 8px;">${stockText}</span>
        </a>
      </div>
    </div>
  `;
}

// Load danh sách danh mục
async function loadCategories() {
  try {
    const response = await api.get("/api/Product/DanhSachDanhMuc");

    if (response.data && response.data.success && response.data.data) {
      categories = response.data.data;
      
      // Clear dropdown và thêm option "Tất cả"
      categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>';
      
      // Thêm các danh mục vào dropdown
      categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.tenDanhMuc;
        categoryFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Lỗi khi load danh mục:", error);
  }
}

async function loadPriceRange() {
  try {
    const response = await api.get("/api/Product/KhoangGia");
    if (response.data?.success) {
      defaultPriceRange = {
        min: response.data.data?.giaMin ?? 0,
        max: response.data.data?.giaMax ?? 0
      };
      filterState.giaMin = defaultPriceRange.min;
      filterState.giaMax = defaultPriceRange.max;
      priceMinInput.value = defaultPriceRange.min;
      priceMaxInput.value = defaultPriceRange.max;
      if (priceHint) {
        priceHint.textContent = `Từ ${formatPrice(defaultPriceRange.min)} đến ${formatPrice(defaultPriceRange.max)}`;
      }
    }
  } catch (error) {
    if (priceHint) {
      priceHint.textContent = "Không thể tải khoảng giá";
    }
    console.error("Lỗi khi lấy khoảng giá:", error);
  }
}

async function loadPromotionProducts() {
  try {
    const response = await api.get("/api/Promotion/SanPhamKhuyenMai");
    const data = response.data?.data || [];
    promotionMap = new Map(data.map(item => [item.id, item]));
  } catch (error) {
    console.warn("Không thể tải danh sách khuyến mãi:", error);
    promotionMap = new Map();
  }
}

async function fetchProducts() {
  try {
    loadingSpinner.style.display = "block";
    noProducts.style.display = "none";
    productsContainer.innerHTML = "";

    const params = {
      keyword: filterState.keyword || undefined,
      categoryId: filterState.categoryId || undefined,
      giaMin: filterState.giaMin || undefined,
      giaMax: filterState.giaMax || undefined,
      sapXep: filterState.sapXep || undefined,
      conHang: filterState.conHang
    };

    const response = await api.get("/api/Product/LocVaTimKiem", { params });
    if (response.data?.success) {
      allProducts = response.data.data || [];
      renderProducts(allProducts);
      updateProductCount(response.data.total || allProducts.length);
    } else {
      allProducts = [];
      renderProducts([]);
      updateProductCount(0);
    }
  } catch (error) {
    console.error("Lỗi khi load sản phẩm:", error);
    productsContainer.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger" role="alert">
          Lỗi khi tải danh sách sản phẩm: ${error.response?.data?.message || error.message}
        </div>
      </div>
    `;
    noProducts.style.display = "block";
    updateProductCount(0);
  } finally {
    loadingSpinner.style.display = "none";
  }
}

function renderProducts(list) {
  if (!list.length) {
    noProducts.style.display = "block";
    productsContainer.innerHTML = "";
    return;
  }

  noProducts.style.display = "none";
  productsContainer.innerHTML = list.map(product => renderProduct(product)).join("");

  document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productId = parseInt(btn.getAttribute("data-product-id"));
      await addToCart(productId);
    });
  });

  document.querySelectorAll(".product-item").forEach(item => {
    item.addEventListener("click", async (e) => {
      if (!e.target.closest(".add-to-cart-btn")) {
        e.preventDefault();
        const productId = parseInt(item.getAttribute("data-product-id"));
        await showProductDetailModal(productId);
      }
    });
  });

  document.querySelectorAll(".favorite-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productId = parseInt(btn.getAttribute("data-product-id"));
      await handleFavoriteToggle(btn, productId);
    });
  });
}

// Cập nhật số lượng sản phẩm hiển thị
function updateProductCount(count) {
  productCountSpan.textContent = count;
}

function scheduleFetch() {
  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(fetchProducts, 400);
}

// Thêm sản phẩm vào giỏ hàng
async function addToCart(productId, quantity = 1) {
  // Kiểm tra đăng nhập
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await api.post("/api/ShoppingCart/ThemVaoGio", {
      productId: productId,
      soLuong: quantity
    });

    if (response.data && response.data.success) {
      alert("✅ Đã thêm sản phẩm vào giỏ hàng!");
      // Đóng modal nếu đang mở
      const modal = document.getElementById("product-detail-modal");
      if (modal) {
        closeProductDetailModal();
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

// Hiển thị modal chi tiết sản phẩm
async function showProductDetailModal(productId) {
  try {
    const response = await api.get(`/api/Product/ChiTietSanPham/${productId}`);
    
    if (response.data && response.data.data) {
      const product = response.data.data;
      // Xử lý hinhAnh từ API (có thể là mảng hoặc object)
      if (product.hinhAnh && Array.isArray(product.hinhAnh) && product.hinhAnh.length > 0) {
        // Nếu là mảng với object có url
        product.hinhAnh = product.hinhAnh.map(img => ({
          hinhAnh: img.url || img.hinhAnh || img
        }));
      }
      renderProductDetailModal(product);
      await loadReviewsSection(product.id);
      await renderReviewForm(product.id);
    } else {
      alert("❌ Không tìm thấy sản phẩm");
    }
  } catch (error) {
    if (error.response?.status === 404) {
      alert("❌ Không tìm thấy sản phẩm");
    } else {
      alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
    }
  }
}

// Render modal chi tiết sản phẩm
function renderProductDetailModal(product) {
  // Tạo modal nếu chưa có
  let modal = document.getElementById("product-detail-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "product-detail-modal";
    modal.className = "product-modal";
    document.body.appendChild(modal);
  }

  const imageUrl = getProductImage(product);
  const inStock = product.soLuongConLaiTrongKho > 0;
  const stockText = inStock ? `Còn hàng (${product.soLuongConLaiTrongKho})` : "Hết hàng";

  modal.innerHTML = `
    <div class="product-modal-backdrop" data-close-modal></div>
    <div class="product-modal-dialog">
      <button class="product-modal-close" data-close-modal>&times;</button>
      <div class="product-modal-body product-detail-body">
        <div class="row">
          <div class="col-md-6">
            <div class="product-image-wrapper">
              <img src="${imageUrl}" alt="${product.tenSp}" class="img-fluid" 
                   onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"
                   style="width: 100%; height: auto; border-radius: 8px;">
            </div>
          </div>
          <div class="col-md-6">
            <h2 class="product-detail-title">${product.tenSp}</h2>
            <div class="product-detail-price mb-3">
              <strong style="font-size: 24px; color: #3b5d50;">${formatPrice(product.gia)}</strong>
            </div>
            <div class="product-detail-stock mb-3">
              <span class="${inStock ? 'text-success' : 'text-danger'}">${stockText}</span>
            </div>
            ${product.danhMuc ? `
              <div class="product-detail-category mb-3">
                <span class="badge bg-secondary">${product.danhMuc.tenDanhMuc}</span>
              </div>
            ` : ''}
            ${product.moTa ? `
              <div class="product-detail-description mb-4">
                <h5>Mô tả sản phẩm</h5>
                <p>${product.moTa}</p>
              </div>
            ` : ''}
            <div class="product-detail-actions">
              ${inStock ? `
                <button class="btn btn-primary btn-sm add-to-cart-modal-btn" data-product-id="${product.id}">
                  <i class="fas fa-shopping-cart me-1"></i> Thêm vào giỏ hàng
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" disabled>Hết hàng</button>
              `}
              <button class="btn btn-outline-secondary btn-sm ms-2" data-close-modal>Đóng</button>
            </div>
          </div>
        </div>
        <div class="product-reviews mt-4" data-product-id="${product.id}">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Đánh giá sản phẩm</h5>
            <span id="reviews-count-${product.id}" class="text-muted small"></span>
          </div>
          <div id="reviews-list-${product.id}" class="reviews-list">
            <p class="text-muted mb-0">Chưa có đánh giá.</p>
          </div>
          <div id="review-form-wrapper-${product.id}" class="mt-3"></div>
        </div>
      </div>
    </div>
  `;

  // Hiển thị modal
  modal.style.display = "flex";

  // Thêm event listeners
  modal.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", closeProductDetailModal);
  });

  const addToCartBtn = modal.querySelector(".add-to-cart-modal-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", async () => {
      const productId = parseInt(addToCartBtn.getAttribute("data-product-id"));
      await addToCart(productId);
    });
  }
}

// Đóng modal
function closeProductDetailModal() {
  const modal = document.getElementById("product-detail-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

function renderStars(score) {
  const maxStars = 5;
  const fullStars = Math.max(0, Math.min(score, maxStars));
  let stars = "";
  for (let i = 1; i <= maxStars; i++) {
    stars += `<i class="fa${i <= fullStars ? 's' : 'r'} fa-star"></i>`;
  }
  return stars;
}

function formatReviewDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

async function loadReviewsSection(productId) {
  const listEl = document.getElementById(`reviews-list-${productId}`);
  const countEl = document.getElementById(`reviews-count-${productId}`);
  if (!listEl) return;

  listEl.innerHTML = `<p class="text-muted">Đang tải đánh giá...</p>`;
  if (countEl) countEl.textContent = "";

  try {
    const response = await api.get(`/api/Product/Review/${productId}`);
    const reviews = response.data?.data || [];
    const section = listEl.closest(".product-reviews");

    if (countEl) {
      countEl.textContent = reviews.length ? `${reviews.length} đánh giá` : "";
    }

    if (!reviews.length) {
      listEl.innerHTML = `<p class="text-muted mb-0">Chưa có đánh giá nào cho sản phẩm này.</p>`;
      listEl.style.display = "flex";
      if (section) {
        section.style.display = "block";
      }
      return;
    }

    listEl.style.display = "flex";
    if (section) {
      section.style.display = "block";
      section.dataset.hasReviews = "true";
    }
    listEl.innerHTML = reviews.map(review => `
      <div class="review-item">
        <div class="review-header">
          <div>
            <strong>${review.customerName || "Người dùng"}</strong>
            <div class="review-date text-muted small">${formatReviewDate(review.createdAt)}</div>
          </div>
          <div class="review-stars">${renderStars(review.score)}</div>
        </div>
        ${review.content ? `<p class="review-content mb-0">${review.content}</p>` : ""}
      </div>
    `).join("");
  } catch (error) {
    const section = listEl.closest(".product-reviews");
    if (error.response?.status === 404) {
      listEl.innerHTML = "";
      listEl.style.display = "none";
      if (section && section.dataset.showForm !== "true") {
        section.style.display = "none";
      }
      if (countEl) countEl.textContent = "";
      return;
    }

    listEl.innerHTML = `
      <div class="alert alert-danger">
        Không thể tải đánh giá: ${error.response?.data?.message || error.message}
      </div>
    `;
    if (countEl) countEl.textContent = "";
  }
}

function buildReviewFormHtml(review) {
  return `
    <div class="card review-form-card">
      <div class="card-body">
        <h6 class="card-title mb-3">${review ? "Cập nhật đánh giá của bạn" : "Viết đánh giá của bạn"}</h6>
        <form id="review-form">
          <div class="mb-3">
            <label class="form-label">Đánh giá</label>
            <div class="star-rating" role="radiogroup" aria-label="Đánh giá từ 1 đến 5 sao">
              ${[1,2,3,4,5].map(value => `
                <label class="star-option" data-value="${value}" aria-label="${value} sao">
                  <input type="radio" name="review-score" value="${value}" ${review?.score === value ? "checked" : ""}>
                  <i class="fa-star ${review?.score && review.score >= value ? "fas" : "far"}"></i>
                </label>
              `).join("")}
            </div>
          </div>
          <div class="mb-3">
            <label for="review-content" class="form-label">Nội dung đánh giá</label>
            <textarea id="review-content" class="form-control" rows="3" maxlength="1000" placeholder="Chia sẻ cảm nhận của bạn về sản phẩm...">${review?.content || ""}</textarea>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button type="submit" class="btn btn-primary btn-sm">
              ${review ? '<i class="fas fa-save me-1"></i> Lưu thay đổi' : '<i class="fas fa-paper-plane me-1"></i> Gửi đánh giá'}
            </button>
            ${review ? `<button type="button" id="delete-review-btn" class="btn btn-outline-danger btn-sm"><i class="fas fa-trash me-1"></i> Xóa đánh giá</button>` : ""}
          </div>
        </form>
      </div>
    </div>
  `;
}

async function renderReviewForm(productId) {
  const wrapper = document.getElementById(`review-form-wrapper-${productId}`);
  if (!wrapper) return;
  const section = wrapper.closest(".product-reviews");

  const token = localStorage.getItem("token");
  if (!token) {
    wrapper.innerHTML = `<div class="alert alert-light border">Đăng nhập để đánh giá sản phẩm.</div>`;
    if (section) {
      section.dataset.showForm = "true";
      section.style.display = "block";
    }
    return;
  }

  wrapper.innerHTML = `<p class="text-muted">Đang chuẩn bị biểu mẫu...</p>`;

  try {
    const response = await api.get(`/api/Product/Review/Eligibility/${productId}`);
    const data = response.data?.data || {};
    const existingReview = data.review;

    if (!data.canReview && !existingReview) {
      wrapper.innerHTML = `<div class="alert alert-info">${data.message || "Bạn cần hoàn tất mua hàng để đánh giá sản phẩm."}</div>`;
      if (section && section.dataset.hasReviews !== "true") {
        section.style.display = "none";
        section.dataset.showForm = "false";
      }
      return;
    }

    if (section) {
      section.dataset.showForm = "true";
      section.style.display = "block";
    }

    wrapper.innerHTML = buildReviewFormHtml(existingReview ? {
      id: existingReview.id,
      score: existingReview.score,
      content: existingReview.content
    } : null);

    const form = document.getElementById("review-form");
    if (form) {
      const starInputs = form.querySelectorAll(".star-option");
      starInputs.forEach(option => {
        option.addEventListener("click", () => {
          starInputs.forEach(opt => opt.querySelector("i").className = "fa-star far");
          const value = parseInt(option.dataset.value, 10);
          option.querySelector("input").checked = true;
          starInputs.forEach(opt => {
            if (parseInt(opt.dataset.value, 10) <= value) {
              opt.querySelector("i").className = "fa-star fas";
            }
          });
        });
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const selected = form.querySelector('input[name="review-score"]:checked');
        const score = selected ? parseInt(selected.value, 10) : 0;
        const content = document.getElementById("review-content").value.trim();

        if (!score) {
          alert("Vui lòng chọn số sao đánh giá.");
          return;
        }

        const payload = { score, content };

        try {
          if (existingReview?.id) {
            await api.put(`/api/Product/Review/${existingReview.id}`, payload);
            alert("Đã cập nhật đánh giá.");
          } else {
            await api.post(`/api/Product/Review/${productId}`, payload);
            alert("Đã gửi đánh giá.");
          }
          await loadReviewsSection(productId);
          await renderReviewForm(productId);
        } catch (error) {
          if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            window.location.href = "login.html";
          } else {
            alert(error.response?.data?.message || "Không thể gửi đánh giá.");
          }
        }
      });
    }

    const deleteBtn = document.getElementById("delete-review-btn");
    if (deleteBtn && existingReview?.id) {
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
        try {
          await api.delete(`/api/Product/Review/${existingReview.id}`);
          alert("Đã xóa đánh giá.");
          await loadReviewsSection(productId);
          await renderReviewForm(productId);
        } catch (error) {
          if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            window.location.href = "login.html";
          } else {
            alert(error.response?.data?.message || "Không thể xóa đánh giá.");
          }
        }
      });
    }
  } catch (error) {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      wrapper.innerHTML = `
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Phiên đăng nhập đã hết hạn. Vui lòng <a href="login.html" class="alert-link">đăng nhập lại</a> để đánh giá sản phẩm.
        </div>
      `;
    } else {
      wrapper.innerHTML = `<div class="alert alert-danger">Không thể tải biểu mẫu đánh giá: ${error.response?.data?.message || error.message}</div>`;
    }
    const section = wrapper.closest(".product-reviews");
    if (section && section.dataset.hasReviews !== "true") {
      section.style.display = "none";
    }
  }
}

// Event listeners
categoryFilter.addEventListener("change", (e) => {
  filterState.categoryId = e.target.value;
  fetchProducts();
});

sortSelect.addEventListener("change", (e) => {
  filterState.sapXep = e.target.value;
  fetchProducts();
});

inStockSwitch.addEventListener("change", (e) => {
  filterState.conHang = e.target.checked ? true : null;
  fetchProducts();
});

searchInput.addEventListener("input", (e) => {
  filterState.keyword = e.target.value.trim();
  scheduleFetch();
});

priceMinInput.addEventListener("change", (e) => {
  const value = parseFloat(e.target.value);
  filterState.giaMin = !Number.isNaN(value) ? Math.max(0, value) : null;
});

priceMaxInput.addEventListener("change", (e) => {
  const value = parseFloat(e.target.value);
  filterState.giaMax = !Number.isNaN(value) ? Math.max(0, value) : null;
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  filterState.keyword = "";
  fetchProducts();
});

clearFiltersBtn.addEventListener("click", () => {
  categoryFilter.value = "";
  searchInput.value = "";
  sortSelect.value = "gia-tang";
  inStockSwitch.checked = false;
  priceMinInput.value = defaultPriceRange.min;
  priceMaxInput.value = defaultPriceRange.max;

  Object.assign(filterState, {
    keyword: "",
    categoryId: "",
    giaMin: defaultPriceRange.min,
    giaMax: defaultPriceRange.max,
    sapXep: "gia-tang",
    conHang: null
  });

  fetchProducts();
});

applyFiltersBtn.addEventListener("click", () => {
  fetchProducts();
});

// Khởi tạo khi trang load
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    initFavoriteState(),
    loadCategories(),
    loadPriceRange(),
    loadPromotionProducts()
  ]);
  await fetchProducts();
  handleReviewRedirect();
});

function handleReviewRedirect() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("productId");
  const reviewFlag = params.get("review");
  if (productId && reviewFlag === "1") {
    showProductDetailModal(parseInt(productId, 10)).finally(() => {
      params.delete("review");
      params.delete("productId");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    });
  }
}