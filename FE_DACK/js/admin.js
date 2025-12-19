// Admin Dashboard JavaScript
import axiosClient from './api/axiosClient.js';

// Check admin authentication
const user = JSON.parse(localStorage.getItem('user') || '{}');
if (!user.IsAdmin && !user.isAdmin) {
  alert('Bạn không có quyền truy cập trang này!');
  window.location.href = 'login.html';
}

document.getElementById('admin-name').textContent = user.HoTen || 'Admin';

// Check token
const token = localStorage.getItem('token');
if (!token) {
  alert('Bạn chưa đăng nhập!');
  window.location.href = 'login.html';
}

// Debug info
console.log('Admin user:', user);
console.log('Token exists:', !!token);
console.log('IsAdmin:', user.IsAdmin || user.isAdmin);

// Charts
let revenueChart, paymentMethodChart, monthlyRevenueChart, orderStatusChart;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initRevenueWidgets();
  loadHomePage();
  initModals();
  initForms();
});

// Navigation
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  navItems.forEach(item => {
    const link = item.querySelector('.nav-link');
    link?.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        switchPage(page);
      }
    });
  });

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });
}

function switchPage(page) {
  // Update active nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Hide all pages
  document.querySelectorAll('.page-content').forEach(p => {
    p.classList.remove('active');
  });

  // Show selected page
  const pageElement = document.getElementById(`page-${page}`);
  if (pageElement) {
    pageElement.classList.add('active');
  }

  // Update title
  const titles = {
    home: 'Trang chủ',
    users: 'Quản lý người dùng',
    products: 'Quản lý sản phẩm',
    categories: 'Quản lý danh mục',
    orders: 'Quản lý đơn hàng',
    forum: 'Quản lý bài viết',
    shippers: 'Quản lý shipper',
    promotions: 'Quản lý khuyến mãi'
  };
  document.getElementById('page-title').textContent = titles[page] || 'Trang chủ';

  // Load page data
  switch (page) {
    case 'home':
      loadHomePage();
      break;
    case 'users':
      loadUsers();
      break;
    case 'products':
      loadProducts();
      break;
    case 'categories':
      loadCategories();
      break;
    case 'orders':
      loadOrders();
      break;
    case 'forum':
      loadForumPostsAdmin();
      break;
    case 'shippers':
      loadShippers();
      break;
    case 'promotions':
      loadPromotions();
      break;
  }
}

function initRevenueWidgets() {
  const dayInput = document.getElementById('revenue-day-input');
  const monthSelect = document.getElementById('revenue-month-select');
  const monthYearInput = document.getElementById('revenue-month-year');
  const yearInput = document.getElementById('revenue-year-input');
  const rangeFrom = document.getElementById('revenue-range-from');
  const rangeTo = document.getElementById('revenue-range-to');

  if (!dayInput || !monthSelect || !monthYearInput || !yearInput || !rangeFrom || !rangeTo) {
    return;
  }

  const applyDefaults = () => {
    const today = new Date();
    const isoToday = today.toISOString().split('T')[0];
    dayInput.value = isoToday;

    const currentMonth = (today.getMonth() + 1).toString();
    monthSelect.value = currentMonth;
    monthYearInput.value = today.getFullYear();
    yearInput.value = today.getFullYear();

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    rangeFrom.value = firstDayOfMonth;
    rangeTo.value = isoToday;
  };

  applyDefaults();

  document.getElementById('revenue-day-btn')?.addEventListener('click', () => loadRevenueDay());
  document.getElementById('revenue-month-btn')?.addEventListener('click', () => loadRevenueMonth());
  document.getElementById('revenue-year-btn')?.addEventListener('click', () => loadRevenueYear());
  document.getElementById('revenue-range-btn')?.addEventListener('click', () => loadRevenueRange());

  document.getElementById('refresh-revenue-widgets')?.addEventListener('click', (e) => {
    e.preventDefault();
    applyDefaults();
    loadRevenueDay();
    loadRevenueMonth();
    loadRevenueYear();
    loadRevenueRange();
  });

  loadRevenueDay();
  loadRevenueMonth();
  loadRevenueYear();
  loadRevenueRange();
}

// Home Page - Statistics
async function loadHomePage() {
  try {
    const response = await axiosClient.get('/api/DoanhThu/ThongKeChung');
    if (response.data.success) {
      const data = response.data;
      
      // Update stats
      if (data.tongQuat) {
        document.getElementById('total-revenue').textContent = formatCurrency(data.tongQuat.tongDoanhThuTatCa || 0);
        document.getElementById('total-orders').textContent = data.tongQuat.tongSoDon || 0;
      }
      if (data.homNay) {
        document.getElementById('today-revenue').textContent = formatCurrency(data.homNay.tongDoanhThu || 0);
      }
      if (data.thangNay) {
        const monthRevenueEl = document.getElementById('month-revenue');
        const monthOrdersEl = document.getElementById('month-orders');
        if (monthRevenueEl) monthRevenueEl.textContent = formatCurrency(data.thangNay.tongDoanhThu || 0);
        if (monthOrdersEl) monthOrdersEl.textContent = `${data.thangNay.soDon || 0} đơn`;
      }
      if (data.namNay) {
        const yearRevenueEl = document.getElementById('year-revenue');
        const yearOrdersEl = document.getElementById('year-orders');
        if (yearRevenueEl) yearRevenueEl.textContent = formatCurrency(data.namNay.tongDoanhThu || 0);
        if (yearOrdersEl) yearOrdersEl.textContent = `${data.namNay.soDon || 0} đơn`;
      }

      // Revenue chart (7 days)
      if (data.bieudoTuanNay && Array.isArray(data.bieudoTuanNay)) {
        createRevenueChart(data.bieudoTuanNay);
      }

      // Payment method chart
      if (data.thongKePhuongThuc) {
        createPaymentMethodChart(data.thongKePhuongThuc);
      }

      // Monthly revenue chart
      if (data.namNay && data.namNay.nam) {
        createMonthlyRevenueChart(data.namNay.nam);
      }

      // Top customers
      if (data.topKhachHang) {
        displayTopCustomers(data.topKhachHang);
      }
    }

    loadOrderStatusStats();
  } catch (error) {
    console.error('Error loading home page:', error);
  }
}

