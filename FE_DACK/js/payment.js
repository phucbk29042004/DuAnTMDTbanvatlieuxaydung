// js/payment.js
import api from "./api/axiosClient.js";

const orderInfoContainer = document.getElementById("order-info");
const paymentHistoryList = document.getElementById("payment-history-list");
const loadingSpinner = document.getElementById("loading-spinner");
const paymentForm = document.getElementById("payment-form");
const soTienInput = document.getElementById("so-tien");
const conLaiSpan = document.getElementById("con-lai");
const orderIdInput = document.getElementById("order-id");

let currentOrderData = null;

// Format giá tiền VNĐ
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + "đ";
}

// Format ngày tháng
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Lấy ID đơn hàng từ URL
function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('orderId');
}

// Render thông tin đơn hàng
function renderOrderInfo(data) {
  return `
    <p><strong>Mã đơn hàng:</strong> #${data.orderId}</p>
    <p><strong>Tổng giá trị:</strong> <span class="text-primary h5">${formatPrice(data.tongGiaTri)}</span></p>
    <p><strong>Đã thanh toán:</strong> <span class="text-success">${formatPrice(data.daThanhToan)}</span></p>
    <p><strong>Còn lại:</strong> <span class="text-danger fw-bold">${formatPrice(data.conLai)}</span></p>
    <p><strong>Trạng thái:</strong> <span class="badge bg-secondary">${data.trangThai}</span></p>
    <p><strong>Số lần thanh toán:</strong> ${data.soLanThanhToan}</p>
  `;
}

// Render lịch sử thanh toán
function renderPaymentHistory(history) {
  if (!history || history.length === 0) {
    return '<p class="text-muted small">Chưa có lịch sử thanh toán.</p>';
  }

  return `
    <div class="list-group list-group-flush">
      ${history.map(payment => `
        <div class="list-group-item px-0">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <p class="mb-1"><strong>${formatPrice(payment.soTien)}</strong></p>
              <small class="text-muted">${payment.phuongThuc}</small>
              <br><small class="text-muted">${formatDate(payment.ngayThanhToan)}</small>
            </div>
            <span class="badge ${
              ['Thành công', 'Thanh toán COD'].includes(payment.trangThai) ? 'bg-success' : 'bg-secondary'
            }">
              ${
                (payment.phuongThuc || '').toUpperCase() === 'COD' && ['Thành công', 'Thanh toán COD'].includes(payment.trangThai)
                  ? 'COD (chờ giao hàng)'
                  : (payment.trangThai || 'Không rõ')
              }
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Load thông tin thanh toán
async function loadPaymentInfo() {
  // Kiểm tra đăng nhập
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const orderId = getOrderIdFromUrl();
  if (!orderId) {
    orderInfoContainer.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Không tìm thấy ID đơn hàng!
      </div>
    `;
    return;
  }

  orderIdInput.value = orderId;

  try {
    loadingSpinner.style.display = "block";

    // Load thông tin thanh toán
    const paymentResponse = await api.get(`/api/Payment/KiemTraThanhToan/${orderId}`);
    
    if (paymentResponse.data && paymentResponse.data.success && paymentResponse.data.data) {
      currentOrderData = paymentResponse.data.data;
      orderInfoContainer.innerHTML = renderOrderInfo(currentOrderData);
      
      // Cập nhật số tiền còn lại
      const conLai = currentOrderData.conLai || 0;
      conLaiSpan.textContent = formatPrice(conLai);
      soTienInput.max = conLai;
      soTienInput.value = conLai; // Mặc định thanh toán toàn bộ

      // Load lịch sử thanh toán
      const historyResponse = await api.get(`/api/Payment/LichSuThanhToan/${orderId}`);
      if (historyResponse.data && historyResponse.data.success && historyResponse.data.data) {
        paymentHistoryList.innerHTML = renderPaymentHistory(historyResponse.data.data.lichSuThanhToan || []);
      }
    } else {
      orderInfoContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Không tìm thấy thông tin đơn hàng!
        </div>
      `;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      alert("Vui lòng đăng nhập để thanh toán!");
      window.location.href = "login.html";
    } else {
      orderInfoContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Lỗi khi tải thông tin thanh toán: ${error.response?.data?.message || error.message}
        </div>
      `;
    }
  } finally {
    loadingSpinner.style.display = "none";
  }
}

// Xử lý submit form thanh toán
paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const orderId = parseInt(orderIdInput.value);
  const soTien = parseFloat(soTienInput.value);
  const phuongThuc = document.getElementById("phuong-thuc").value;

  if (!orderId || !soTien || !phuongThuc) {
    alert("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (soTien <= 0) {
    alert("Số tiền thanh toán phải lớn hơn 0!");
    return;
  }

  try {
    const response = await api.post("/api/Payment/ThanhToan", {
      orderId: orderId,
      soTien: soTien,
      phuongThucThanhToan: phuongThuc
    });
  if(response.data.code === 202 && response.data.url){
        window.location.href = response.data.url;
        return;
      }
    if (response.data && response.data.success) {
    
      alert("✅ Thanh toán thành công!");
      
      // Reload thông tin thanh toán
      await loadPaymentInfo();
      
      // Reset form
      soTienInput.value = "";
      document.getElementById("phuong-thuc").value = "";
    } else {
      alert("❌ Lỗi: " + (response.data?.message || "Thanh toán thất bại"));
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
  }
});

// Khởi tạo khi trang load
document.addEventListener("DOMContentLoaded", () => {
  loadPaymentInfo();
});





