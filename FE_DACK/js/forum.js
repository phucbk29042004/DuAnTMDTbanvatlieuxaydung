import axiosClient from './api/axiosClient.js';

const POSTS_PAGE_SIZE = 5;
let currentPage = 1;
let totalPages = 1;

const postsListEl = document.getElementById('forum-posts-list');
const paginationEl = document.getElementById('forum-pagination');
const createPostForm = document.getElementById('create-post-form');
const createPostGuest = document.getElementById('create-post-guest');
const refreshPostsBtn = document.getElementById('refresh-posts-btn');
const myPostsListEl = document.getElementById('my-posts-list');
const reloadMyPostsBtn = document.getElementById('reload-my-posts-btn');

function isLoggedIn() {
  const token = localStorage.getItem('token');
  return !!token;
}

function formatDateTime(dateString) {
  const d = new Date(dateString);
  return d.toLocaleString('vi-VN');
}

function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.Id || user.id || null;
  } catch {
    return null;
  }
}

function renderPostsSkeleton() {
  postsListEl.innerHTML = `
    <div class="text-center text-muted py-4">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mb-0">Đang tải bài viết...</p>
    </div>
  `;
}

function renderPosts(posts) {
  if (!posts || posts.length === 0) {
    postsListEl.innerHTML = `
      <div class="alert alert-info mb-0">
        Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ kinh nghiệm của bạn!
      </div>
    `;
    return;
  }

  postsListEl.innerHTML = posts.map(post => `
    <article class="forum-post-item border rounded-4 p-3 p-md-4 mb-3 bg-white shadow-sm">
      <header class="mb-2 d-flex justify-content-between align-items-start gap-2">
        <div>
          <h3 class="h5 mb-1">
            <a href="services.html#forum-post-${post.id}" class="text-decoration-none forum-post-link" data-post-id="${post.id}">
              ${post.tieuDe}
            </a>
          </h3>
          <div class="small text-muted">
            Đăng bởi <strong>${post.tacGia?.hoTen || 'Người dùng'}</strong>
            • ${formatDateTime(post.ngayTao)}
          </div>
        </div>
        <span class="badge bg-light text-muted small">
          <i class="fas fa-eye me-1"></i>${post.luotXem || 0} lượt xem
        </span>
      </header>
      <div class="mb-2 small text-secondary">
        ${post.noiDung}
      </div>
      <footer class="d-flex justify-content-between align-items-center small text-muted">
        <span><i class="far fa-comment-dots me-1"></i>${post.soBinhLuan || 0} bình luận</span>
        <a href="javascript:void(0)" class="text-primary text-decoration-none forum-view-detail" data-post-id="${post.id}">
          Xem chi tiết <i class="fas fa-arrow-right ms-1"></i>
        </a>
      </footer>
    </article>
  `).join('');

  attachPostDetailHandlers();
}

function renderPagination() {
  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  const items = [];

  const disabledPrev = currentPage === 1 ? ' disabled' : '';
  items.push(`
    <li class="page-item${disabledPrev}">
      <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Trang trước">
        &laquo;
      </a>
    </li>
  `);

  for (let p = 1; p <= totalPages; p++) {
    const active = p === currentPage ? ' active' : '';
    items.push(`
      <li class="page-item${active}">
        <a class="page-link" href="#" data-page="${p}">${p}</a>
      </li>
    `);
  }

  const disabledNext = currentPage === totalPages ? ' disabled' : '';
  items.push(`
    <li class="page-item${disabledNext}">
      <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Trang sau">
        &raquo;
      </a>
    </li>
  `);

  paginationEl.innerHTML = items.join('');

  paginationEl.querySelectorAll('a[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(link.getAttribute('data-page'), 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
        loadPosts(page);
      }
    });
  });
}

async function loadPosts(page = 1) {
  currentPage = page;
  renderPostsSkeleton();

  try {
    const response = await axiosClient.get(`/api/Forum/posts?page=${page}&pageSize=${POSTS_PAGE_SIZE}`);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải danh sách bài viết');
    }

    const { data, pagination } = response.data;
    totalPages = pagination?.totalPages || 1;

    renderPosts(data || []);
    renderPagination();
  } catch (error) {
    postsListEl.innerHTML = `
      <div class="alert alert-danger mb-0">
        Lỗi khi tải danh sách bài viết: ${error.response?.data?.message || error.message}
      </div>
    `;
  }
}

