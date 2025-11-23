import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Axios instance oluştur (Daha yönetilebilir yapı için)
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

  // EKLENDİ: Yeni araç oluşturma
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

// EKLENDİ: Müşteri Yönetimi API'leri
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
  customers: customersAPI // Eklendi
};