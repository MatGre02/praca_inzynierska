import axios, { AxiosInstance } from 'axios';

const API_BASE = '/api';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export individual service objects
export const authService = {
  login: (email: string, haslo: string) =>
    client.post('/auth/logowanie', { email, haslo }),
  register: (data: any) =>
    client.post('/auth/rejestracja', data),
  me: () =>
    client.get('/auth/me'),
  forgotPassword: (email: string) =>
    client.post('/password/forgot-password', { email }),
  resetPassword: (token: string, noweHaslo: string) =>
    client.post('/password/reset-password', { token, noweHaslo }),
  changePassword: (staroHaslo: string, noweHaslo: string) =>
    client.post('/password/change-password', { staroHaslo, noweHaslo }),
};

export const adminService = {
  getUsers: (params?: any) =>
    client.get('/admin/uzytkownicy', { params }),
  getUserById: (id: string) =>
    client.get(`/admin/uzytkownicy/${id}`),
  createUser: (data: any) =>
    client.post('/admin/uzytkownicy', data),
  updateUserRole: (id: string, rola: string) =>
    client.patch(`/admin/uzytkownicy/${id}/role`, { rola }),
  updateUserPosition: (id: string, pozycja: string) =>
    client.patch(`/admin/uzytkownicy/${id}/position`, { pozycja }),
  updateUserCategory: (id: string, kategoria: string) =>
    client.patch(`/admin/uzytkownicy/${id}/category`, { kategoria }),
  updateUserPassword: (id: string, haslo: string) =>
    client.patch(`/admin/uzytkownicy/${id}/password`, { haslo }),
  deleteUser: (id: string) =>
    client.delete(`/admin/uzytkownicy/${id}`),
};

export const statystykiService = {
  getStats: (params?: any) =>
    client.get('/statystyki', { params }),
  getStatsByPlayer: (zawodnikId: string) =>
    client.get(`/statystyki/${zawodnikId}`),
  addStats: (zawodnikId: string, data: any) =>
    client.post(`/statystyki/${zawodnikId}`, data),
  updateStats: (statystykaId: string, data: any) =>
    client.patch(`/statystyki/${statystykaId}`, data),
  getFilters: () =>
    client.get('/statystyki/filters/available'),
};

export const wydarzeniaService = {
  getAll: () =>
    client.get('/wydarzenia'),
  getById: (id: string) =>
    client.get(`/evenimente/${id}`),
  create: (data: any) =>
    client.post('/wydarzenia', data),
  update: (id: string, data: any) =>
    client.patch(`/wydarzenia/${id}`, data),
  delete: (id: string) =>
    client.delete(`/wydarzenia/${id}`),
  respondToEvent: (id: string, odpowiedz: 'TAK' | 'NIE') =>
    client.post(`/wydarzenia/${id}/udzial`, { odpowiedz }),
};

export const squadsService = {
  getAll: () =>
    client.get('/squads'),
  getById: (id: string) =>
    client.get(`/squads/${id}`),
  create: (data: any) =>
    client.post('/squads', data),
  update: (id: string, data: any) =>
    client.patch(`/squads/${id}`, data),
  delete: (id: string) =>
    client.delete(`/squads/${id}`),
};

export const mailService = {
  send: (to: string[], subject: string, html: string) =>
    client.post('/mail/send', { to, subject, html }),
  sendCategory: (category: string, subject: string, html: string) =>
    client.post('/mail/send-category', { category, subject, html }),
  getRecipients: () =>
    client.get('/mail/recipients'),
};

export const reportsService = {
  getPlayers: (format: 'json' | 'csv' = 'json', sezon?: string) =>
    client.get('/reports/players', { params: { format, sezon } }),
  getByCategory: (category: string, format: 'json' | 'csv' = 'json') =>
    client.get(`/reports/category/${category}`, { params: { format } }),
  getByPosition: (position: string, format: 'json' | 'csv' = 'json') =>
    client.get(`/reports/position/${position}`, { params: { format } }),
};

export default client;
