// js/cart.js
import api from "./api/axiosClient.js";

const API_BASE_URL = api.defaults.baseURL?.replace(/\/$/, "") || "";
const FALLBACK_IMAGE = "../images/product-1.png";

const cartItemsContainer = document.getElementById("cart-items");
const cartContainer = document.getElementById("cart-container");
const cartTotals = document.getElementById("cart-totals");
const emptyCart = document.getElementById("empty-cart");
const loadingSpinner = document.getElementById("loading-spinner");
const totalQuantitySpan = document.getElementById("total-quantity");
const totalPriceSpan = document.getElementById("total-price");
const checkoutBtn = document.getElementById("checkout-btn");

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

function getCartItemImage(item) {
  if (!item) return FALLBACK_IMAGE;
  if (item.imageUrl) return resolveImageUrl(item.imageUrl);
  if (item.anhSanPham) return resolveImageUrl(item.anhSanPham);
  if (Array.isArray(item.hinhAnh) && item.hinhAnh.length > 0) {
    const first = item.hinhAnh[0];
    if (typeof first === "string") return resolveImageUrl(first);
    if (first?.url) return resolveImageUrl(first.url);
    if (first?.hinhAnh) return resolveImageUrl(first.hinhAnh);
  }
  return FALLBACK_IMAGE;
}

// Render sản phẩm trong giỏ hàng
function renderCartItem(item) {
  const imageUrl = getCartItemImage(item);
  const giaGoc = item.giaGoc ?? item.gia ?? 0;
  const giaSauKhuyenMai = item.giaSauKhuyenMai ?? giaGoc;
  const thanhTienGoc = item.thanhTienGoc ?? (giaGoc * item.soLuong);
  const thanhTienSauKhuyenMai = item.thanhTienSauKhuyenMai ?? (giaSauKhuyenMai * item.soLuong);
  const tietKiem = item.tietKiem ?? (thanhTienGoc - thanhTienSauKhuyenMai);
  const hasPromotion = giaSauKhuyenMai < giaGoc - 1e-6;

  const unitPriceHtml = hasPromotion
    ? `
        <div class="d-flex flex-column">
          <span class="text-decoration-line-through text-muted small">${formatPrice(giaGoc)}</span>
          <span class="text-danger fw-semibold">${formatPrice(giaSauKhuyenMai)}</span>
          ${item.khuyenMai?.phanTramGiam ? `<small class="text-success">-${item.khuyenMai.phanTramGiam}%</small>` : ""}
        </div>
      `
    : `<strong>${formatPrice(giaGoc)}</strong>`;

  const subtotalHtml = hasPromotion
    ? `
        <div class="d-flex flex-column">
          <span class="text-decoration-line-through text-muted small">${formatPrice(thanhTienGoc)}</span>
          <strong>${formatPrice(thanhTienSauKhuyenMai)}</strong>
          <small class="text-success">Tiết kiệm ${formatPrice(tietKiem)}</small>
        </div>
      `
    : `<strong>${formatPrice(thanhTienGoc)}</strong>`;

  return `
    <tr data-product-id="${item.productId}">
      <td class="product-thumbnail">
        <img src="${imageUrl}" alt="${item.tenSp}" class="img-fluid" 
             onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"
             style="width: 80px; height: 80px; object-fit: cover;">
      </td>
      <td class="product-name">
        <h2 class="h5 text-black">${item.tenSp}</h2>
      </td>
      <td>${unitPriceHtml}</td>
      <td>
        <div class="input-group mb-3 d-flex align-items-center quantity-container" style="max-width: 120px;">
          <div class="input-group-prepend">
            <button class="btn btn-outline-black decrease" type="button" onclick="updateQuantity(${item.productId}, -1)">&minus;</button>
          </div>
          <input type="number" class="form-control text-center quantity-amount" 
                 value="${item.soLuong}" 
                 data-product-id="${item.productId}"
                 data-current-quantity="${item.soLuong}"
                 min="1"
                 aria-label="Số lượng của ${item.tenSp}"
                 onchange="handleQuantityInput(${item.productId}, this.value)">
          <div class="input-group-append">
            <button class="btn btn-outline-black increase" type="button" onclick="updateQuantity(${item.productId}, 1)">&plus;</button>
          </div>
        </div>
      </td>
      <td>${subtotalHtml}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.productId})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

// Load giỏ hàng
async function loadCart() {
  // Kiểm tra đăng nhập
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    loadingSpinner.style.display = "block";
    cartItemsContainer.innerHTML = "";

    const response = await api.get("/api/ShoppingCart/LayChiTietGioHang");

    if (response.data && response.data.success) {
      const {
        data: items = [],
        tongSoLuong = 0,
        tongTienGoc = 0,
        tongTienSauKhuyenMai = 0,
        tongTietKiem = 0
      } = response.data;

      if (!items.length) {
        cartContainer.style.display = "none";
        cartTotals.style.display = "none";
        emptyCart.style.display = "block";
      } else {
        cartContainer.style.display = "block";
        cartTotals.style.display = "block";
        emptyCart.style.display = "none";

        cartItemsContainer.innerHTML = items.map(item => renderCartItem(item)).join("");

        // Cập nhật tổng
        const derivedTotalQuantity = items.reduce((sum, item) => sum + (item.soLuong || 0), 0);
        totalQuantitySpan.textContent = tongSoLuong || derivedTotalQuantity;

        const totalOriginal = typeof tongTienGoc === "number" && tongTienGoc > 0
          ? tongTienGoc
          : items.reduce((sum, item) => sum + (item.thanhTienGoc || 0), 0);
        const totalDiscounted = typeof tongTienSauKhuyenMai === "number" && tongTienSauKhuyenMai > 0
          ? tongTienSauKhuyenMai
          : items.reduce((sum, item) => sum + (item.thanhTienSauKhuyenMai || item.thanhTienGoc || 0), 0);
        const totalSavings = typeof tongTietKiem === "number" && tongTietKiem > 0
          ? tongTietKiem
          : Math.max(totalOriginal - totalDiscounted, 0);

        const hasCartPromotion = totalSavings > 0.5;
        if (hasCartPromotion) {
          totalPriceSpan.innerHTML = `
            <span class="text-muted text-decoration-line-through d-block">${formatPrice(totalOriginal)}</span>
            <span class="text-primary">${formatPrice(totalDiscounted)}</span>
            <small class="text-success d-block">Tiết kiệm ${formatPrice(totalSavings)}</small>
          `;
        } else {
          totalPriceSpan.textContent = formatPrice(totalDiscounted || totalOriginal);
        }
      }
    } else {
      cartContainer.style.display = "none";
      cartTotals.style.display = "none";
      emptyCart.style.display = "block";
    }
  } catch (error) {
    if (error.response?.status === 401) {
      alert("Vui lòng đăng nhập để xem giỏ hàng!");
      window.location.href = "login.html";
    } else {
      cartItemsContainer.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <div class="alert alert-danger" role="alert">
              Lỗi khi tải giỏ hàng: ${error.response?.data?.message || error.message}
            </div>
          </td>
        </tr>
      `;
    }
  } finally {
    loadingSpinner.style.display = "none";
  }
}