async function loadMyPosts() {
  if (!isLoggedIn()) {
    myPostsListEl.innerHTML = `
      <p class="text-muted mb-0 small">
        Đăng nhập để xem các bài viết bạn đã đăng.
      </p>
    `;
    return;
  }

  myPostsListEl.innerHTML = `
    <div class="text-center text-muted py-2 small">
      <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
      Đang tải bài viết của bạn...
    </div>
  `;

  try {
    const response = await axiosClient.get('/api/Forum/my-posts');
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Không thể tải bài viết của bạn');
    }

    const posts = response.data.data || [];
    if (posts.length === 0) {
      myPostsListEl.innerHTML = `
        <p class="text-muted mb-0 small">
          Bạn chưa có bài viết nào. Hãy bắt đầu chia sẻ ngay!
        </p>
      `;
      return;
    }

    myPostsListEl.innerHTML = posts.map(p => `
      <div class="my-post-item d-flex justify-content-between align-items-start mb-2">
        <div>
          <a href="javascript:void(0)" class="text-decoration-none forum-view-detail small" data-post-id="${p.id}">
            ${p.tieuDe}
          </a>
          <div class="small text-muted">
            ${formatDateTime(p.ngayTao)} • ${p.soBinhLuan || 0} bình luận
          </div>
        </div>
        <div class="ms-2">
          <button class="btn btn-danger btn-sm px-2 py-1 rounded-pill forum-delete-post" data-post-id="${p.id}" style="font-size: 12px;">
            <i class="fas fa-trash me-1"></i> Xóa
          </button>
        </div>
      </div>
    `).join('');

    attachPostDetailHandlers();
    attachDeletePostHandlers();
  } catch (error) {
    myPostsListEl.innerHTML = `
      <div class="text-danger small">
        Lỗi: ${error.response?.data?.message || error.message}
      </div>
    `;
  }
}

function attachPostDetailHandlers() {
  document.querySelectorAll('.forum-view-detail, .forum-post-link').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      const postId = el.getAttribute('data-post-id');
      if (!postId) return;
      openPostDetailModal(parseInt(postId, 10));
    });
  });
}

function attachDeletePostHandlers() {
  document.querySelectorAll('.forum-delete-post').forEach(btn => {
    btn.addEventListener('click', async () => {
      const postId = btn.getAttribute('data-post-id');
      if (!postId) return;
      if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

      try {
        const response = await axiosClient.delete(`/api/Forum/posts/${postId}`);
        if (response.data?.success) {
          alert('Đã xóa bài viết.');
          loadPosts(currentPage);
          loadMyPosts();
        } else {
          alert('Lỗi: ' + (response.data?.message || 'Không thể xóa bài viết'));
        }
      } catch (error) {
        alert('Lỗi khi xóa bài viết: ' + (error.response?.data?.message || error.message));
      }
    });
  });
}

