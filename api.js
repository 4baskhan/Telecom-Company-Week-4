/**
 * Central API client for TeleConnect Pro.
 * Change API_BASE_URL if the backend runs somewhere other than
 * http://localhost:5000 (see README for deployment notes).
 */
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : `${window.location.origin}/api`;

const TOKEN_KEY = 'tcp_token';
const USER_KEY = 'tcp_user';

const Auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

/**
 * Low-level request helper. Throws an Error with a readable message
 * on any non-2xx response so callers can catch() and show a toast.
 */
async function apiRequest(path, { method = 'GET', body, params } = {}) {
  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (query) url += `?${query}`;
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error(
      'Could not reach the TeleConnect Pro API. Make sure the backend server is running on ' + API_BASE_URL
    );
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401 && path !== '/auth/login') {
    // Session expired or invalid — force re-login
    Auth.clearSession();
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
      window.location.href = 'index.html';
    }
  }

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    const details = data?.details;
    const error = new Error(details && details.length ? `${message}: ${details.map((d) => d.message || d).join(', ')}` : message);
    error.status = res.status;
    error.details = details;
    throw error;
  }

  return data;
}

const api = {
  // Auth
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  me: () => apiRequest('/auth/me'),

  // Dashboard
  stats: () => apiRequest('/dashboard/stats'),

  // Customers
  listCustomers: (params) => apiRequest('/customers', { params }),
  getCustomer: (id) => apiRequest(`/customers/${id}`),
  createCustomer: (payload) => apiRequest('/customers', { method: 'POST', body: payload }),
  updateCustomer: (id, payload) => apiRequest(`/customers/${id}`, { method: 'PUT', body: payload }),
  deleteCustomer: (id) => apiRequest(`/customers/${id}`, { method: 'DELETE' }),

  // Orders
  listOrders: (params) => apiRequest('/orders', { params }),
  getOrder: (id) => apiRequest(`/orders/${id}`),
  createOrder: (payload) => apiRequest('/orders', { method: 'POST', body: payload }),
  updateOrder: (id, payload) => apiRequest(`/orders/${id}`, { method: 'PUT', body: payload }),
  updateOrderStatus: (id, status) => apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteOrder: (id) => apiRequest(`/orders/${id}`, { method: 'DELETE' }),
};
