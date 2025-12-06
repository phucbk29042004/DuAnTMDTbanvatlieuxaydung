// js/order-detail.js
import api from "./api/axiosClient.js";

const orderDetailContainer = document.getElementById("order-detail-container");
const loadingSpinner = document.getElementById("loading-spinner");

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

// Lấy màu badge theo trạng thái
function getStatusBadgeClass(status) {
  const statusMap = {
    'Chờ xác nhận': 'bg-warning',
    'Đã hủy': 'bg-danger',
    'Đã thanh toán': 'bg-success',
    'Thanh toán một phần': 'bg-info',
    'Đang giao hàng': 'bg-primary',
    'Hoàn thành': 'bg-success'
  };
  return statusMap[status] || 'bg-secondary';
}

// Lấy ID đơn hàng từ URL
function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Render chi tiết đơn hàng
function renderOrderDetail(data) {
  const statusBadgeClass = getStatusBadgeClass(data.trangThai);
  const customer = data.khachHang || {};

  return `
    <div class="row">
      <div class="col-md-8">
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Đơn hàng #${data.orderId}</h5>
            <span class="badge ${statusBadgeClass} text-white">${data.trangThai}</span>
          </div>
          <div class="card-body">
            <p class="mb-2"><strong>Ngày đặt hàng:</strong> ${formatDate(data.ngayTao)}</p>
            <p class="mb-3"><strong>Tổng giá trị:</strong> <span class="text-primary h5">${formatPrice(data.tongGiaTri)}</span></p>

            <h6 class="mt-4 mb-3">Thông tin khách hàng:</h6>
            <div class="row mb-3">
              <div class="col-md-6">
                <p class="mb-1"><strong>Họ tên:</strong> ${customer.hoTen || 'N/A'}</p>
                <p class="mb-1"><strong>Email:</strong> ${customer.email || 'N/A'}</p>
              </div>
              <div class="col-md-6">
                <p class="mb-1"><strong>Số điện thoại:</strong> ${customer.sdt || 'N/A'}</p>
                <p class="mb-1"><strong>Địa chỉ:</strong> ${customer.diaChi || 'N/A'}</p>
              </div>
            </div>

            <h6 class="mt-4 mb-3">Danh sách sản phẩm:</h6>
            <div class="table-responsive">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.sanPham.map(product => `
                    <tr>
                      <td>
                        <div class="d-flex align-items-center">
                          ${product.imageUrl ? `
                            <img src="${product.imageUrl}" alt="${product.tenSp}" 
                                 class="img-thumbnail me-2" style="width: 60px; height: 60px; object-fit: cover;"
                                 onerror="this.src='../images/product-1.png'">
                          ` : ''}
                          <div>
                            <strong>${product.tenSp}</strong>
                            ${product.productId ? `<br><small class="text-muted">ID: ${product.productId}</small>` : ''}
                          </div>
                        </div>
                      </td>
                      <td>${product.soLuong}</td>
                      <td>${formatPrice(product.gia)}</td>
                      <td><strong>${formatPrice(product.thanhTien)}</strong></td>
                      <td><span class="badge ${getStatusBadgeClass(product.trangThai)} text-white">${product.trangThai}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="text-end"><strong>Tổng cộng:</strong></td>
                    <td colspan="2"><strong class="text-primary h5">${formatPrice(data.tongGiaTri)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Thao tác</h5>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              ${data.trangThai === 'Chờ xác nhận' || data.trangThai === 'Thanh toán một phần' ? `
                <a href="payment.html?orderId=${data.orderId}" class="btn btn-primary">
                  <i class="fas fa-credit-card me-1"></i> Thanh toán
                </a>
              ` : ''}
              ${data.trangThai === 'Chờ xác nhận' ? `
                <button class="btn btn-outline-danger" onclick="cancelOrder(${data.orderId})">
                  <i class="fas fa-times me-1"></i> Hủy đơn hàng
                </button>
              ` : ''}
              <a href="orders.html" class="btn btn-outline-secondary">
                <i class="fas fa-arrow-left me-1"></i> Quay lại
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Load chi tiết đơn hàng
async function loadOrderDetail() {
  // Kiểm tra đăng nhập
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const orderId = getOrderIdFromUrl();
  if (!orderId) {
    orderDetailContainer.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Không tìm thấy ID đơn hàng!
      </div>
    `;
    return;
  }

  try {
    loadingSpinner.style.display = "block";
    orderDetailContainer.innerHTML = "";

    const response = await api.get(`/api/Order/LayChiTietDonHang/${orderId}`);

    if (response.data && response.data.success && response.data.data) {
      orderDetailContainer.innerHTML = renderOrderDetail(response.data.data);
    } else {
      orderDetailContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Không tìm thấy đơn hàng!
        </div>
      `;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      alert("Vui lòng đăng nhập để xem chi tiết đơn hàng!");
      window.location.href = "login.html";
    } else {
      orderDetailContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Lỗi khi tải chi tiết đơn hàng: ${error.response?.data?.message || error.message}
        </div>
      `;
    }
  } finally {
    loadingSpinner.style.display = "none";
  }
}

// Hủy đơn hàng
window.cancelOrder = async function(orderId) {
  if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
    return;
  }

  try {
    const response = await api.put(`/api/Order/HuyDonHang/${orderId}`);

    if (response.data && response.data.success) {
      alert("✅ Đã hủy đơn hàng thành công!");
      loadOrderDetail();
    } else {
      alert("❌ Lỗi: " + (response.data?.message || "Không thể hủy đơn hàng"));
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
  }
};

// Khởi tạo khi trang load
document.addEventListener("DOMContentLoaded", () => {
  loadOrderDetail();
});





