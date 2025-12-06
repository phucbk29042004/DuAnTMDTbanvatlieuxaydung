// js/orders.js
import api from "./api/axiosClient.js";

const API_BASE_URL = api.defaults.baseURL?.replace(/\/$/, "") || "";
const FALLBACK_IMAGE = "../images/product-1.png";

const ordersContainer = document.getElementById("orders-container");
const loadingSpinner = document.getElementById("loading-spinner");
const noOrders = document.getElementById("no-orders");
const orderModal = document.getElementById("order-detail-modal");
const orderModalBody = document.getElementById("order-modal-body");
const bodyElement = document.body;
let reviewModal = null;
let reviewModalContent = null;

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

function escapeHtmlAttribute(str = "") {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
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

function resolveImageUrl(path) {
  if (!path || path.trim() === "") return FALLBACK_IMAGE;
  
  // Loại bỏ backslash và leading slashes
  let cleanedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  
  // Nếu là URL đầy đủ (http/https), trả về trực tiếp
  if (/^https?:\/\//i.test(cleanedPath)) {
    return cleanedPath;
  }
  
  // Nếu là đường dẫn tương đối hoặc absolute path từ server
  // Kiểm tra xem có phải là Cloudinary URL không
  if (cleanedPath.includes("cloudinary.com") || cleanedPath.includes("res.cloudinary.com")) {
    // Đảm bảo có protocol
    if (!cleanedPath.startsWith("http")) {
      cleanedPath = "https://" + cleanedPath;
    }
    return cleanedPath;
  }
  
  // Nếu có API_BASE_URL và path không bắt đầu bằng http, thêm base URL
  if (API_BASE_URL && !cleanedPath.startsWith("http")) {
    // Loại bỏ trailing slash từ API_BASE_URL nếu có
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    // Đảm bảo path không bắt đầu bằng /
    const cleanPath = cleanedPath.startsWith("/") ? cleanedPath.substring(1) : cleanedPath;
    return `${baseUrl}/${cleanPath}`;
  }
  
  // Trả về path gốc nếu không có base URL
  return cleanedPath.startsWith("/") ? cleanedPath : `/${cleanedPath}`;
}

function getOrderProductImage(product) {
  if (!product) return FALLBACK_IMAGE;
  
  // Kiểm tra các trường hình ảnh có thể có
  if (product.imageUrl) return resolveImageUrl(product.imageUrl);
  if (product.anhSanPham) return resolveImageUrl(product.anhSanPham);
  
  // Xử lý mảng hinhAnh từ API
  if (Array.isArray(product.hinhAnh) && product.hinhAnh.length > 0) {
    const first = product.hinhAnh[0];
    
    // Nếu là string trực tiếp
    if (typeof first === "string") {
      return resolveImageUrl(first);
    }
    
    // Nếu là object, thử các trường có thể có
    if (first && typeof first === "object") {
      if (first.url) return resolveImageUrl(first.url);
      if (first.hinhAnh) return resolveImageUrl(first.hinhAnh);
      if (first.HinhAnh) return resolveImageUrl(first.HinhAnh);
    }
  }
  
  // Fallback nếu không tìm thấy hình ảnh
  return FALLBACK_IMAGE;
}

function renderStarIcons(score = 0) {
  const maxStars = 5;
  let html = "";
  for (let i = 1; i <= maxStars; i++) {
    html += `<i class="fa-star ${i <= score ? "fas" : "far"}"></i>`;
  }
  return html;
}

// Render đơn hàng
function renderOrder(order) {
  const statusBadgeClass = getStatusBadgeClass(order.trangThai);
  const products = Array.isArray(order.sanPham) ? order.sanPham : [];
  const productsList = products.map(p => p.tenSp).join(", ");

  return `
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-0">Đơn hàng #${order.orderId}</h5>
          <small class="text-muted">Ngày đặt: ${formatDate(order.ngayTao)}</small>
        </div>
        <span class="badge ${statusBadgeClass} text-white">${order.trangThai}</span>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-8">
            <p class="mb-2"><strong>Sản phẩm (${order.soLuongSanPham || products.length}):</strong> ${productsList}</p>
            ${products.length > 0 ? `
              <div class="mt-3">
                ${products.slice(0, 3).map(product => `
                  <div class="d-flex align-items-center mb-2">
                    <img src="${getOrderProductImage(product)}" alt="${product.tenSp}" 
                         class="img-thumbnail me-2" style="width: 50px; height: 50px; object-fit: cover;"
                         onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">
                    <div>
                      <small class="d-block">${product.tenSp}</small>
                      <small class="text-muted">Số lượng: ${product.soLuong} | Giá: ${formatPrice(product.gia)}</small>
                    </div>
                  </div>
                `).join('')}
                ${products.length > 3 ? `<small class="text-muted">... và ${products.length - 3} sản phẩm khác</small>` : ''}
              </div>
            ` : ''}
          </div>
          <div class="col-md-4 text-md-end">
            <p class="mb-2"><strong>Tổng tiền:</strong></p>
            <h4 class="text-primary mb-3">${formatPrice(order.tongGiaTri)}</h4>
            <div class="order-actions d-flex flex-column gap-2">
              <button class="btn btn-outline-primary btn-sm view-order-detail" data-order-id="${order.orderId}">
                <i class="fas fa-eye me-1"></i> Xem chi tiết
              </button>
              ${order.trangThai === 'Chờ xác nhận' ? `
                <button class="btn btn-outline-danger btn-sm" onclick="cancelOrder(${order.orderId})">
                  <i class="fas fa-times me-1"></i> Hủy đơn hàng
                </button>
              ` : ''}
              ${order.trangThai === 'Chờ xác nhận' || order.trangThai === 'Thanh toán một phần' ? `
                <a href="payment.html?orderId=${order.orderId}" class="btn btn-primary btn-sm">
                  <i class="fas fa-credit-card me-1"></i> Thanh toán
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getModalLoadingTemplate() {
  return `
    <div class="text-center text-muted py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mb-0">Đang tải chi tiết đơn hàng...</p>
    </div>
  `;
}

function getModalErrorTemplate(message) {
  return `
    <div class="alert alert-danger mb-0" role="alert">
      ${message}
    </div>
  `;
}

function canReviewOrder(order) {
  const paidStatuses = ['Đã thanh toán', 'Hoàn thành'];
  return paidStatuses.includes(order.trangThai);
}

function renderOrderDetailContent(order) {
  const customer = order.khachHang || {};
  const products = Array.isArray(order.sanPham) ? order.sanPham : [];
  const statusBadgeClass = getStatusBadgeClass(order.trangThai);
  const allowReview = canReviewOrder(order);

  return `
    <div>
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h4 class="mb-1" id="order-modal-title">Đơn hàng #${order.orderId}</h4>
          <p class="mb-0 text-muted">Ngày đặt: ${formatDate(order.ngayTao)}</p>
        </div>
        <span class="badge ${statusBadgeClass} text-white px-3 py-2">${order.trangThai}</span>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <div class="border rounded-3 p-3 h-100">
            <h6 class="text-uppercase text-muted small mb-3">Thông tin khách hàng</h6>
            <p class="mb-1"><strong>Họ tên:</strong> ${customer.hoTen || "N/A"}</p>
            <p class="mb-1"><strong>Email:</strong> ${customer.email || "N/A"}</p>
            <p class="mb-1"><strong>Số điện thoại:</strong> ${customer.sdt || "N/A"}</p>
            <p class="mb-0"><strong>Địa chỉ:</strong> ${customer.diaChi || "N/A"}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="border rounded-3 p-3 h-100">
            <h6 class="text-uppercase text-muted small mb-3">Thông tin đơn hàng</h6>
            <p class="mb-1"><strong>Tổng giá trị:</strong> <span class="text-primary h5 mb-0">${formatPrice(order.tongGiaTri)}</span></p>
            <p class="mb-1"><strong>Số lượng sản phẩm:</strong> ${order.soLuongSanPham || products.length}</p>
            <p class="mb-0"><strong>Thanh toán:</strong> ${order.phuongThucThanhToan || "Đang cập nhật"}</p>
          </div>
        </div>
      </div>

      <div class="table-responsive mb-4">
        <table class="table align-middle">
          <thead class="table-light">
            <tr>
              <th>Sản phẩm</th>
              <th class="text-center">Số lượng</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
                ${products.map(product => `
              <tr>
                <td>
                  <div class="d-flex align-items-center">
                    <img src="${getOrderProductImage(product)}" alt="${product.tenSp}"
                         class="rounded me-3" style="width: 60px; height: 60px; object-fit: cover;"
                         onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">
                    <div>
                      <div class="fw-semibold">${product.tenSp}</div>
                      ${product.productId ? `<small class="text-muted">ID: ${product.productId}</small>` : ""}
                      ${allowReview && product.productId ? `
                        <div class="mt-2">
                          <button class="btn btn-outline-primary btn-sm review-product-btn"
                                  data-product-id="${product.productId}"
                                  data-product-name="${escapeHtmlAttribute(product.tenSp || "")}">
                            <i class="fas fa-star me-1"></i> Đánh giá sản phẩm
                          </button>
                        </div>
                      ` : ""}
                    </div>
                  </div>
                </td>
                <td class="text-center">${product.soLuong}</td>
                <td>${formatPrice(product.gia)}</td>
                <td><strong>${formatPrice(product.thanhTien || (product.soLuong * product.gia))}</strong></td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="text-end"><strong>Tổng cộng:</strong></td>
              <td><strong class="text-primary h5 mb-0">${formatPrice(order.tongGiaTri)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="d-flex flex-wrap gap-2 justify-content-end">
        ${(order.trangThai === "Chờ xác nhận" || order.trangThai === "Thanh toán một phần") ? `
          <a href="payment.html?orderId=${order.orderId}" class="btn btn-primary">
            <i class="fas fa-credit-card me-1"></i> Thanh toán
          </a>
        ` : ""}
        ${order.trangThai === "Chờ xác nhận" ? `
          <button class="btn btn-outline-danger" data-cancel-order="${order.orderId}">
            <i class="fas fa-times me-1"></i> Hủy đơn hàng
          </button>
        ` : ""}
        <button class="btn btn-outline-secondary" data-close-modal>
          Đóng
        </button>
      </div>
    </div>
  `;
}

function bindModalActions(order) {
  if (!orderModal) return;
  const cancelBtn = orderModalBody?.querySelector("[data-cancel-order]");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => window.cancelOrder(order.orderId));
  }
  const inlineClose = orderModalBody?.querySelector("[data-close-modal]");
  if (inlineClose) {
    inlineClose.addEventListener("click", () => hideOrderModal());
  }

  const reviewButtons = orderModalBody?.querySelectorAll(".review-product-btn");
  reviewButtons?.forEach(btn => {
    btn.addEventListener("click", () => {
      const productId = btn.getAttribute("data-product-id");
      if (!productId) return;
      const productName = btn.getAttribute("data-product-name") || `Sản phẩm #${productId}`;
      hideOrderModal();
      openProductReviewModal(parseInt(productId, 10), productName);
    });
  });
}

