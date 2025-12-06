// /js/api/userStatus.js
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
  } else {
    // Nếu chưa login
    loginLink.style.display = "flex";
    userInfo.style.display = "none";
    document.body.classList.remove("logged-in");
  }

  // Xử lý logout (sẽ được gọi từ dropdown)
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
});

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