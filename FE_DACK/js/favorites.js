import api from "./api/axiosClient.js";
import { fetchFavoriteList, removeFavorite } from "./api/favoriteService.js";

const API_BASE_URL = api.defaults.baseURL?.replace(/\/$/, "") || "";
const FALLBACK_IMAGE = "../images/product-1.png";

const container = document.getElementById("favorites-container");
const emptyState = document.getElementById("favorites-empty");
const spinner = document.getElementById("favorites-spinner");

document.addEventListener("DOMContentLoaded", () => {
  initFavoritesPage();
});

function resolveImageUrl(path) {
  if (!path) return FALLBACK_IMAGE;
  const cleanedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  if (/^https?:\/\//i.test(cleanedPath)) {
    return cleanedPath;
  }
  return API_BASE_URL ? `${API_BASE_URL}/${cleanedPath}` : cleanedPath;
}

function getProductImage(item) {
  if (item.HinhAnhDaiDien) {
    return resolveImageUrl(item.HinhAnhDaiDien);
  }
  if (item.hinhAnh && Array.isArray(item.hinhAnh) && item.hinhAnh.length) {
    const first = item.hinhAnh[0];
    if (typeof first === "string") return resolveImageUrl(first);
    if (first?.url) return resolveImageUrl(first.url);
    if (first?.hinhAnh) return resolveImageUrl(first.hinhAnh);
    if (first?.HinhAnh) return resolveImageUrl(first.HinhAnh);
  }
  return FALLBACK_IMAGE;
}

function formatPrice(price) {
  if (price == null) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

async function initFavoritesPage() {
  if (!localStorage.getItem("token")) {
    alert("Vui lòng đăng nhập để xem danh sách yêu thích.");
    window.location.href = "login.html";
    return;
  }
  await loadFavorites();
}

async function loadFavorites() {
  spinner.style.display = "inline-block";
  emptyState.style.display = "none";
  container.innerHTML = "";
  try {
    const favorites = await fetchFavoriteList();
    if (!favorites.length) {
      emptyState.style.display = "block";
      return;
    }
    renderFavorites(favorites);
  } catch (error) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          Không thể tải danh sách yêu thích: ${error.response?.data?.message || error.message}
        </div>
      </div>
    `;
  } finally {
    spinner.style.display = "none";
  }
}

function renderFavorites(list) {
  container.innerHTML = list
    .map(item => {
      const imageUrl = getProductImage(item);
      const inStock = item.SoLuongConLai > 0;
      const stockText = inStock ? `Còn hàng (${item.SoLuongConLai})` : "Hết hàng";
      return `
        <div class="col-12 col-md-6 col-lg-4" data-product-id="${item.IdProduct}">
          <div class="favorite-card h-100 d-flex flex-column">
            <div class="favorite-card-image position-relative">
              <img src="${imageUrl}" alt="${item.TenSp}" class="img-fluid" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">
              <button type="button" class="favorite-btn active remove-favorite-btn" data-product-id="${item.IdProduct}" aria-label="Bỏ khỏi yêu thích" aria-pressed="true">
                <i class="fas fa-heart"></i>
              </button>
            </div>
            <div class="favorite-card-body flex-grow-1 d-flex flex-column">
              <h4 class="favorite-title">${item.TenSp}</h4>
              <p class="favorite-description text-muted">${item.MoTa ? item.MoTa.substring(0, 120) + (item.MoTa.length > 120 ? "..." : "") : "Chưa có mô tả chi tiết."}</p>
              <div class="favorite-price mb-2">
                <strong>${formatPrice(item.Gia)}</strong>
              </div>
              <span class="${inStock ? "text-success" : "text-danger"} small mb-3 d-block">${stockText}</span>
              <div class="mt-auto d-flex gap-2 flex-wrap">
                <button class="btn btn-primary btn-sm add-to-cart-favorite" data-product-id="${item.IdProduct}" ${inStock ? "" : "disabled"}>
                  <i class="fas fa-cart-plus me-1"></i> Thêm vào giỏ
                </button>
                <button class="btn btn-outline-secondary btn-sm remove-favorite-btn" data-product-id="${item.IdProduct}">
                  <i class="fas fa-times me-1"></i> Bỏ yêu thích
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".add-to-cart-favorite").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const productId = parseInt(btn.dataset.productId);
      await addToCart(productId);
    });
  });

  container.querySelectorAll(".remove-favorite-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const productId = parseInt(btn.dataset.productId);
      await handleRemoveFavorite(productId, btn.closest(".col-12"));
    });
  });
}

async function handleRemoveFavorite(productId, cardElement) {
  if (!productId) return;
  if (!confirm("Bạn có chắc muốn bỏ sản phẩm này khỏi danh sách yêu thích?")) {
    return;
  }
  try {
    await removeFavorite(productId);
    if (cardElement) {
      cardElement.remove();
    }
    if (!container.children.length) {
      emptyState.style.display = "block";
    }
  } catch (error) {
    if (error.message === "unauthorized" || error.response?.status === 401) {
      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      window.location.href = "login.html";
      return;
    }
    alert(error.response?.data?.message || "Không thể xóa sản phẩm khỏi danh sách yêu thích.");
  }
}

async function addToCart(productId) {
  if (!localStorage.getItem("token")) {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
    window.location.href = "login.html";
    return;
  }
  try {
    const response = await api.post("/api/ShoppingCart/ThemVaoGio", {
      productId,
      soLuong: 1
    });
    if (response.data?.success) {
      alert("✅ Đã thêm sản phẩm vào giỏ hàng!");
    } else {
      alert(response.data?.message || "Không thể thêm vào giỏ hàng.");
    }
  } catch (error) {
    alert(error.response?.data?.message || "Không thể thêm sản phẩm vào giỏ hàng.");
  }
}

