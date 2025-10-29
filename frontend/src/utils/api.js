import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to all requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const userAPI = {
  // Get income entries for authenticated user (with optional year filter)
  getIncomeEntries: (year) => api.get('/api/user/income-entries', { params: year ? { year } : {} }),
  
  // Add income entry
  addIncomeEntry: (data) => api.post('/api/user/income-entries', data),
  
  // Update income entry
  updateIncomeEntry: (index, data) => api.put(`/api/user/income-entries/${index}`, data),
  
  // Delete income entry
  deleteIncomeEntry: (index) => api.delete(`/api/user/income-entries/${index}`),
  
  // Get deduction entries for authenticated user (with optional year filter)
  getDeductionEntries: (year) => api.get('/api/user/deduction-entries', { params: year ? { year } : {} }),
  
  // Add deduction entry
  addDeductionEntry: (data) => api.post('/api/user/deduction-entries', data),
  
  // Update deduction entry
  updateDeductionEntry: (index, data) => api.put(`/api/user/deduction-entries/${index}`, data),
  
  // Delete deduction entry
  deleteDeductionEntry: (index) => api.delete(`/api/user/deduction-entries/${index}`),
  
  // Get tax optimization data
  getTaxOptimization: () => api.get('/api/user/tax-optimization'),
};

export const paymentAPI = {
  // Get all payments for authenticated user
  getPayments: () => api.get('/api/payments'),
  
  // Get payment by transaction ID
  getPayment: (transactionId) => api.get(`/api/payments/${transactionId}`),
  
  // Create new payment
  createPayment: (data) => api.post('/api/payments', data),
  
  // Get payment statistics
  getPaymentStats: () => api.get('/api/payments/stats/summary'),
};

export const taxRecordAPI = {
  // Get all tax records for authenticated user
  getTaxRecords: () => api.get('/api/tax-records'),
  
  // Get tax record for specific year
  getTaxRecord: (year) => api.get(`/api/tax-records/${year}`),
  
  // Create or update tax record
  saveTaxRecord: (data) => api.post('/api/tax-records', data),
  
  // Update tax record status
  updateTaxRecordStatus: (year, status) => api.put(`/api/tax-records/${year}/status`, { status }),
  
  // Delete tax record
  deleteTaxRecord: (year) => api.delete(`/api/tax-records/${year}`),
};

export const notificationAPI = {
  // Get all notifications
  getNotifications: (unreadOnly = false) => api.get('/api/notifications', { 
    params: { unreadOnly } 
  }),
  
  // Get unread notification count
  getUnreadCount: () => api.get('/api/notifications/unread/count'),
  
  // Create notification
  createNotification: (data) => api.post('/api/notifications', data),
  
  // Mark notification as read
  markAsRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
  
  // Mark all as read
  markAllAsRead: () => api.put('/api/notifications/read/all'),
  
  // Delete notification
  deleteNotification: (notificationId) => api.delete(`/api/notifications/${notificationId}`),
  
  // Delete all read notifications
  deleteAllRead: () => api.delete('/api/notifications/read/all'),
};

export default api;
