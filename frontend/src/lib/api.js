import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const analyticsAPI = {
  // Get full analytics data
  getAnalytics: async () => {
    const response = await api.get('/api/analytics');
    return response.data;
  },

  // Get metadata and summary
  getMetadata: async () => {
    const response = await api.get('/api/metadata');
    return response.data;
  },

  // Trigger data refresh
  refreshData: async () => {
    const response = await api.post('/api/refresh');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