// Xóa sản phẩm khỏi giỏ hàng
window.removeFromCart = async function(productId, skipConfirm = false) {
  if (!skipConfirm && !confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
    return;
  }

  try {
    const response = await api.delete(`/api/ShoppingCart/XoaKhoiGio/${productId}`);

    if (response.data && response.data.success) {
      alert("✅ Đã xóa sản phẩm khỏi giỏ hàng!");
      loadCart();
    } else {
      alert("❌ Lỗi: " + (response.data?.message || "Không thể xóa sản phẩm"));
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
  }
};

async function setCartQuantity(productId, newQuantity) {
  const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
  const currentQuantity = parseInt(quantityInput?.dataset.currentQuantity || quantityInput?.value || "1");

  if (Number.isNaN(newQuantity) || newQuantity <= 0) {
    if (confirm("Bạn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
      await removeFromCart(productId, true);
    } else {
      if (quantityInput) {
        quantityInput.value = currentQuantity;
      }
    }
    return;
  }

  if (newQuantity === currentQuantity) {
    return;
  }

  try {
    loadingSpinner.style.display = "block";
    if (newQuantity > currentQuantity) {
      const delta = newQuantity - currentQuantity;
      const response = await api.post("/api/ShoppingCart/ThemVaoGio", {
        productId,
        soLuong: delta
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Không thể cập nhật số lượng");
      }
      await loadCart();
    } else {
      // Giảm số lượng: xóa và thêm lại
      // Giảm số lượng: xóa và thêm lại với số lượng mới
      await api.delete(`/api/ShoppingCart/XoaKhoiGio/${productId}`);
      const response = await api.post("/api/ShoppingCart/ThemVaoGio", {
        productId,
        soLuong: newQuantity
      });

      if (!response.data?.success) {
        await api.post("/api/ShoppingCart/ThemVaoGio", {
          productId,
          soLuong: currentQuantity
        });
        throw new Error(response.data?.message || "Không thể cập nhật số lượng");
      }
      await loadCart();
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
    if (quantityInput) {
      quantityInput.value = currentQuantity;
    }
  } finally {
    loadingSpinner.style.display = "none";
  }
}

// Cập nhật số lượng sản phẩm bằng nút +/- 
window.updateQuantity = async function(productId, change) {
  const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
  const currentQuantity = parseInt(quantityInput?.dataset.currentQuantity || quantityInput?.value || "1");
  const newQuantity = Math.max(1, currentQuantity + change);
  await setCartQuantity(productId, newQuantity);
};

window.handleQuantityInput = async function(productId, rawValue) {
  const parsed = parseInt(rawValue, 10);
  await setCartQuantity(productId, parsed);
};

// Đặt hàng
checkoutBtn.addEventListener("click", async () => {
  if (!confirm("Bạn có chắc chắn muốn đặt hàng?")) {
    return;
  }

  try {
    const response = await api.post("/api/Order/TaoDonHang");

    if (response.data && response.data.success) {
      alert("✅ Đặt hàng thành công! Mã đơn hàng: #" + response.data.data.orderId);
      window.location.href = "orders.html";
    } else {
      alert("❌ Lỗi: " + (response.data?.message || "Không thể tạo đơn hàng"));
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
  }
});

// Khởi tạo khi trang load
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});


