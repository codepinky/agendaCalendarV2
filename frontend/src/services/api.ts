import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Se for FormData, remover Content-Type para que o axios defina automaticamente com boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const getPublicProfile = (publicLink: string) => {
  return api.get(`/bookings/public-profile/${publicLink}`);
};

export const updatePublicCustomization = (data: { 
  publicTitle?: string; 
  socialLinks?: any;
  publicProfile?: any;
}) => {
  return api.put('/users/public-customization', data);
};

export const uploadProfileImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  // Não definir Content-Type manualmente - o axios detecta FormData e adiciona o boundary automaticamente
  return api.post('/users/upload/profile-image', formData);
};

export const uploadBannerImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  // Não definir Content-Type manualmente - o axios detecta FormData e adiciona o boundary automaticamente
  return api.post('/users/upload/banner-image', formData);
};

export const uploadBackgroundImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  // Não definir Content-Type manualmente - o axios detecta FormData e adiciona o boundary automaticamente
  return api.post('/users/upload/background-image', formData);
};

export default api;









