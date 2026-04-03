import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export const pricing = {
  calculate: (city, userId) => api.post('/pricing', { city, user_id: userId }),
};

export const policies = {
  create: (city, premium, deviceId) => api.post('/policies', { city, premium, device_id: deviceId }),
  getActive: () => api.get('/policies/active'),
  getHistory: () => api.get('/policies/history'),
};

export const payment = {
  confirm: (policyId, method = 'upi_simulation') => api.post('/payment/confirm', { policy_id: policyId, payment_method: method }),
};

export const weather = {
  get: (city) => api.get(`/weather/${city}`),
};

export const wallet = {
  get: () => api.get('/wallet'),
  redeem: (coins) => api.post('/wallet/redeem', { coins }),
};

export const cities = {
  getAll: () => api.get('/cities'),
};

export const triggers = {
  evaluate: (city, manualWeather = null) => api.post('/triggers/evaluate', { city, manual_weather: manualWeather }),
  history: () => api.get('/triggers/history'),
};

export const claims = {
  history: () => api.get('/claims/history'),
  detail: (claimId) => api.get(`/claims/${claimId}`),
};

export const rewards = {
  history: () => api.get('/rewards/history'),
};

export const severity = {
  get: () => api.post('/severity'),
};

export const riskScore = {
  get: () => api.post('/risk-score'),
};

export const dashboard = {
  summary: () => api.get('/dashboard/summary'),
};

export default api;