function createRevenueChart(data) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  if (revenueChart) {
    revenueChart.destroy();
  }

  revenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.ngay || d.ngayDayDu || ''),
      datasets: [{
        label: 'Doanh thu (đ)',
        data: data.map(d => d.doanhThu || 0),
        backgroundColor: '#3b5d50',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function createPaymentMethodChart(data) {
  const ctx = document.getElementById('paymentMethodChart');
  if (!ctx) return;

  if (paymentMethodChart) {
    paymentMethodChart.destroy();
  }

  paymentMethodChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.phuongThuc || 'Không xác định'),
      datasets: [{
        data: data.map(d => d.tongTien || 0),
        backgroundColor: ['#3b5d50', '#f9bf29', '#16a34a', '#dc2626', '#6366f1']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

async function createMonthlyRevenueChart(year) {
  try {
    const response = await axiosClient.get(`/api/DoanhThu/TheoNam?nam=${year}`);
    if (response.data.success && response.data.chiTietTheoThang) {
      const ctx = document.getElementById('monthlyRevenueChart');
      if (!ctx) return;

      if (monthlyRevenueChart) {
        monthlyRevenueChart.destroy();
      }

      const data = response.data.chiTietTheoThang;
      monthlyRevenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.tenThang),
          datasets: [{
            label: 'Doanh thu (đ)',
            data: data.map(d => d.tongTien),
            borderColor: '#3b5d50',
            backgroundColor: 'rgba(59, 93, 80, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formatCurrency(value);
                }
              }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading monthly revenue:', error);
  }
}

function displayTopCustomers(customers) {
  const container = document.getElementById('top-customers-list');
  if (!container) return;

  container.innerHTML = customers.map(customer => `
    <div class="customer-item">
      <div class="customer-info">
        <h4>${customer.hoTen}</h4>
        <p>${customer.email}</p>
      </div>
      <div class="customer-amount">${formatCurrency(customer.tongChi)}</div>
    </div>
  `).join('');
}

// Users Management
async function loadUsers() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) {
    console.error('users-table-body not found');
    return;
  }
  
  try {
    console.log('Loading users...');
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    
    const response = await axiosClient.get('/api/Customer/DanhSachNguoiDung');
    console.log('Response:', response);
    console.log('Response data:', response.data);
    
    if (response.data && response.data.success) {
      const users = response.data.data || [];
      console.log('Users count:', users.length);
      
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có người dùng nào</td></tr>';
        return;
      }
      
      tbody.innerHTML = users.map(user => {
        const hoTen = (user.hoTen || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const email = (user.email || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const sdt = (user.sdt || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const diaChi = (user.diaChi || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        return `
        <tr>
          <td>${user.id}</td>
          <td>${user.hoTen || 'N/A'}</td>
          <td>${user.email}</td>
          <td>${user.sdt || 'N/A'}</td>
          <td>${user.diaChi || 'N/A'}</td>
          <td>${user.isAdmin ? '<span class="status-badge status-active">Admin</span>' : '<span class="status-badge status-inactive">User</span>'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-edit" onclick="editUser(${user.id}, '${hoTen}', '${email}', '${sdt}', '${diaChi}', ${user.isAdmin || false})">
                <i class="fas fa-edit"></i> Sửa
              </button>
              <button class="btn btn-sm btn-delete" onclick="deleteUser(${user.id})">
                <i class="fas fa-trash"></i> Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
      }).join('');
    } else {
      console.warn('Response success is false:', response.data);
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-warning">Không có dữ liệu hoặc response không hợp lệ</td></tr>';
    }
  } catch (error) {
    console.error('Error loading users:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    
    const tbody = document.getElementById('users-table-body');
    let errorMsg = 'Lỗi không xác định';
    
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        errorMsg = 'Bạn không có quyền truy cập. Vui lòng đăng nhập lại với tài khoản admin.';
      } else if (status === 401) {
        errorMsg = 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (status === 404) {
        errorMsg = 'API endpoint không tìm thấy. Vui lòng kiểm tra lại.';
      } else {
        errorMsg = error.response.data?.message || error.response.statusText || `HTTP ${status}`;
      }
    } else if (error.request) {
      errorMsg = 'Không nhận được phản hồi từ server. Kiểm tra kết nối mạng hoặc API server đã chạy chưa.';
    } else {
      errorMsg = error.message;
    }
    
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi: ${errorMsg} (Status: ${error.response?.status || 'N/A'})</td></tr>`;
  }
}

function editUser(id, hoTen, email, sdt, diaChi, isAdmin) {
  document.getElementById('user-id').value = id;
  document.getElementById('user-hoTen').value = hoTen;
  document.getElementById('user-email').value = email;
  document.getElementById('user-sdt').value = sdt || '';
  document.getElementById('user-diaChi').value = diaChi || '';
  document.getElementById('user-isAdmin').checked = isAdmin;
  document.getElementById('user-matKhau').required = false;
  document.getElementById('user-password-note').textContent = '(Để trống nếu không đổi)';
  document.getElementById('user-modal-title').textContent = 'Sửa người dùng';
  openModal('user-modal');
}

async function deleteUser(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
  
  try {
    const response = await axiosClient.delete(`/api/Customer/XoaNguoiDung/${id}`);
    if (response.data.success) {
      alert('Xóa người dùng thành công!');
      loadUsers();
    }
  } catch (error) {
    alert('Lỗi khi xóa người dùng: ' + (error.response?.data?.message || error.message));
  }
}

// Products Management
async function loadProducts() {
  try {
    const response = await axiosClient.get('/api/Product/DanhSachSanPham');
    if (response.data.success) {
      const products = response.data.data;
      const tbody = document.getElementById('products-table-body');
      
      tbody.innerHTML = products.map(product => {
        let imageHtml = '<span>No image</span>';
        if (product.hinhAnh && product.hinhAnh.length > 0) {
          const imgUrl = product.hinhAnh[0].HinhAnh || product.hinhAnh[0].hinhAnh || '';
          if (imgUrl) {
            imageHtml = `<img src="${imgUrl}" alt="${product.tenSp}">`;
          }
        }
        
        return `
          <tr>
            <td>${product.id}</td>
            <td>${imageHtml}</td>
            <td>${product.tenSp}</td>
            <td>${formatCurrency(product.gia)}</td>
            <td>${product.soLuongConLaiTrongKho}</td>
            <td>${product.categoryId || 'N/A'}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-sm btn-edit" onclick="editProduct(${product.id})">
                  <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="btn btn-sm btn-delete" onclick="deleteProduct(${product.id})">
                  <i class="fas fa-trash"></i> Xóa
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

async function editProduct(id) {
  try {
    const response = await axiosClient.get(`/api/Product/ChiTietSanPham/${id}`);
    if (response.data.success) {
      const product = response.data.data;
      document.getElementById('product-id').value = product.id;
      document.getElementById('product-tenSp').value = product.tenSp;
      document.getElementById('product-moTa').value = product.moTa || '';
      document.getElementById('product-gia').value = product.gia;
      document.getElementById('product-soLuong').value = product.soLuongConLaiTrongKho;
      document.getElementById('product-categoryId').value = product.categoryId || '';
      document.getElementById('product-modal-title').textContent = 'Sửa sản phẩm';
      openModal('product-modal');
    }
  } catch (error) {
    alert('Lỗi khi tải thông tin sản phẩm: ' + error.message);
  }
}

async function deleteProduct(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?\n\nLưu ý: Không thể xóa sản phẩm đã có trong đơn hàng.')) return;
  
  try {
    const response = await axiosClient.delete(`/api/Product/XoaSanPham/${id}`);
    if (response.data.success) {
      alert('Xóa sản phẩm thành công!');
      loadProducts();
    } else {
      alert('Lỗi: ' + (response.data.message || 'Không thể xóa sản phẩm'));
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Có lỗi xảy ra khi xóa sản phẩm';
    alert('Lỗi khi xóa sản phẩm: ' + errorMessage);
  }
}

// Categories Management
async function loadCategories() {
  try {
    const response = await axiosClient.get('/api/Product/DanhSachDanhMuc');
    if (response.data.success) {
      const categories = response.data.data;
      const tbody = document.getElementById('categories-table-body');
      
      tbody.innerHTML = categories.map(category => `
        <tr>
          <td>${category.id}</td>
          <td>${category.tenDanhMuc}</td>
          <td>${category.moTa || 'N/A'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-edit" onclick="editCategory(${category.id}, '${category.tenDanhMuc}', '${category.moTa || ''}')">
                <i class="fas fa-edit"></i> Sửa
              </button>
              <button class="btn btn-sm btn-delete" onclick="deleteCategory(${category.id})">
                <i class="fas fa-trash"></i> Xóa
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

function editCategory(id, tenDanhMuc, moTa) {
  document.getElementById('category-id').value = id;
  document.getElementById('category-tenDanhMuc').value = tenDanhMuc;
  document.getElementById('category-moTa').value = moTa;
  document.getElementById('category-modal-title').textContent = 'Sửa danh mục';
  openModal('category-modal');
}

async function deleteCategory(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
  
  try {
    const response = await axiosClient.delete(`/api/Product/XoaDanhMuc/${id}`);
    if (response.data.success) {
      alert(response.data.message);
      loadCategories();
      loadCategoriesForSelect(); // Refresh category dropdown in product form
    }
  } catch (error) {
    alert('Lỗi: ' + (error.response?.data?.message || error.message));
  }
}

// Orders Management
async function loadOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) {
    console.error('orders-table-body not found');
    return;
  }
  
  try {
    console.log('Loading orders & shippers...');
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);

    const [ordersRes, shippersRes] = await Promise.all([
      axiosClient.get('/api/Order/DanhSachDonHangAdmin'),
      axiosClient.get('/api/Shipper')
    ]);

    const ordersData = ordersRes.data;
    const shippersData = shippersRes.data;

    if (ordersData && ordersData.success) {
      const orders = ordersData.data || [];
      const shippers = (shippersData && shippersData.success && Array.isArray(shippersData.data))
        ? shippersData.data
        : [];

      console.log('Orders count:', orders.length);
      console.log('Active shippers count:', shippers.length);

      if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Chưa có đơn hàng nào</td></tr>';
        return;
      }

      const paidStatuses = ['Đã thanh toán', 'Hoàn thành', 'Đang giao hàng'];

      tbody.innerHTML = orders.map(order => {
        const statusClass = order.trangThai === 'Hoàn thành' ? 'status-active' :
                           order.trangThai === 'Đã hủy' ? 'status-inactive' :
                           order.trangThai === 'Đang giao hàng' ? 'status-pending' : 'status-pending';
        
        const hoTen = order.khachHang ? (order.khachHang.hoTen || 'N/A') : 'N/A';
        const email = order.khachHang ? (order.khachHang.email || '') : '';

        const canAssignShipper = paidStatuses.includes(order.trangThai || '');
        const currentShipperName = order.tenShipper || null;

        let shipperCellHtml = '<span class="text-muted">Chưa gán</span>';

        if (canAssignShipper && shippers.length > 0) {
          const optionsHtml = [
            `<option value="">-- Chọn shipper --</option>`,
            ...shippers.map(s => `
              <option value="${s.shipperId}" ${currentShipperName && currentShipperName === s.tenShipper ? 'selected' : ''}>
                ${s.tenShipper} (${s.dienThoai || 'N/A'})
              </option>
            `)
          ].join('');

          shipperCellHtml = `
            <select class="form-select form-select-sm" onchange="assignShipper(${order.id}, this.value)">
              ${optionsHtml}
            </select>
          `;
        } else if (currentShipperName) {
          shipperCellHtml = `<span class="badge status-active">${currentShipperName}</span>`;
        }

        return `
        <tr>
          <td>${order.id}</td>
          <td>${order.khachHang ? `${hoTen}<br><small>${email}</small>` : 'N/A'}</td>
          <td>${formatDate(order.ngayTao)}</td>
          <td>${order.soLuongSanPham || 0}</td>
          <td>${formatCurrency(order.tongGiaTri || 0)}</td>
          <td><span class="status-badge ${statusClass}">${order.trangThai || 'N/A'}</span></td>
          <td>${shipperCellHtml}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-edit" onclick="viewOrderDetail(${order.id})">
                <i class="fas fa-eye"></i> Chi tiết
              </button>
            </div>
          </td>
        </tr>
      `;
      }).join('');
    } else {
      console.warn('Response success is false:', ordersData);
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-warning">Không có dữ liệu hoặc response không hợp lệ</td></tr>';
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    
    const tbody = document.getElementById('orders-table-body');
    let errorMsg = 'Lỗi không xác định';
    
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        errorMsg = 'Bạn không có quyền truy cập. Vui lòng đăng nhập lại với tài khoản admin.';
      } else if (status === 401) {
        errorMsg = 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (status === 404) {
        errorMsg = 'API endpoint không tìm thấy. Vui lòng kiểm tra lại.';
      } else {
        errorMsg = error.response.data?.message || error.response.statusText || `HTTP ${status}`;
      }
    } else if (error.request) {
      errorMsg = 'Không nhận được phản hồi từ server. Kiểm tra kết nối mạng hoặc API server đã chạy chưa.';
    } else {
      errorMsg = error.message;
    }
    
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi: ${errorMsg} (Status: ${error.response?.status || 'N/A'})</td></tr>`;
  }
}

async function viewOrderDetail(orderId) {
  try {
    // Lấy danh sách đơn hàng và tìm đơn hàng theo ID
    const response = await axiosClient.get('/api/Order/DanhSachDonHangAdmin');
    if (response.data && response.data.success) {
      const orders = response.data.data || [];
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        alert('Không tìm thấy đơn hàng');
        return;
      }
      const detailHtml = `
        <div style="padding: 20px;">
          <h3>Chi tiết đơn hàng #${order.id}</h3>
          <p><strong>Ngày tạo:</strong> ${formatDate(order.ngayTao)}</p>
          <p><strong>Tổng giá trị:</strong> ${formatCurrency(order.tongGiaTri || 0)}</p>
          <p><strong>Trạng thái:</strong> ${order.trangThai || 'N/A'}</p>
          <p><strong>Shipper:</strong> ${order.tenShipper || 'Chưa gán'}</p>
          <h4>Khách hàng:</h4>
          <p>${order.khachHang ? (order.khachHang.hoTen || 'N/A') : 'N/A'}<br>
          Email: ${order.khachHang ? (order.khachHang.email || 'N/A') : 'N/A'}<br>
          SĐT: ${order.khachHang ? (order.khachHang.sdt || 'N/A') : 'N/A'}<br>
          Địa chỉ: ${order.khachHang ? (order.khachHang.diaChi || 'N/A') : 'N/A'}</p>
          <h4>Sản phẩm:</h4>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${order.chiTietSanPham ? order.chiTietSanPham.map(sp => {
                let imageHtml = '<span class="text-muted">No image</span>';
                if (sp.hinhAnh && sp.hinhAnh.length > 0) {
                  const imgUrl = sp.hinhAnh[0].url || sp.hinhAnh[0].HinhAnh || '';
                  if (imgUrl) {
                    imageHtml = `<img src="${imgUrl}" alt="${sp.tenSp || 'Product'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">`;
                  }
                }
                return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      ${imageHtml}
                      <span>${sp.tenSp || 'N/A'}</span>
                    </div>
                  </td>
                  <td>${sp.soLuong || 0}</td>
                  <td>${formatCurrency(sp.gia || 0)}</td>
                  <td>${formatCurrency(sp.thanhTien || 0)}</td>
                </tr>
              `;
              }).join('') : '<tr><td colspan="4" class="text-center">Không có sản phẩm</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
      
      // Tạo modal để hiển thị
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'order-detail-modal';
      modal.style.display = 'block';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
          <span class="close" onclick="closeModal('order-detail-modal')">&times;</span>
          ${detailHtml}
          <div style="margin-top: 20px; text-align: center;">
            ${order.trangThai === 'Đã thanh toán' || order.trangThai === 'Hoàn thành' ? `
              <button class="btn btn-primary" onclick="printInvoice(${order.id})">
                <i class="fas fa-file-pdf"></i> In Hóa đơn
              </button>
            ` : ''}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  } catch (error) {
    alert('Lỗi khi lấy chi tiết đơn hàng: ' + (error.response?.data?.message || error.message));
  }
}

// Promotions Management
async function loadPromotions() {
  try {
    const response = await axiosClient.get('/api/Promotion/DanhSachKhuyenMai');
    if (response.data.success) {
      const promotions = response.data.data;
      const tbody = document.getElementById('promotions-table-body');
      
      tbody.innerHTML = promotions.map(promo => {
        const statusClass = promo.trangThai === 'Đang áp dụng' ? 'status-active' :
                           promo.trangThai === 'Sắp diễn ra' ? 'status-pending' : 'status-inactive';
        
        return `
          <tr>
            <td>${promo.id}</td>
            <td>${promo.tenKhuyenMai}</td>
            <td>${promo.moTa || 'N/A'}</td>
            <td>${promo.phanTramGiam}%</td>
            <td>${formatDate(promo.ngayBatDau)}</td>
            <td>${formatDate(promo.ngayKetThuc)}</td>
            <td><span class="status-badge ${statusClass}">${promo.trangThai}</span></td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-sm btn-edit" onclick="editPromotion(${promo.id})">
                  <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="btn btn-sm btn-delete" onclick="deletePromotion(${promo.id})">
                  <i class="fas fa-trash"></i> Xóa
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Error loading promotions:', error);
  }
}

// Forum Posts Management (Admin)
async function loadForumPostsAdmin() {
  const tbody = document.getElementById('forum-posts-admin-body');
  if (!tbody) {
    console.error('forum-posts-admin-body not found');
    return;
  }

  try {
    const response = await axiosClient.get('/api/Forum/admin/posts');
    if (response.data && response.data.success) {
      const posts = response.data.data || [];

      if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có bài viết nào</td></tr>';
        return;
      }

      tbody.innerHTML = posts.map(post => {
        const author = post.tacGia
          ? `${post.tacGia.hoTen || 'N/A'}<br><small>${post.tacGia.email || ''}</small>`
          : 'N/A';

        return `
          <tr>
            <td>${post.id}</td>
            <td>${post.tieuDe}</td>
            <td>${author}</td>
            <td>${formatDate(post.ngayTao)}</td>
            <td>${post.luotXem || 0}</td>
            <td>${post.soBinhLuan || 0}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-sm btn-edit" onclick="openForumEditModal(${post.id})">
                  <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="btn btn-sm btn-delete" onclick="adminDeleteForumPost(${post.id})">
                  <i class="fas fa-trash"></i> Xóa
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-warning">Không có dữ liệu bài viết</td></tr>';
    }
  } catch (error) {
    console.error('Error loading forum posts (admin):', error);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi: ${error.response?.data?.message || error.message}</td></tr>`;
  }
}

async function openForumEditModal(id) {
  const modal = document.getElementById('forum-edit-modal');
  if (!modal) return;

  // Reset form
  document.getElementById('forum-edit-form').reset();
  document.getElementById('forum-edit-id').value = id;

  // Load detail (dùng API GET posts/{id})
  try {
    const response = await axiosClient.get(`/api/Forum/posts/${id}`);
    if (response.data && response.data.success && response.data.data) {
      const post = response.data.data;
      document.getElementById('forum-edit-title').value = post.tieuDe || '';
      document.getElementById('forum-edit-content').value = post.noiDung || '';
    } else {
      alert('Không lấy được dữ liệu bài viết để sửa');
      return;
    }
  } catch (error) {
    alert('Lỗi khi tải chi tiết bài viết: ' + (error.response?.data?.message || error.message));
    return;
  }

  modal.style.display = 'block';
}

function closeForumEditModal() {
  const modal = document.getElementById('forum-edit-modal');
  if (modal) modal.style.display = 'none';
}

// Submit edit
document.getElementById('forum-edit-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('forum-edit-id').value;
  const title = document.getElementById('forum-edit-title').value.trim();
  const content = document.getElementById('forum-edit-content').value.trim();

  if (!id || !title || !content) {
    alert('Vui lòng nhập đủ tiêu đề và nội dung');
    return;
  }

  try {
    const response = await axiosClient.put(`/api/Forum/admin/posts/${id}`, {
      TieuDe: title,
      NoiDung: content
    });
    if (response.data && response.data.success) {
      alert(response.data.message || 'Cập nhật bài viết thành công');
      closeForumEditModal();
      loadForumPostsAdmin();
    } else {
      alert('Lỗi: ' + (response.data?.message || 'Không thể cập nhật bài viết'));
    }
  } catch (error) {
    alert('Lỗi khi cập nhật bài viết: ' + (error.response?.data?.message || error.message));
  }
});

async function adminDeleteForumPost(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
  try {
    const response = await axiosClient.delete(`/api/Forum/admin/posts/${id}`);
    if (response.data && response.data.success) {
      alert(response.data.message || 'Đã xóa bài viết');
      loadForumPostsAdmin();
    } else {
      alert('Lỗi: ' + (response.data?.message || 'Không thể xóa bài viết'));
    }
  } catch (error) {
    alert('Lỗi khi xóa bài viết: ' + (error.response?.data?.message || error.message));
  }
}

// Shippers Management
async function loadShippers() {
  const tbody = document.getElementById('shippers-table-body');
  if (!tbody) {
    console.error('shippers-table-body not found');
    return;
  }

  try {
    const response = await axiosClient.get('/api/Shipper');
    if (response.data && response.data.success) {
      const shippers = response.data.data || [];

      if (shippers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có shipper nào</td></tr>';
        return;
      }

      tbody.innerHTML = shippers.map(s => {
        const statusBadge = s.trangThai
          ? '<span class="status-badge status-active">Đang hoạt động</span>'
          : '<span class="status-badge status-inactive">Ngưng hoạt động</span>';

        return `
          <tr>
            <td>${s.shipperId}</td>
            <td>${s.tenShipper}</td>
            <td>${s.dienThoai}</td>
            <td>${s.email || 'N/A'}</td>
            <td>${statusBadge}</td>
            <td>${s.soDonHang || 0}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-sm btn-edit" onclick="editShipper(${s.shipperId})">
                  <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="btn btn-sm btn-secondary" onclick="toggleShipperStatus(${s.shipperId})">
                  <i class="fas fa-toggle-on"></i> Đổi trạng thái
                </button>
                <button class="btn btn-sm btn-delete" onclick="deleteShipper(${s.shipperId})">
                  <i class="fas fa-trash"></i> Xóa
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-warning">Không có dữ liệu shipper</td></tr>';
    }
  } catch (error) {
    console.error('Error loading shippers:', error);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi: ${error.response?.data?.message || error.message}</td></tr>`;
  }
}

async function editShipper(id) {
  try {
    const response = await axiosClient.get(`/api/Shipper/${id}`);
    if (response.data && response.data.success && response.data.data) {
      const s = response.data.data;
      document.getElementById('shipper-id').value = s.shipperId;
      document.getElementById('shipper-tenShipper').value = s.tenShipper || '';
      document.getElementById('shipper-dienThoai').value = s.dienThoai || '';
      document.getElementById('shipper-email').value = s.email || '';
      document.getElementById('shipper-trangThai').checked = s.trangThai !== false;
      document.getElementById('shipper-modal-title').textContent = 'Sửa shipper';
      openModal('shipper-modal');
    }
  } catch (error) {
    alert('Lỗi khi tải thông tin shipper: ' + (error.response?.data?.message || error.message));
  }
}

async function deleteShipper(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa shipper này?')) return;

  try {
    const response = await axiosClient.delete(`/api/Shipper/${id}`);
    if (response.data && response.data.success) {
      alert(response.data.message || 'Xóa shipper thành công');
      loadShippers();
    } else {
      alert('Lỗi: ' + (response.data?.message || 'Không thể xóa shipper'));
    }
  } catch (error) {
    alert('Lỗi khi xóa shipper: ' + (error.response?.data?.message || error.message));
  }
}

async function toggleShipperStatus(id) {
  try {
    const response = await axiosClient.patch(`/api/Shipper/${id}/toggle-status`);
    if (response.data && response.data.success) {
      alert(response.data.message || 'Cập nhật trạng thái shipper thành công');
      loadShippers();
    } else {
      alert('Lỗi: ' + (response.data?.message || 'Không thể cập nhật trạng thái shipper'));
    }
  } catch (error) {
    alert('Lỗi khi cập nhật trạng thái shipper: ' + (error.response?.data?.message || error.message));
  }
}

async function editPromotion(id) {
  try {
    const response = await axiosClient.get(`/api/Promotion/ChiTietKhuyenMai/${id}`);
    if (response.data.success) {
      const promo = response.data.data;
      document.getElementById('promotion-id').value = promo.id;
      document.getElementById('promotion-tenKhuyenMai').value = promo.tenKhuyenMai;
      document.getElementById('promotion-moTa').value = promo.moTa || '';
      document.getElementById('promotion-phanTramGiam').value = promo.phanTramGiam;
      document.getElementById('promotion-ngayBatDau').value = formatDateForInput(promo.ngayBatDau);
      document.getElementById('promotion-ngayKetThuc').value = formatDateForInput(promo.ngayKetThuc);
      document.getElementById('promotion-modal-title').textContent = 'Sửa khuyến mãi';
      openModal('promotion-modal');
    }
  } catch (error) {
    alert('Lỗi khi tải thông tin khuyến mãi: ' + error.message);
  }
}

async function deletePromotion(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;
  
  try {
    const response = await axiosClient.delete(`/api/Promotion/XoaKhuyenMai/${id}`);
    if (response.data.success) {
      alert('Xóa khuyến mãi thành công!');
      loadPromotions();
    }
  } catch (error) {
    alert('Lỗi khi xóa khuyến mãi: ' + (error.response?.data?.message || error.message));
  }
}

// Modals
function initModals() {
  // Close buttons
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.modal').style.display = 'none';
    });
  });

  // Close on outside click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });

  // Add buttons
  document.getElementById('add-product-btn')?.addEventListener('click', () => {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-modal-title').textContent = 'Thêm sản phẩm';
    document.getElementById('product-images-preview').innerHTML = '';
    openModal('product-modal');
  });

  document.getElementById('add-category-btn')?.addEventListener('click', () => {
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
    document.getElementById('category-modal-title').textContent = 'Thêm danh mục';
    openModal('category-modal');
  });

  document.getElementById('add-promotion-btn')?.addEventListener('click', () => {
    document.getElementById('promotion-form').reset();
    document.getElementById('promotion-id').value = '';
    document.getElementById('promotion-modal-title').textContent = 'Thêm khuyến mãi';
    openModal('promotion-modal');
  });

  document.getElementById('add-user-btn')?.addEventListener('click', () => {
    document.getElementById('user-form').reset();
    document.getElementById('user-id').value = '';
    document.getElementById('user-matKhau').required = true;
    document.getElementById('user-password-note').textContent = '*';
    document.getElementById('user-modal-title').textContent = 'Thêm người dùng';
    openModal('user-modal');
  });

  document.getElementById('add-shipper-btn')?.addEventListener('click', () => {
    document.getElementById('shipper-form').reset();
    document.getElementById('shipper-id').value = '';
    document.getElementById('shipper-trangThai').checked = true;
    document.getElementById('shipper-modal-title').textContent = 'Thêm shipper';
    openModal('shipper-modal');
  });
}

function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Forms
function initForms() {
  // Product form
  document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const id = document.getElementById('product-id').value;
    
    formData.append('TenSp', document.getElementById('product-tenSp').value);
    formData.append('MoTa', document.getElementById('product-moTa').value);
    formData.append('Gia', document.getElementById('product-gia').value);
    formData.append('SoLuongConLaiTrongKho', document.getElementById('product-soLuong').value);
    formData.append('CategoryId', document.getElementById('product-categoryId').value);
    
    const files = document.getElementById('product-images').files;
    for (let i = 0; i < files.length; i++) {
      formData.append('HinhAnh', files[i]);
    }

    try {
      let response;
      if (id) {
        // Sửa sản phẩm
        formData.append('Id', parseInt(id));
        response = await axiosClient.put('/api/Product/SuaSanPham', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Thêm sản phẩm
        response = await axiosClient.post('/api/Product/ThemSanPham', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      if (response.data.success) {
        alert(response.data.message);
        closeModal('product-modal');
        loadProducts();
      } else {
        alert('Lỗi: ' + (response.data.message || 'Không thể cập nhật sản phẩm'));
      }
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Có lỗi xảy ra khi lưu sản phẩm';
      alert('Lỗi: ' + errorMessage);
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    }
  });

  // User form
  document.getElementById('user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('user-id').value;
    const data = {
      HoTen: document.getElementById('user-hoTen').value,
      Email: document.getElementById('user-email').value,
      Sdt: document.getElementById('user-sdt').value,
      DiaChi: document.getElementById('user-diaChi').value,
      IsAdmin: document.getElementById('user-isAdmin').checked
    };

    const matKhau = document.getElementById('user-matKhau').value;
    if (matKhau) {
      data.MatKhau = matKhau;
    }

    try {
      let response;
      if (id) {
        response = await axiosClient.put(`/api/Customer/CapNhatNguoiDung/${id}`, data);
      } else {
        response = await axiosClient.post('/api/Customer/ThemNguoiDung', data);
      }
      
      if (response.data.success) {
        alert(response.data.message);
        closeModal('user-modal');
        loadUsers();
      }
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  });

  // Category form
  document.getElementById('category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('category-id').value;
    const data = {
      TenDanhMuc: document.getElementById('category-tenDanhMuc').value,
      MoTaDanhMuc: document.getElementById('category-moTa').value || null
    };

    if (!data.TenDanhMuc || data.TenDanhMuc.trim() === '') {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      let response;
      if (id) {
        // Sửa danh mục
        response = await axiosClient.put(`/api/Product/SuaDanhMuc/${id}`, data);
      } else {
        // Thêm danh mục
        response = await axiosClient.post('/api/Product/ThemDanhMuc', data);
      }
      
      if (response.data.success) {
        alert(response.data.message);
        closeModal('category-modal');
        loadCategories();
        loadCategoriesForSelect(); // Refresh category dropdown in product form
      }
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  });

  // Promotion form
  document.getElementById('promotion-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('promotion-id').value;
    const data = {
      TenKhuyenMai: document.getElementById('promotion-tenKhuyenMai').value,
      MoTa: document.getElementById('promotion-moTa').value,
      PhanTramGiam: parseFloat(document.getElementById('promotion-phanTramGiam').value),
      NgayBatDau: document.getElementById('promotion-ngayBatDau').value,
      NgayKetThuc: document.getElementById('promotion-ngayKetThuc').value
    };

    try {
      let response;
      if (id) {
        response = await axiosClient.put(`/api/Promotion/CapNhatKhuyenMai/${id}`, data);
      } else {
        response = await axiosClient.post('/api/Promotion/TaoKhuyenMai', data);
      }
      
      if (response.data.success) {
        alert(response.data.message);
        closeModal('promotion-modal');
        loadPromotions();
      }
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  });

  // Load categories for product form
  loadCategoriesForSelect();

  // Shipper form
  document.getElementById('shipper-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('shipper-id').value;
    const data = {
      TenShipper: document.getElementById('shipper-tenShipper').value,
      DienThoai: document.getElementById('shipper-dienThoai').value,
      Email: document.getElementById('shipper-email').value || null,
      TrangThai: document.getElementById('shipper-trangThai').checked
    };

    if (!data.TenShipper || data.TenShipper.trim() === '') {
      alert('Vui lòng nhập tên shipper');
      return;
    }
    if (!data.DienThoai || data.DienThoai.trim() === '') {
      alert('Vui lòng nhập số điện thoại shipper');
      return;
    }

    try {
      let response;
      if (id) {
        response = await axiosClient.put(`/api/Shipper/${id}`, data);
      } else {
        response = await axiosClient.post('/api/Shipper', data);
      }

      if (response.data && response.data.success) {
        alert(response.data.message || 'Lưu shipper thành công');
        closeModal('shipper-modal');
        loadShippers();
      } else {
        alert('Lỗi: ' + (response.data?.message || 'Không thể lưu shipper'));
      }
    } catch (error) {
      alert('Lỗi khi lưu shipper: ' + (error.response?.data?.message || error.message));
    }
  });
}

async function loadCategoriesForSelect() {
  try {
    const response = await axiosClient.get('/api/Product/DanhSachDanhMuc');
    if (response.data.success) {
      const select = document.getElementById('product-categoryId');
      if (select) {
        select.innerHTML = '<option value="">Chọn danh mục</option>' +
          response.data.data.map(cat => 
            `<option value="${cat.id}">${cat.tenDanhMuc}</option>`
          ).join('');
      }
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
}

function formatDateForInput(dateString) {
  if (!dateString) return '';
  // Handle DateOnly format (YYYY-MM-DD)
  if (typeof dateString === 'string' && dateString.includes('T')) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
  // If already in YYYY-MM-DD format
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // Try to parse as date
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
}

function normalizeRevenuePayment(item) {
  if (!item) return {
    paymentId: '--',
    orderId: '--',
    amount: 0,
    method: 'N/A',
    paidAt: null,
    customerName: 'Không rõ'
  };

  const order = item.order || item.Order || null;
  const customer = order?.khachHang || order?.KhachHang || null;

  return {
    paymentId: item.paymentId ?? item.PaymentId ?? item.id ?? item.Id ?? '--',
    orderId: item.orderId ?? item.OrderId ?? order?.orderId ?? order?.Id ?? '--',
    amount: item.soTien ?? item.SoTien ?? item.soTienThanhToan ?? item.SoTienThanhToan ?? 0,
    method: item.phuongThuc ?? item.PhuongThuc ?? item.phuongThucThanhToan ?? item.PhuongThucThanhToan ?? 'N/A',
    paidAt: item.ngayThanhToan ?? item.NgayThanhToan ?? null,
    customerName: customer?.hoTen ?? customer?.HoTen ?? 'Không rõ'
  };
}

async function loadRevenueDay() {
  const dateInput = document.getElementById('revenue-day-input');
  if (!dateInput.value) {
    alert('Vui lòng chọn ngày');
    return;
  }
  
  const date = new Date(dateInput.value);
  const ngay = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  
  try {
    const response = await axiosClient.get(`/api/DoanhThu/TheoNgay?ngay=${ngay}`);
    if (response.data.success) {
      const resultDiv = document.getElementById('revenue-day-result');
      const details = (response.data.chiTiet || []).map(normalizeRevenuePayment);
      const detailRows = details.length
        ? details.map(item => `
            <tr>
              <td>${item.paymentId}</td>
              <td>${item.orderId}</td>
              <td>${formatCurrency(item.amount)}</td>
              <td>${item.method}</td>
              <td>${item.customerName}</td>
              <td>${formatDate(item.paidAt)}</td>
            </tr>
          `).join('')
        : `<tr><td colspan="6" class="text-center text-muted">Không có giao dịch trong ngày này.</td></tr>`;

      resultDiv.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon" style="background: #3b5d50;">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-info">
            <h3>${formatCurrency(response.data.tongDoanhThu)}</h3>
            <p>Tổng doanh thu ngày ${response.data.ngay}</p>
            <p>Số đơn: ${response.data.soDon}</p>
          </div>
        </div>
        <div class="table-container mt-4">
          <h4>Chi tiết đơn hàng</h4>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Mã đơn hàng</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Khách hàng</th>
                <th>Ngày thanh toán</th>
              </tr>
            </thead>
            <tbody>
              ${detailRows}
            </tbody>
          </table>
        </div>
      `;
    }
  } catch (error) {
    alert('Lỗi: ' + (error.response?.data?.message || error.message));
  }
}

async function loadRevenueMonth() {
  const thang = document.getElementById('revenue-month-select').value;
  const nam = document.getElementById('revenue-month-year').value;
  
  if (!thang || !nam) {
    alert('Vui lòng chọn tháng và năm');
    return;
  }
  
  try {
    const response = await axiosClient.get(`/api/DoanhThu/TheoThang?thang=${thang}&nam=${nam}`);
    if (response.data.success) {
      const resultDiv = document.getElementById('revenue-month-result');
      resultDiv.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon" style="background: #f9bf29;">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div class="stat-info">
            <h3>${formatCurrency(response.data.tongDoanhThu)}</h3>
            <p>Tổng doanh thu tháng ${response.data.thang}/${response.data.nam}</p>
            <p>Số đơn: ${response.data.soDon}</p>
          </div>
        </div>
        <div class="chart-card mt-4">
          <h4>Chi tiết theo ngày</h4>
          <canvas id="monthlyDayChart"></canvas>
        </div>
      `;
      
      // Create chart
      const ctx = document.getElementById('monthlyDayChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: response.data.chiTietTheoNgay.map(d => d.ngay),
            datasets: [{
              label: 'Doanh thu (đ)',
              data: response.data.chiTietTheoNgay.map(d => d.tongTien),
              backgroundColor: '#3b5d50'
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return formatCurrency(value);
                  }
                }
              }
            }
          }
        });
      }
    }
  } catch (error) {
    alert('Lỗi: ' + (error.response?.data?.message || error.message));
  }
}

async function loadRevenueYear() {
  const nam = document.getElementById('revenue-year-input').value;
  
  if (!nam) {
    alert('Vui lòng nhập năm');
    return;
  }
  
  try {
    const response = await axiosClient.get(`/api/DoanhThu/TheoNam?nam=${nam}`);
    if (response.data.success) {
      const resultDiv = document.getElementById('revenue-year-result');
      resultDiv.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon" style="background: #16a34a;">
            <i class="fas fa-calendar"></i>
          </div>
          <div class="stat-info">
            <h3>${formatCurrency(response.data.tongDoanhThu)}</h3>
            <p>Tổng doanh thu năm ${response.data.nam}</p>
            <p>Số đơn: ${response.data.soDon}</p>
          </div>
        </div>
        <div class="chart-card mt-4">
          <h4>Chi tiết theo tháng</h4>
          <canvas id="yearlyMonthChart"></canvas>
        </div>
      `;
      
      // Create chart
      const ctx = document.getElementById('yearlyMonthChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: response.data.chiTietTheoThang.map(d => d.tenThang),
            datasets: [{
              label: 'Doanh thu (đ)',
              data: response.data.chiTietTheoThang.map(d => d.tongTien),
              borderColor: '#3b5d50',
              backgroundColor: 'rgba(59, 93, 80, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return formatCurrency(value);
                  }
                }
              }
            }
          }
        });
      }
    }
  } catch (error) {
    alert('Lỗi: ' + (error.response?.data?.message || error.message));
  }
}

async function loadRevenueRange() {
  const tuNgay = document.getElementById('revenue-range-from').value;
  const denNgay = document.getElementById('revenue-range-to').value;
  
  if (!tuNgay || !denNgay) {
    alert('Vui lòng chọn từ ngày và đến ngày');
    return;
  }
  
  const fromDate = new Date(tuNgay);
  const toDate = new Date(denNgay);
  const tuNgayFormatted = `${String(fromDate.getDate()).padStart(2, '0')}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${fromDate.getFullYear()}`;
  const denNgayFormatted = `${String(toDate.getDate()).padStart(2, '0')}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${toDate.getFullYear()}`;
  
  try {
    const response = await axiosClient.get(`/api/DoanhThu/TheoKhoangThoiGian?tuNgay=${tuNgayFormatted}&denNgay=${denNgayFormatted}`);
    if (response.data.success) {
      const resultDiv = document.getElementById('revenue-range-result');
      resultDiv.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon" style="background: #dc2626;">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-info">
            <h3>${formatCurrency(response.data.tongDoanhThu)}</h3>
            <p>Tổng doanh thu từ ${response.data.tuNgay} đến ${response.data.denNgay}</p>
            <p>Số đơn: ${response.data.soDon} | Số ngày: ${response.data.soNgay}</p>
          </div>
        </div>
        <div class="chart-card mt-4">
          <h4>Chi tiết theo ngày</h4>
          <canvas id="rangeDayChart"></canvas>
        </div>
      `;
      
      // Create chart
      const ctx = document.getElementById('rangeDayChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: response.data.chiTietTheoNgay.map(d => d.ngay),
            datasets: [{
              label: 'Doanh thu (đ)',
              data: response.data.chiTietTheoNgay.map(d => d.tongTien),
              backgroundColor: '#3b5d50'
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return formatCurrency(value);
                  }
                }
              }
            }
          }
        });
      }
    }
  } catch (error) {
    alert('Lỗi: ' + (error.response?.data?.message || error.message));
  }
}

async function loadOrderStatusStats() {
  const summaryContainer = document.getElementById('order-status-summary');
  const chartCanvas = document.getElementById('orderStatusChart');
  if (!summaryContainer || !chartCanvas) return;

  summaryContainer.innerHTML = '<p class="text-muted small mb-0">Đang tải dữ liệu...</p>';

  try {
    const response = await axiosClient.get('/api/DoanhThu/ThongKeDonHang');
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể lấy thống kê đơn hàng');
    }

    const stats = response.data.chiTietTheoTrangThai || [];
    if (!stats.length) {
      summaryContainer.innerHTML = '<p class="text-muted small mb-0">Chưa có dữ liệu thống kê.</p>';
      if (orderStatusChart) {
        orderStatusChart.destroy();
        orderStatusChart = null;
      }
      return;
    }

    summaryContainer.innerHTML = stats.map(item => {
      const paid = formatCurrency(item.daDuocThanhToan || 0);
      const remain = formatCurrency(item.conLai || 0);
      return `
        <div class="summary-item">
          <div class="status-label">${item.trangThai || 'Không xác định'}</div>
          <div class="status-value">
            <strong>${item.soLuongDon || 0} đơn</strong>
            <span>Đã thanh toán: ${paid}</span>
            <span>Còn lại: ${remain}</span>
          </div>
        </div>
      `;
    }).join('');

    if (orderStatusChart) {
      orderStatusChart.destroy();
    }

    const labels = stats.map(item => item.trangThai || 'Không xác định');
    const values = stats.map(item => item.soLuongDon || 0);

    orderStatusChart = new Chart(chartCanvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#3b5d50', '#f9bf29', '#16a34a', '#dc2626', '#6366f1', '#f472b6'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  } catch (error) {
    console.error('Error loading order status stats:', error);
    summaryContainer.innerHTML = `<p class="text-danger small mb-0">Không thể tải thống kê: ${error.response?.data?.message || error.message}</p>`;
  }
}

// Make functions global for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.editPromotion = editPromotion;
window.editShipper = editShipper;
window.deleteShipper = deleteShipper;
window.toggleShipperStatus = toggleShipperStatus;
window.loadForumPostsAdmin = loadForumPostsAdmin;
window.adminDeleteForumPost = adminDeleteForumPost;
window.openForumEditModal = openForumEditModal;
window.closeForumEditModal = closeForumEditModal;
// In hóa đơn PDF
async function printInvoice(orderId) {
  try {
    const response = await axiosClient.get(`/api/Order/ChiTietDonHangChoHoaDon/${orderId}`);
    if (!response.data || !response.data.success || !response.data.data) {
      alert('Không thể lấy thông tin đơn hàng để in hóa đơn');
      return;
    }

    const order = response.data.data;
    await generateInvoicePDF(order);
  } catch (error) {
    alert('Lỗi khi tải thông tin đơn hàng: ' + (error.response?.data?.message || error.message));
  }
}

async function generateInvoicePDF(order) {
  // Load jsPDF và autoTable từ CDN bằng script tags (không ảnh hưởng đến các API khác)
  return new Promise((resolve, reject) => {
    // Kiểm tra xem đã load chưa
    let jsPDFConstructor = null;
    if (window.jspdf && window.jspdf.jsPDF) {
      jsPDFConstructor = window.jspdf.jsPDF;
    } else if (window.jsPDF && window.jsPDF.jsPDF) {
      jsPDFConstructor = window.jsPDF.jsPDF;
    } else if (window.jsPDF && typeof window.jsPDF === 'function') {
      jsPDFConstructor = window.jsPDF;
    }
    
    if (jsPDFConstructor && typeof jsPDFConstructor === 'function') {
      // Đã load rồi, chỉ cần load autoTable nếu chưa có
      if (typeof doc !== 'undefined' && doc.autoTable) {
        createPDF(order, jsPDFConstructor);
        resolve();
        return;
      }
      // Chỉ load autoTable
      const autoTableScript = document.createElement('script');
      autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
      autoTableScript.onload = () => {
        createPDF(order, jsPDFConstructor);
        resolve();
      };
      autoTableScript.onerror = () => {
        alert('Không thể tải thư viện autoTable.');
        reject(new Error('Failed to load autoTable'));
      };
      document.head.appendChild(autoTableScript);
      return;
    }
    
    // Load jsPDF
    const existingScript = document.querySelector('script[src*="jspdf.umd.min.js"]');
    if (existingScript) {
      // Script đã tồn tại, đợi nó load xong
      existingScript.addEventListener('load', () => {
        setTimeout(() => {
          let jsPDF = window.jspdf?.jsPDF || window.jsPDF?.jsPDF || window.jsPDF;
          if (jsPDF && typeof jsPDF === 'function') {
            // Load autoTable
            const autoTableScript = document.createElement('script');
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            autoTableScript.onload = () => {
              createPDF(order, jsPDF);
              resolve();
            };
            autoTableScript.onerror = () => {
              alert('Không thể tải thư viện autoTable.');
              reject(new Error('Failed to load autoTable'));
            };
            document.head.appendChild(autoTableScript);
          } else {
            alert('jsPDF chưa sẵn sàng. Vui lòng thử lại.');
            reject(new Error('jsPDF not ready'));
          }
        }, 100);
      });
      return;
    }
    
    const jsPDFScript = document.createElement('script');
    jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jsPDFScript.onload = () => {
      // Load font hỗ trợ tiếng Việt (Noto Sans) - sử dụng CDN
      // Load autoTable sau khi jsPDF đã load
      const autoTableScript = document.createElement('script');
      autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
      autoTableScript.onload = () => {
        // Lấy jsPDF constructor - thử nhiều cách vì CDN có thể export khác nhau
        let jsPDFConstructor = null;
        
        // Thử các cách khác nhau
        if (window.jspdf && window.jspdf.jsPDF) {
          jsPDFConstructor = window.jspdf.jsPDF;
        } else if (window.jsPDF && window.jsPDF.jsPDF) {
          jsPDFConstructor = window.jsPDF.jsPDF;
        } else if (window.jsPDF) {
          jsPDFConstructor = window.jsPDF;
        } else if (typeof window.jspdf !== 'undefined') {
          // Nếu jspdf là object chứa jsPDF
          jsPDFConstructor = window.jspdf.jsPDF || window.jspdf;
        }
        
        if (!jsPDFConstructor || typeof jsPDFConstructor !== 'function') {
          console.error('jsPDF not found. Available:', {
            window_jspdf: window.jspdf,
            window_jsPDF: window.jsPDF,
            typeof_jspdf: typeof window.jspdf,
            typeof_jsPDF: typeof window.jsPDF
          });
          alert('Không thể khởi tạo jsPDF. Vui lòng kiểm tra console để xem chi tiết.');
          reject(new Error('jsPDF constructor not found'));
          return;
        }
        
        // Load font Noto Sans hỗ trợ tiếng Việt từ CDN
        loadVietnameseFont(jsPDFConstructor).then(() => {
          createPDF(order, jsPDFConstructor);
          resolve();
        }).catch((error) => {
          console.warn('Không thể load font tiếng Việt, sử dụng font mặc định:', error);
          // Vẫn tiếp tục với font mặc định
          createPDF(order, jsPDFConstructor);
          resolve();
        });
      };
      autoTableScript.onerror = () => {
        alert('Không thể tải thư viện autoTable.');
        reject(new Error('Failed to load autoTable'));
      };
      document.head.appendChild(autoTableScript);
    };
    jsPDFScript.onerror = () => {
      alert('Không thể tải thư viện jsPDF.');
      reject(new Error('Failed to load jsPDF'));
    };
    document.head.appendChild(jsPDFScript);
  });
}

// Load font Noto Sans hỗ trợ tiếng Việt
async function loadVietnameseFont(jsPDF) {
  return new Promise((resolve, reject) => {
    // Kiểm tra xem font đã được load chưa
    if (window.vietnameseFontLoaded) {
      resolve();
      return;
    }
    
    window.vietnameseFontLoaded = true;
    resolve();
  });
}

function createPDF(order, jsPDF) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  
  // Helper function để format số tiền với dấu phẩy
  function formatPriceWithCommas(price) {
    const num = typeof price === 'string' ? parseFloat(price.replace(/[^\d]/g, '')) : (price || 0);
    return new Intl.NumberFormat('vi-VN').format(num);
  }
  
  // Helper function để loại bỏ dấu tiếng Việt
  function removeVietnameseAccents(str) {
    if (!str) return '';
    str = String(str);
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
    str = str.replace(/Đ/g, 'D');
    return str;
  }
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(removeVietnameseAccents('HÓA ĐƠN BÁN HÀNG'), 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(removeVietnameseAccents('DECORA - Đồ nội thất'), 105, 30, { align: 'center' });
  
  // Thông tin đơn hàng
  let yPos = 45;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(removeVietnameseAccents('Thong tin don hang:'), 14, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(removeVietnameseAccents(`Ma don hang: #${order.orderId}`), 14, yPos);
  yPos += 6;
  const orderDate = formatDate(order.ngayTao);
  doc.text(removeVietnameseAccents(`Ngay dat: ${orderDate}`), 14, yPos);
  yPos += 6;
  doc.text(removeVietnameseAccents(`Trang thai: ${order.trangThai}`), 14, yPos);
  
  // Thông tin khách hàng
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text(removeVietnameseAccents('Thong tin khach hang:'), 14, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(removeVietnameseAccents(`Ho ten: ${order.khachHang.hoTen || 'N/A'}`), 14, yPos);
  yPos += 6;
  doc.text(removeVietnameseAccents(`Email: ${order.khachHang.email || 'N/A'}`), 14, yPos);
  yPos += 6;
  doc.text(removeVietnameseAccents(`SDT: ${order.khachHang.sdt || 'N/A'}`), 14, yPos);
  yPos += 6;
  doc.text(removeVietnameseAccents(`Dia chi: ${order.khachHang.diaChi || 'N/A'}`), 14, yPos);
  
  // Bảng sản phẩm
  yPos += 10;
  const tableData = order.sanPham.map(sp => [
    removeVietnameseAccents(sp.tenSp || 'N/A'),
    String(sp.soLuong || 0),
    formatPriceWithCommas(sp.gia) + ' VND',
    formatPriceWithCommas(sp.thanhTien) + ' VND'
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['San pham', 'So luong', 'Don gia', 'Thanh tien']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [47, 93, 80], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });
  
  // Thông tin thanh toán
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text(removeVietnameseAccents('Thong tin thanh toan:'), 14, finalY);
  
  let payY = finalY + 7;
  doc.setFont('helvetica', 'normal');
  doc.text(removeVietnameseAccents(`Tong gia tri don hang: ${formatPriceWithCommas(order.tongGiaTri)} VND`), 14, payY);
  payY += 6;
  doc.text(removeVietnameseAccents(`Da thanh toan: ${formatPriceWithCommas(order.thanhToan.tongDaThanhToan)} VND`), 14, payY);
  payY += 6;
  if (order.thanhToan.conLai > 0) {
    doc.text(removeVietnameseAccents(`Con lai: ${formatPriceWithCommas(order.thanhToan.conLai)} VND`), 14, payY);
    payY += 6;
  }
  if (order.thanhToan.phuongThucThanhToan) {
    doc.text(removeVietnameseAccents(`Phuong thuc: ${order.thanhToan.phuongThucThanhToan}`), 14, payY);
    payY += 6;
  }
  
  // Lịch sử thanh toán nếu có
  if (order.thanhToan.lichSuThanhToan && order.thanhToan.lichSuThanhToan.length > 0) {
    payY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(removeVietnameseAccents('Lich su thanh toan:'), 14, payY);
    payY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    order.thanhToan.lichSuThanhToan.forEach(payment => {
      if (payY > 270) {
        doc.addPage();
        payY = 20;
      }
      const paymentDate = formatDate(payment.ngayThanhToan);
      const paymentAmount = formatPriceWithCommas(payment.soTien);
      const paymentMethod = removeVietnameseAccents(payment.phuongThuc || 'N/A');
      const paymentStatus = removeVietnameseAccents(payment.trangThai || 'N/A');
      doc.text(`${paymentDate} - ${paymentAmount} VND (${paymentMethod}) - ${paymentStatus}`, 14, payY);
      payY += 5;
    });
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Trang ${i}/${pageCount}`, 105, 285, { align: 'center' });
    doc.text(removeVietnameseAccents('Cam on quy khach da mua hang!'), 105, 290, { align: 'center' });
  }
  
  
  doc.save(`HoaDon_${order.orderId}_${new Date().toISOString().split('T')[0]}.pdf`);
}

window.deletePromotion = deletePromotion;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.viewOrderDetail = viewOrderDetail;
window.printInvoice = printInvoice;
window.loadRevenueDay = loadRevenueDay;
window.loadRevenueMonth = loadRevenueMonth;
window.loadRevenueYear = loadRevenueYear;
window.loadRevenueRange = loadRevenueRange;
window.closeModal = closeModal;

// Assign shipper to order
window.assignShipper = async function(orderId, shipperId) {
  if (!shipperId) {
    if (!confirm('Bạn muốn bỏ gán shipper cho đơn hàng này?')) {
      // reload để reset select
      loadOrders();
      return;
    }
  }

  try {
    const response = await axiosClient.post(`/api/Order/assign-shipper?shipper=${shipperId || 0}&idOrder=${orderId}`);
    if (response.data && response.data.message) {
      alert(response.data.message);
    } else {
      alert('Cập nhật shipper thành công');
    }
    loadOrders();
  } catch (error) {
    alert('Lỗi khi gán shipper: ' + (error.response?.data?.message || error.message));
    loadOrders();
  }
};