async function openPostDetailModal(postId) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'forum-post-modal';
  Object.assign(modal.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: '2000'
  });

  modal.innerHTML = `
    <div class="modal-content" style="position: relative; max-width: 960px; width: 100%; max-height: 90vh; overflow: hidden; border-radius: 14px; box-shadow: 0 12px 30px rgba(0,0,0,0.25); background: #fff; display: flex; flex-direction: column;">
      <span class="close" id="forum-post-modal-close" style="position: absolute; top: 8px; right: 10px; font-size: 26px; cursor: pointer; padding: 6px 10px; z-index: 2;">&times;</span>
      <div style="padding: 22px 26px; overflow-y: auto;">
        <div id="forum-post-modal-body">
          <div class="text-center text-muted py-4">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mb-0">Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => {
    modal.style.display = 'none';
    modal.remove();
  };

  document.getElementById('forum-post-modal-close').onclick = closeModal;
  window.addEventListener('click', function handler(e) {
    if (e.target === modal) {
      window.removeEventListener('click', handler);
      closeModal();
    }
  });

  try {
    const response = await axiosClient.get(`/api/Forum/posts/${postId}`);
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Không tìm thấy bài viết');
    }

    const post = response.data.data;
    const userId = getCurrentUserId();
    const isOwner = userId && post.tacGia && (post.tacGia.id === userId);

    const commentsHtml = (post.binhLuan || []).map(c => {
      const isCommentOwner = userId && c.nguoiBinhLuan && c.nguoiBinhLuan.id === userId;
      return `
      <div class="border rounded-3 p-2 p-md-3" style="background:#f9fafb;">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong>${c.nguoiBinhLuan?.hoTen || 'Người dùng'}</strong>
            <div class="small text-muted">${formatDateTime(c.ngayTao)}</div>
          </div>
          ${isCommentOwner ? `
          <div class="ms-2 d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary px-3 py-1 rounded-pill forum-edit-comment" data-comment-id="${c.id}" style="font-size: 13px; border-width: 1.5px;">
              <i class="fas fa-edit me-1"></i>Sửa
            </button>
            <button class="btn btn-sm btn-outline-danger px-3 py-1 rounded-pill forum-delete-comment" data-comment-id="${c.id}" style="font-size: 13px; border-width: 1.5px;">
              <i class="fas fa-trash me-1"></i>Xóa
            </button>
          </div>
          ` : ''}
        </div>
        <p class="mb-0 small mt-2">${c.noiDung}</p>
      </div>
    `;
    }).join('') || '<p class="text-muted small mb-0">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';

    const modalBody = document.getElementById('forum-post-modal-body');
    modalBody.innerHTML = `
      <article>
        <header class="mb-4">
          <h2 class="h4 mb-2">${post.tieuDe}</h2>
          <div class="small text-muted">
            Đăng bởi <strong>${post.tacGia?.hoTen || 'Người dùng'}</strong>
            • ${formatDateTime(post.ngayTao)}
            • <i class="fas fa-eye me-1 ms-2"></i>${post.luotXem || 0} lượt xem
          </div>
        </header>
        <div class="mb-4" style="line-height: 1.6;">
          <p class="mb-0" style="white-space: pre-line;">${post.noiDung}</p>
        </div>
        ${isOwner ? `
          <div class="mb-4 d-flex gap-3 flex-wrap">
            <button class="btn btn-sm btn-primary px-4 py-2 rounded-pill shadow-sm" id="forum-edit-post-btn" style="font-weight: 500; transition: all 0.3s ease;">
              <i class="fas fa-edit me-2"></i>Sửa bài viết
            </button>
            <button class="btn btn-sm btn-danger px-4 py-2 rounded-pill shadow-sm" id="forum-delete-post-btn" style="font-weight: 500; transition: all 0.3s ease;">
              <i class="fas fa-trash-alt me-2"></i>Xóa bài viết
            </button>
          </div>
        ` : ''}
        <section class="mb-4">
          <div class="d-flex align-items-center mb-3">
            <h5 class="h6 mb-0">Bình luận</h5>
            <span class="badge bg-light text-muted ms-2">${(post.binhLuan || []).length} bình luận</span>
          </div>
          <div id="forum-comments-list" style="display: grid; gap: 10px;">
            ${commentsHtml}
          </div>
        </section>
        <section>
          ${isLoggedIn() ? `
          <form id="forum-comment-form" class="mb-0">
            <div class="mb-2">
              <label for="forum-comment-content" class="form-label small">Thêm bình luận</label>
              <textarea id="forum-comment-content" class="form-control form-control-sm" rows="3" maxlength="1000" required></textarea>
            </div>
            <div class="d-flex justify-content-end">
              <button type="submit" class="btn btn-success btn-sm px-3">
                <i class="fas fa-comment-dots me-1"></i> Gửi bình luận
              </button>
            </div>
          </form>
          ` : `
          <p class="text-muted small mb-0">
            Bạn cần <a href="login.html">đăng nhập</a> để bình luận.
          </p>
          `}
        </section>
      </article>
    `;

    if (isOwner) {
      const editBtn = document.getElementById('forum-edit-post-btn');
      const deleteBtn = document.getElementById('forum-delete-post-btn');

      if (editBtn) {
        editBtn.addEventListener('click', async () => {
          const newTitle = prompt('Tiêu đề mới:', post.tieuDe);
          if (!newTitle || !newTitle.trim()) return;
          const newContent = prompt('Nội dung mới:', post.noiDung);
          if (!newContent || !newContent.trim()) return;

          try {
            const res = await axiosClient.put(`/api/Forum/posts/${post.id}`, {
              TieuDe: newTitle.trim(),
              NoiDung: newContent.trim()
            });
            if (res.data?.success) {
              alert('Đã cập nhật bài viết.');
              closeModal();
              loadPosts(currentPage);
              loadMyPosts();
            } else {
              alert('Lỗi: ' + (res.data?.message || 'Không thể cập nhật bài viết'));
            }
          } catch (error) {
            alert('Lỗi khi cập nhật bài viết: ' + (error.response?.data?.message || error.message));
          }
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
          try {
            const res = await axiosClient.delete(`/api/Forum/posts/${post.id}`);
            if (res.data?.success) {
              alert('Đã xóa bài viết.');
              closeModal();
              loadPosts(currentPage);
              loadMyPosts();
            } else {
              alert('Lỗi: ' + (res.data?.message || 'Không thể xóa bài viết'));
            }
          } catch (error) {
            alert('Lỗi khi xóa bài viết: ' + (error.response?.data?.message || error.message));
          }
        });
      }
    }

    const commentForm = document.getElementById('forum-comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const contentEl = document.getElementById('forum-comment-content');
        const content = contentEl.value.trim();
        if (!content) return;

        try {
          const res = await axiosClient.post('/api/Forum/comments', {
            PostId: post.id,
            NoiDung: content
          });
          if (res.data?.success) {
            contentEl.value = '';
            alert('Đã thêm bình luận.');
            closeModal();
            openPostDetailModal(post.id);
          } else {
            alert('Lỗi: ' + (res.data?.message || 'Không thể thêm bình luận'));
          }
        } catch (error) {
          alert('Lỗi khi thêm bình luận: ' + (error.response?.data?.message || error.message));
        }
      });
    }

    // Edit comment
    document.querySelectorAll('.forum-edit-comment').forEach(btn => {
      btn.addEventListener('click', async () => {
        const commentId = btn.getAttribute('data-comment-id');
        if (!commentId) return;
        const currentText = btn.closest('.border')?.querySelector('p.small')?.textContent || '';
        const newContent = prompt('Nội dung bình luận mới:', currentText);
        if (!newContent || !newContent.trim()) return;

        try {
          const res = await axiosClient.put(`/api/Forum/comments/${commentId}`, {
            NoiDung: newContent.trim()
          });
          if (res.data?.success) {
            alert('Đã cập nhật bình luận.');
            closeModal();
            openPostDetailModal(post.id);
          } else {
            alert('Lỗi: ' + (res.data?.message || 'Không thể cập nhật bình luận'));
          }
        } catch (error) {
          alert('Lỗi khi cập nhật bình luận: ' + (error.response?.data?.message || error.message));
        }
      });
    });

    // Delete comment
    document.querySelectorAll('.forum-delete-comment').forEach(btn => {
      btn.addEventListener('click', async () => {
        const commentId = btn.getAttribute('data-comment-id');
        if (!commentId) return;
        if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

        try {
          const res = await axiosClient.delete(`/api/Forum/comments/${commentId}`);
          if (res.data?.success) {
            alert('Đã xóa bình luận.');
            closeModal();
            openPostDetailModal(post.id);
          } else {
            alert('Lỗi: ' + (res.data?.message || 'Không thể xóa bình luận'));
          }
        } catch (error) {
          alert('Lỗi khi xóa bình luận: ' + (error.response?.data?.message || error.message));
        }
      });
    });
  } catch (error) {
    const modalBody = document.getElementById('forum-post-modal-body');
    modalBody.innerHTML = `
      <div class="alert alert-danger mb-0">
        Lỗi khi tải bài viết: ${error.response?.data?.message || error.message}
      </div>
    `;
  }
}

function initCreatePostForm() {
  if (!createPostForm) return;

  if (!isLoggedIn()) {
    createPostForm.style.display = 'none';
    if (createPostGuest) createPostGuest.style.display = 'block';
    return;
  }

  createPostGuest && (createPostGuest.style.display = 'none');
  createPostForm.style.display = 'block';

  createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (!title) {
      alert('Vui lòng nhập tiêu đề.');
      return;
    }
    if (!content) {
      alert('Vui lòng nhập nội dung.');
      return;
    }

    try {
      const response = await axiosClient.post('/api/Forum/posts', {
        TieuDe: title,
        NoiDung: content
      });
      if (response.data?.success) {
        alert('Đăng bài viết thành công.');
        createPostForm.reset();
        loadPosts(1);
        loadMyPosts();
      } else {
        alert('Lỗi: ' + (response.data?.message || 'Không thể đăng bài viết'));
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = 'login.html';
      } else {
        alert('Lỗi khi đăng bài viết: ' + (error.response?.data?.message || error.message));
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (refreshPostsBtn) {
    refreshPostsBtn.addEventListener('click', () => loadPosts(currentPage));
  }
  if (reloadMyPostsBtn) {
    reloadMyPostsBtn.addEventListener('click', loadMyPosts);
  }

  initCreatePostForm();
  loadPosts(1);
  loadMyPosts();
});