function ensureReviewModal() {
  if (reviewModal) return;
  reviewModal = document.createElement("div");
  reviewModal.id = "product-review-modal";
  reviewModal.className = "order-review-modal";
  reviewModal.innerHTML = `
    <div class="review-modal-backdrop" data-review-close></div>
    <div class="review-modal-dialog">
      <button class="review-modal-close" data-review-close>&times;</button>
      <div id="review-modal-content" class="review-modal-content"></div>
    </div>
  `;
  document.body.appendChild(reviewModal);
  reviewModalContent = reviewModal.querySelector("#review-modal-content");
  reviewModal.querySelectorAll("[data-review-close]").forEach(el => el.addEventListener("click", closeReviewModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reviewModal?.classList.contains("show")) {
      closeReviewModal();
    }
  });
}

function closeReviewModal() {
  if (!reviewModal) return;
  reviewModal.classList.remove("show");
  if (!orderModal || !orderModal.classList.contains("show")) {
    bodyElement.classList.remove("modal-open");
  }
}

function getReviewModalLoadingTemplate(productName) {
  return `
    <div class="text-center text-muted py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mb-0">Đang tải đánh giá cho <strong>${productName}</strong>...</p>
    </div>
  `;
}

function getReviewModalErrorTemplate(message) {
  return `
    <div class="alert alert-danger mb-0" role="alert">
      ${message}
    </div>
  `;
}

