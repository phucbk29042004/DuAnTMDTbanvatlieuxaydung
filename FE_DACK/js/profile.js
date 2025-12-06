// js/profile.js
import api from "./api/axiosClient.js";

const loadingSpinner = document.getElementById("loading-spinner");
const profileForm = document.getElementById("profile-form");
const changePasswordForm = document.getElementById("change-password-form");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");

// Load thông tin cá nhân
async function loadProfile() {
  // Kiểm tra đăng nhập
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    loadingSpinner.style.display = "block";

    const response = await api.get("/api/Customer/ThongTinCaNhan");

    if (response.data && response.data.success && response.data.user) {
      const user = response.data.user;
      
      // Điền thông tin vào form
      document.getElementById("hoTen").value = user.hoTen || "";
      document.getElementById("email").value = user.email || "";
      document.getElementById("sdt").value = user.sdt || "";
      document.getElementById("diaChi").value = user.diaChi || "";
      
      // Hiển thị tên và email ở header
      profileName.textContent = user.hoTen || "Người dùng";
      profileEmail.textContent = user.email || "";
    } else {
      alert("❌ Lỗi: " + (response.data?.message || "Không thể tải thông tin"));
    }
  } catch (error) {
    if (error.response?.status === 401) {
      alert("Vui lòng đăng nhập để xem thông tin cá nhân!");
      window.location.href = "login.html";
    } else {
      alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
    }
  } finally {
    loadingSpinner.style.display = "none";
  }
}

// Cập nhật thông tin cá nhân
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    HoTen: document.getElementById("hoTen").value.trim(),
    Sdt: document.getElementById("sdt").value.trim(),
    DiaChi: document.getElementById("diaChi").value.trim()
  };

  if (!formData.HoTen) {
    alert("Vui lòng nhập họ tên!");
    return;
  }

  try {
    const response = await api.put("/api/Customer/CapNhatThongTin", formData);

    if (response.data && response.data.user) {
      // Cập nhật localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        user.HoTen = response.data.user.hoTen;
        user.SoDienThoai = response.data.user.sdt;
        user.DiaChi = response.data.user.diaChi;
        localStorage.setItem("user", JSON.stringify(user));
        
        // Cập nhật tên hiển thị
        const usernameEl = document.getElementById("username");
        if (usernameEl) {
          usernameEl.textContent = user.HoTen || "Người dùng";
        }
        profileName.textContent = user.HoTen || "Người dùng";
      }

      alert("✅ Cập nhật thông tin thành công!");
      loadProfile(); // Reload để đảm bảo đồng bộ
    } else {
      alert("❌ Lỗi: " + (response.data?.message || "Không thể cập nhật thông tin"));
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
  }
});

// Đổi mật khẩu
changePasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const matKhauMoi = document.getElementById("matKhauMoi").value.trim();

  if (!matKhauMoi) {
    alert("Vui lòng nhập mật khẩu mới!");
    return;
  }

  if (matKhauMoi.length < 6) {
    alert("Mật khẩu phải có ít nhất 6 ký tự!");
    return;
  }

  // Lấy email từ localStorage
  const userData = localStorage.getItem("user");
  if (!userData) {
    alert("Không tìm thấy thông tin người dùng!");
    return;
  }

  const user = JSON.parse(userData);
  const email = user.Email;

  try {
    const response = await api.post("/api/Customer/DoiMatKhau", {
      Email: email,
      MatKhauMoi: matKhauMoi
    });

    if (response.data && response.data.success) {
      alert("✅ Đổi mật khẩu thành công!");
      document.getElementById("matKhauMoi").value = "";
    } else {
      alert("❌ Lỗi: " + (response.data?.message || "Không thể đổi mật khẩu"));
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
  }
});

// Khởi tạo khi trang load
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});




