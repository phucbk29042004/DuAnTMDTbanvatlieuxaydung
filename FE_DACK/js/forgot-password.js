import api from "./api/axiosClient.js";

const form = document.getElementById("forgot-form");
const messageBox = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageBox.style.display = "none";

  const email = e.target.Email.value.trim();
  if (!email) {
    showMessage("Vui lòng nhập email hợp lệ!", "error");
    return;
  }

  try {
    const res = await api.post("/api/Customer/QuenMatKhau", { email });

    if (res.data.success) {
      showMessage("✅ Mật khẩu mới đã được gửi về email của bạn!", "success");
      e.target.reset();
    } else {
      showMessage("❌ " + (res.data.message || "Không thể gửi email!"), "error");
    }
  } catch (err) {
    showMessage("❌ " + (err.response?.data?.message || "Lỗi khi gửi yêu cầu!"), "error");
  }
});

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  messageBox.style.display = "block";
}
