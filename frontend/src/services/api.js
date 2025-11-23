import axios from 'axios';

// Backend portu 8002 olarak güncellendi (Server.js ile uyumlu olması için)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002';
const API = `${BACKEND_URL}/api`;

// Axios instance oluştur
const axiosInstance = axios.create({
  baseURL: API,
});

// Request Interceptor: Her isteğe Token ekle
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- YENİ EKLENEN: Response Interceptor (Otomatik Çıkış) ---
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Eğer sunucudan 401 (Yetkisiz) hatası gelirse
    if (error.response?.status === 401) {
      console.warn('Oturum süresi doldu, çıkış yapılıyor...');
      // Token'ı temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Login sayfasına yönlendir
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
// -----------------------------------------------------------

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await axiosInstance.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

export const operationsAPI = {
  getOperations: async (date, status) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (status) params.append('status', status);
    
    const response = await axiosInstance.get(`/operations?${params}`);
    return response.data;
  },
  
  getOperationDetail: async (id) => {
    const response = await axiosInstance.get(`/operations/${id}`);
    return response.data;
  },
  
  startOperation: async (id) => {
    const response = await axiosInstance.post(`/operations/${id}/start`);
    return response.data;
  },

  // Operasyon oluşturma
  createOperation: async (data) => {
    const response = await axiosInstance.post('/operations', data);
    return response.data;
  }
};

export const vehiclesAPI = {
  sendHeartbeat: async (vehicleId, data) => {
    const response = await axiosInstance.post(`/vehicles/${vehicleId}/heartbeat`, data);
    return response.data;
  },
  
  getVehicles: async () => {
    const response = await axiosInstance.get(`/vehicles`);
    return response.data;
  },

  createVehicle: async (data) => {
    const response = await axiosInstance.post('/vehicles', data);
    return response.data;
  }
};

export const passengersAPI = {
  checkin: async (paxId, data) => {
    const response = await axiosInstance.post(`/pax/${paxId}/checkin`, data);
    return response.data;
  },
  
  getPassengers: async (operationId) => {
    const params = operationId ? `?operation_id=${operationId}` : '';
    const response = await axiosInstance.get(`/pax${params}`);
    return response.data;
  }
};

export const customersAPI = {
  getCustomers: async () => {
    const response = await axiosInstance.get('/customers');
    return response.data;
  },
  
  createCustomer: async (data) => {
    const response = await axiosInstance.post('/customers', data);
    return response.data;
  },
  
  deleteCustomer: async (id) => {
    const response = await axiosInstance.delete(`/customers/${id}`);
    return response.data;
  }
};

export default {
  auth: authAPI,
  operations: operationsAPI,
  vehicles: vehiclesAPI,
  passengers: passengersAPI,
  customers: customersAPI
};