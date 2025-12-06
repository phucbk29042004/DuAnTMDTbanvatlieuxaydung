// js/api/axiosClient.js

const axiosClient = axios.create({
  baseURL: "http://localhost:5155",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Tự động gắn token vào mọi request nếu có
axiosClient.interceptors.request.use(config => {
  const token = localStorage.getItem("token"); // lấy token riêng
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Request to:', config.url, 'with token:', token.substring(0, 20) + '...');
  } else {
    console.warn('No token found for request:', config.url);
  }
  return config;
});

// Response interceptor để log errors
axiosClient.interceptors.response.use(
  response => {
    console.log('Response from:', response.config.url, 'Status:', response.status);
    return response;
  },
  error => {
    console.error('Error from:', error.config?.url, 'Status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    return Promise.reject(error);
  }
);

export default axiosClient;
