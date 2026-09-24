import api, { extractErrorMessage } from './api';

export { extractErrorMessage };

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
};

export const vehicleApi = {
  list: () => api.get('/vehicles'),
  get: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  remove: (id) => api.delete(`/vehicles/${id}`),
};

export const parkingApi = {
  listSlots: (params) => api.get('/parking/slots', { params }),
  listAvailable: (params) => api.get('/parking/slots/available', { params }),
  getSlot: (id) => api.get(`/parking/slots/${id}`),
  createSlot: (data) => api.post('/parking/slots', data),
  updateSlot: (id, data) => api.put(`/parking/slots/${id}`, data),
  deleteSlot: (id) => api.delete(`/parking/slots/${id}`),
  recommend: (data) => api.post('/parking/recommendations', data),
};

export const bookingApi = {
  create: (data) => api.post('/bookings', data),
  mine: () => api.get('/bookings/my'),
  get: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  entry: (id) => api.put(`/bookings/${id}/entry`),
  exit: (id) => api.put(`/bookings/${id}/exit`),
};

export const adminApi = {
  users: () => api.get('/admin/users'),
  user: (id) => api.get(`/admin/users/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  vehicles: () => api.get('/admin/vehicles'),
  bookings: (params) => api.get('/admin/bookings', { params }),
};

export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  prediction: (targetDate) => api.get('/analytics/prediction', { params: { targetDate } }),
};
