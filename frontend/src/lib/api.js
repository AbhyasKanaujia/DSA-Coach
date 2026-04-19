import axios from 'axios';

// API base URL - configure based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
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

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getStats: () => api.get('/auth/stats'),
};

// Cards API
export const cardsAPI = {
  list: (params) => api.get('/cards', { params }),
  get: (cardId) => api.get(`/cards/${cardId}`),
  create: (data) => api.post('/cards', data),
  update: (cardId, data) => api.put(`/cards/${cardId}`, data),
  delete: (cardId) => api.delete(`/cards/${cardId}`),
  addSolution: (cardId, data) => api.post(`/cards/${cardId}/solutions`, data),
  updateSolution: (cardId, solutionIndex, data) =>
    api.put(`/cards/${cardId}/solutions/${solutionIndex}`, data),
};

// Sessions API
export const sessionsAPI = {
  getDueCards: () => api.get('/sessions'),
  submitReview: (data) => api.post('/sessions/review', data),
};

export default api;