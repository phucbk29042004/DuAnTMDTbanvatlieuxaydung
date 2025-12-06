// js/login.js
import api from "./api/axiosClient.js";

const container = document.getElementById("container");

// ==== Chuyển đổi form ====
document.getElementById("register").addEventListener("click", () => {
  container.classList.add("active");
});
document.getElementById("login").addEventListener("click", () => {
  container.classList.remove("active");
});

// ==== Đăng ký ====
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    HoTen: e.target.HoTen.value.trim(),
    DiaChi: e.target.DiaChi.value.trim(),
    SoDienThoai: e.target.SoDienThoai.value.trim(),
    Email: e.target.Email.value.trim(),
    MatKhau: e.target.MatKhau.value.trim(),
  };

  try {
    await api.post("/api/Customer/DangKy", data);
    alert("🎉 Đăng ký thành công! Hãy đăng nhập để tiếp tục.");
    container.classList.remove("active");
  } catch (err) {
    alert("❌ Lỗi đăng ký: " + (err.response?.data?.message || err.message));
  }
});

// ==== Đăng nhập ====
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    Email: e.target.Email.value.trim(),
    MatKhau: e.target.MatKhau.value.trim(),
  };

  try {
    const res = await api.post("/api/Customer/DangNhap", data);

    if (res.data && res.data.success && res.data.token && res.data.user) {
      // Lưu thông tin người dùng và token vào localStorage
      localStorage.setItem("user", JSON.stringify({
        Id: res.data.user.id,
        HoTen: res.data.user.hoTen,
        Email: res.data.user.email,
        SoDienThoai: res.data.user.sdt,
        DiaChi: res.data.user.diaChi,
        IsAdmin: res.data.user.isAdmin,
        LoaiTaiKhoan: res.data.user.loaiTaiKhoan,
      }));

      localStorage.setItem("token", res.data.token); // Lưu token

      alert(`✅ Xin chào ${res.data.user.hoTen}!`);
      
      // Chuyển hướng admin nếu là quản trị viên
      if (res.data.user.isAdmin) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }
    } else {
      alert("❌ Sai thông tin đăng nhập!");
    }
  } catch (err) {
    alert("❌ Lỗi khi đăng nhập: " + (err.response?.data?.message || err.message));
  }
});