async function openProductReviewModal(productId, productName) {
  ensureReviewModal();
  if (!reviewModal || !reviewModalContent) return;
  reviewModal.dataset.productId = String(productId);
  reviewModal.dataset.productName = productName;
  reviewModalContent.innerHTML = getReviewModalLoadingTemplate(productName);
  reviewModal.classList.add("show");
  bodyElement.classList.add("modal-open");

  try {
    const [reviewsRes, eligibilityRes] = await Promise.all([
      api.get(`/api/Product/Review/${productId}`),
      api.get(`/api/Product/Review/Eligibility/${productId}`)
    ]);

    const reviews = reviewsRes.data?.data || [];
    const eligibility = eligibilityRes.data?.data || {};
    renderReviewModalContent(productId, productName, reviews, eligibility);
  } catch (error) {
    if (error.response?.status === 401) {
      alert("Vui lòng đăng nhập để đánh giá sản phẩm!");
      window.location.href = "login.html";
      return;
    }
    reviewModalContent.innerHTML = getReviewModalErrorTemplate(error.response?.data?.message || error.message);
  }
}

function renderReviewModalContent(productId, productName, reviews, eligibility) {
  if (!reviewModalContent) return;
  const existingReview = eligibility?.review;
  const canReview = eligibility?.canReview || !!existingReview;
  const formSection = canReview
    ? buildReviewModalForm(existingReview)
    : `<div class="alert alert-info mb-0">${eligibility?.message || "Bạn cần hoàn tất mua hàng để đánh giá."}</div>`;

  const reviewsHtml = reviews.length
    ? reviews.map(review => `
        <div class="review-item compact">
          <div class="review-header">
            <div>
              <strong>${review.customerName || "Người dùng"}</strong>
              <div class="review-date text-muted small">${formatDate(review.createdAt)}</div>
            </div>
            <div class="review-stars">${renderStarIcons(review.score)}</div>
          </div>
          ${review.content ? `<p class="review-content mb-0">${review.content}</p>` : ""}
        </div>
      `).join("")
    : `<p class="text-muted mb-0">Chưa có đánh giá nào cho sản phẩm này.</p>`;

  reviewModalContent.innerHTML = `
    <div class="review-modal-header">
      <div>
        <p class="text-uppercase text-muted small mb-1">Đánh giá sản phẩm</p>
        <h4 class="mb-0">${productName}</h4>
      </div>
    </div>
    <div class="review-modal-body">
      <div class="review-form-panel">
        ${formSection}
      </div>
      <div class="review-list-panel">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">Đánh giá gần đây</h6>
          <span class="text-muted small">${reviews.length ? `${reviews.length} đánh giá` : ""}</span>
        </div>
        <div class="review-list-scroll">
          ${reviewsHtml}
        </div>
      </div>
    </div>
  `;

  if (canReview) {
    wireReviewModalForm(productId, existingReview);
  }
}

