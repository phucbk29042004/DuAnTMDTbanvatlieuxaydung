// js/customer.js
import api from "./api.js";

document.getElementById("register-form").addEventListener("submit", async e => {
  e.preventDefault();

  const data = {
    tenDangNhap: e.target.tenDangNhap.value,
    matKhau: e.target.matKhau.value,
    email: e.target.email.value
  };

  try {
    await api.post("/api/Customer/DangKy", data);
    document.getElementById("msg").textContent = "✅ Đăng ký thành công!";
  } catch (err) {
    document.getElementById("msg").textContent = "❌ Lỗi đăng ký: " + err.message;
  }
});
