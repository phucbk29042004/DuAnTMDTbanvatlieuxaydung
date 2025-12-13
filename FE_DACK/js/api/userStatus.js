// /js/api/userStatus.js
import api from "./axiosClient.js";

document.addEventListener("DOMContentLoaded", function() {
  const userInfo = document.getElementById("user-info");
  const usernameEl = document.getElementById("username");
  const loginLink = document.getElementById("login-link");
  const logoutLink = document.getElementById("logout-link");

  // Lấy thông tin user từ localStorage (nếu có)
  const userData = localStorage.getItem("user");

  if (userData) {
    const user = JSON.parse(userData);

    // Render tên từ cột HoTen trong backend
    usernameEl.textContent = user.HoTen || "Người dùng";

    // Ẩn icon login, hiện dòng chào
    loginLink.style.display = "none";
    userInfo.style.display = "flex";

    // Thêm class logged-in để CSS điều chỉnh
    document.body.classList.add("logged-in");
    
    // Tạo dropdown menu nếu chưa có
    createUserDropdown(userInfo, user);

    // Cập nhật huy hiệu giỏ hàng khi đã đăng nhập
    refreshCartBadge();
  } else {
    // Nếu chưa login
    loginLink.style.display = "flex";
    userInfo.style.display = "none";
    document.body.classList.remove("logged-in");

    // Ẩn huy hiệu giỏ hàng khi chưa đăng nhập
    updateCartBadgeCount(0);
  }

  // Xử lý logout (sẽ được gọi từ dropdown)
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
});

// Tìm tất cả link giỏ hàng trên navbar
function getCartLinks() {
  return Array.from(document.querySelectorAll('a[href$="cart.html"], a[href*="cart.html"]'));
}

// Tạo (nếu chưa có) và trả về badge
function ensureCartBadge(link) {
  let badge = link.querySelector(".cart-count-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "cart-count-badge";
    badge.setAttribute("aria-label", "Số sản phẩm trong giỏ hàng");
    link.style.position = "relative";
    link.appendChild(badge);
  }
  return badge;
}

// Cập nhật số lượng hiển thị trên badge
function updateCartBadgeCount(count) {
  const links = getCartLinks();
  const safeCount = Number.isFinite(count) && count > 0 ? count : 0;
  links.forEach(link => {
    const badge = ensureCartBadge(link);
    if (safeCount === 0) {
      badge.style.display = "none";
      badge.textContent = "";
    } else {
      badge.style.display = "inline-flex";
      badge.textContent = safeCount > 99 ? "99+" : String(safeCount);
    }
  });
}

// Lấy số lượng từ API giỏ hàng
async function refreshCartBadge() {
  const token = localStorage.getItem("token");
  if (!token) {
    updateCartBadgeCount(0);
    return;
  }

  try {
    const res = await api.get("/api/ShoppingCart/LayChiTietGioHang");
    // Dữ liệu có thể khác nhau tùy backend, xử lý mềm dẻo
    const payload = res.data || {};
    const dataNode = payload.data || {};
    const items = Array.isArray(dataNode.data) ? dataNode.data : Array.isArray(payload.data) ? payload.data : [];
    const derivedTotal = items.reduce((sum, item) => sum + (item.soLuong || 0), 0);
    const total = payload.tongSoLuong ?? dataNode.tongSoLuong ?? derivedTotal;
    updateCartBadgeCount(total);
  } catch (error) {
    if (error.response?.status === 401) {
      updateCartBadgeCount(0);
    } else {
      console.warn("Không thể tải số lượng giỏ hàng:", error.response?.data?.message || error.message);
    }
  }
}

// Cho phép trang khác gọi để cập nhật badge sau khi thêm vào giỏ
window.refreshCartBadge = refreshCartBadge;
window.updateCartBadgeCount = updateCartBadgeCount;

// Tạo dropdown menu cho user info
function createUserDropdown(userInfoContainer, user) {
  // Kiểm tra xem dropdown đã tồn tại chưa
  let dropdown = document.getElementById("user-dropdown");
  if (dropdown) {
    dropdown.remove();
  }

  // Tạo dropdown HTML
  dropdown = document.createElement("div");
  dropdown.id = "user-dropdown";
  dropdown.className = "user-dropdown-menu";
  dropdown.style.display = "none";
  dropdown.style.maxHeight = "320px";

  dropdown.innerHTML = `
    <div class="dropdown-header" style="padding: 15px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;">
      <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">${user.HoTen || "Người dùng"}</div>
      <div style="font-size: 13px; color: #6c757d;">${user.Email || ""}</div>
    </div>
    <div class="dropdown-body" style="padding: 8px 0;">
      <a href="profile.html" class="dropdown-item" style="display: block; padding: 12px 20px; color: #333; text-decoration: none; transition: background 0.2s;">
        <i class="fas fa-user me-2" style="width: 20px;"></i> Thông tin cá nhân
      </a>
      <a href="orders.html" class="dropdown-item" style="display: block; padding: 12px 20px; color: #333; text-decoration: none; transition: background 0.2s;">
        <i class="fas fa-shopping-bag me-2" style="width: 20px;"></i> Đơn hàng của tôi
      </a>
      <a href="favorites.html" class="dropdown-item" style="display: block; padding: 12px 20px; color: #333; text-decoration: none; transition: background 0.2s;">
        <i class="fas fa-heart me-2" style="width: 20px;"></i> Sản phẩm yêu thích
      </a>
      <hr style="margin: 8px 0; border: 0; border-top: 1px solid #dee2e6;">
      <a href="#" id="dropdown-logout" class="dropdown-item" style="display: block; padding: 12px 20px; color: #dc3545; text-decoration: none; transition: background 0.2s;">
        <i class="fas fa-sign-out-alt me-2" style="width: 20px;"></i> Đăng xuất
      </a>
    </div>
  `;

  // Chèn dropdown vào container
  userInfoContainer.appendChild(dropdown);

  // Thêm event listener cho click vào user-info để toggle dropdown
  userInfoContainer.addEventListener("click", (e) => {
    if (e.target.closest("#user-dropdown") || e.target.closest(".dropdown-item")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    toggleDropdown();
  });

  // Đóng dropdown khi click ra ngoài
  document.addEventListener("click", (e) => {
    if (!userInfoContainer.contains(e.target)) {
      closeDropdown();
    }
  });

  // Xử lý logout từ dropdown
  const dropdownLogout = document.getElementById("dropdown-logout");
  if (dropdownLogout) {
    dropdownLogout.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleLogout();
    });
  }

  // Hàm toggle dropdown
  function toggleDropdown() {
    const isOpen = dropdown.style.display === "block";
    closeDropdown();
    if (!isOpen) {
      dropdown.style.display = "block";
    }
  }

  // Hàm đóng dropdown
  function closeDropdown() {
    dropdown.style.display = "none";
  }
}

// Xử lý logout
function handleLogout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Reload trang hoặc redirect về trang chủ
    window.location.href = "index.html";
  }
}