function buildReviewModalForm(existingReview) {
  return `
    <form id="review-modal-form">
      <div class="mb-3">
        <label class="form-label">Đánh giá</label>
        <div class="star-rating" role="radiogroup" aria-label="Đánh giá từ 1 đến 5 sao">
          ${[1, 2, 3, 4, 5].map(value => `
            <label class="star-option" data-value="${value}" aria-label="${value} sao">
              <input type="radio" name="modal-review-score" value="${value}" ${existingReview?.score === value ? "checked" : ""}>
              <i class="fa-star ${existingReview?.score && existingReview.score >= value ? "fas" : "far"}"></i>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="mb-3">
        <label for="modal-review-content" class="form-label">Nội dung đánh giá</label>
        <textarea id="modal-review-content" class="form-control" rows="4" maxlength="1000"
          placeholder="Chia sẻ trải nghiệm của bạn...">${existingReview?.content || ""}</textarea>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button type="submit" class="btn btn-primary btn-sm">
          ${existingReview ? '<i class="fas fa-save me-1"></i> Lưu đánh giá' : '<i class="fas fa-paper-plane me-1"></i> Gửi đánh giá'}
        </button>
        ${existingReview ? `<button type="button" id="modal-delete-review" class="btn btn-outline-danger btn-sm">
          <i class="fas fa-trash me-1"></i> Xóa đánh giá
        </button>` : ""}
      </div>
    </form>
  `;
}

function wireReviewModalForm(productId, existingReview) {
  const form = reviewModalContent?.querySelector("#review-modal-form");
  if (!form) return;
  const starOptions = form.querySelectorAll(".star-option");
  starOptions.forEach(option => {
    option.addEventListener("click", () => {
      starOptions.forEach(opt => opt.querySelector("i").className = "fa-star far");
      const value = parseInt(option.dataset.value, 10);
      option.querySelector("input").checked = true;
      starOptions.forEach(opt => {
        if (parseInt(opt.dataset.value, 10) <= value) {
          opt.querySelector("i").className = "fa-star fas";
        }
      });
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selected = form.querySelector('input[name="modal-review-score"]:checked');
    const score = selected ? parseInt(selected.value, 10) : 0;
    const content = form.querySelector("#modal-review-content").value.trim();
    if (!score) {
      alert("Vui lòng chọn số sao đánh giá.");
      return;
    }

    const payload = { score, content };
    try {
      if (existingReview?.id) {
        await api.put(`/api/Product/Review/${existingReview.id}`, payload);
        alert("Đã cập nhật đánh giá.");
      } else {
        await api.post(`/api/Product/Review/${productId}`, payload);
        alert("Đã gửi đánh giá.");
      }
      openProductReviewModal(productId, reviewModal?.dataset?.productName || "");
    } catch (error) {
      alert(error.response?.data?.message || "Không thể gửi đánh giá.");
    }
  });

  const deleteBtn = reviewModalContent?.querySelector("#modal-delete-review");
  if (deleteBtn && existingReview?.id) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
      try {
        await api.delete(`/api/Product/Review/${existingReview.id}`);
        alert("Đã xóa đánh giá.");
        openProductReviewModal(productId, reviewModal?.dataset?.productName || "");
      } catch (error) {
        alert(error.response?.data?.message || "Không thể xóa đánh giá.");
      }
    });
  }
}

function showOrderModal() {
  if (!orderModal) return;
  orderModal.classList.add("show");
  bodyElement.classList.add("modal-open");
}

function hideOrderModal() {
  if (!orderModal) return;
  orderModal.classList.remove("show");
  bodyElement.classList.remove("modal-open");
}

async function openOrderDetailModal(orderId) {
  if (!orderModal || !orderModalBody) return;
  showOrderModal();
  orderModalBody.innerHTML = getModalLoadingTemplate();
  try {
    const response = await api.get(`/api/Order/LayChiTietDonHang/${orderId}`);
    if (response.data && response.data.success && response.data.data) {
      orderModalBody.innerHTML = renderOrderDetailContent(response.data.data);
      bindModalActions(response.data.data);
    } else {
      orderModalBody.innerHTML = getModalErrorTemplate("Không tìm thấy đơn hàng.");
    }
  } catch (error) {
    if (error.response?.status === 401) {
      alert("Vui lòng đăng nhập để xem đơn hàng!");
      window.location.href = "login.html";
    } else {
      orderModalBody.innerHTML = getModalErrorTemplate(error.response?.data?.message || error.message);
    }
  }
}

function bindOrderCardEvents() {
  const detailButtons = document.querySelectorAll(".view-order-detail");
  detailButtons.forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const orderId = btn.getAttribute("data-order-id");
      if (orderId) {
        openOrderDetailModal(orderId);
      }
    });
  });
}

if (orderModal) {
  orderModal.querySelectorAll("[data-close-modal]").forEach(trigger => {
    trigger.addEventListener("click", () => hideOrderModal());
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && orderModal.classList.contains("show")) {
      hideOrderModal();
    }
  });
}

// Load danh sách đơn hàng
async function loadOrders() {
  // Kiểm tra đăng nhập
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    loadingSpinner.style.display = "block";
    ordersContainer.innerHTML = "";
    noOrders.style.display = "none";

    const response = await api.get("/api/Order/LayDanhSachDonHang");

    if (response.data && response.data.success && response.data.data) {
      const orders = response.data.data;

      if (orders.length === 0) {
        noOrders.style.display = "block";
      } else {
        ordersContainer.innerHTML = orders.map(order => renderOrder(order)).join("");
        bindOrderCardEvents();
      }
    } else {
      noOrders.style.display = "block";
    }
  } catch (error) {
    if (error.response?.status === 401) {
      alert("Vui lòng đăng nhập để xem đơn hàng!");
      window.location.href = "login.html";
    } else {
      ordersContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Lỗi khi tải danh sách đơn hàng: ${error.response?.data?.message || error.message}
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
      loadOrders();
      hideOrderModal();
    } else {
      alert("❌ Lỗi: " + (response.data?.message || "Không thể hủy đơn hàng"));
    }
  } catch (error) {
    alert("❌ Lỗi: " + (error.response?.data?.message || error.message));
  }
};

// Khởi tạo khi trang load
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
});


