import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const operationsAPI = {
  getOperations: async (date, status) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (status) params.append('status', status);
    
    const response = await axios.get(`${API}/operations?${params}`);
    return response.data;
  },
  
  getOperationDetail: async (id) => {
    const response = await axios.get(`${API}/operations/${id}`);
    return response.data;
  },
  
  startOperation: async (id) => {
    const response = await axios.post(`${API}/operations/${id}/start`);
    return response.data;
  }
};

export const vehiclesAPI = {
  sendHeartbeat: async (vehicleId, data) => {
    const response = await axios.post(`${API}/vehicles/${vehicleId}/heartbeat`, data);
    return response.data;
  },
  
  getVehicles: async () => {
    const response = await axios.get(`${API}/vehicles`);
    return response.data;
  }
};

export const passengersAPI = {
  checkin: async (paxId, data) => {
    const response = await axios.post(`${API}/pax/${paxId}/checkin`, data);
    return response.data;
  },
  
  getPassengers: async (operationId) => {
    const params = operationId ? `?operation_id=${operationId}` : '';
    const response = await axios.get(`${API}/pax${params}`);
    return response.data;
  }
};

export default {
  operations: operationsAPI,
  vehicles: vehiclesAPI,
  passengers: passengersAPI
};
