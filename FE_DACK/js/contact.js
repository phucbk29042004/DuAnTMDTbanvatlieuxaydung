// Contact Form JavaScript
import axiosClient from './api/axiosClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit-btn');
  const alertDiv = document.getElementById('contact-alert');
  const spinner = submitBtn.querySelector('.spinner-border-sm');
  const btnText = submitBtn.querySelector('.btn-text');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form values
      const fullName = document.getElementById('contact-fullname').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const message = document.getElementById('contact-message').value.trim();

      // Validation
      if (!fullName || !email || !message) {
        showAlert('Vui lòng điền đầy đủ thông tin!', 'danger');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAlert('Email không hợp lệ!', 'danger');
        return;
      }

      // Disable submit button and show loading
      submitBtn.disabled = true;
      spinner.classList.remove('d-none');
      btnText.textContent = 'Đang gửi...';
      hideAlert();

      try {
        // Call API
        const response = await axiosClient.post('/api/Contract/CreateContract', {
          FullName: fullName,
          Email: email,
          Message: message
        });

        // Success
        if (response.data && response.data.message) {
          showAlert(response.data.message, 'success');
          contactForm.reset();
        } else {
          showAlert('Gửi tin nhắn thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.', 'success');
          contactForm.reset();
        }
      } catch (error) {
        console.error('Error sending contact:', error);
        
        let errorMessage = 'Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.';
        
        if (error.response) {
          errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        }
        
        showAlert(errorMessage, 'danger');
      } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
        btnText.textContent = 'Gửi tin nhắn';
      }
    });
  }

  function showAlert(message, type) {
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.classList.remove('d-none');
    
    // Auto hide after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        hideAlert();
      }, 5000);
    }
  }

  function hideAlert() {
    alertDiv.classList.add('d-none');
  }
});

