import axios from 'axios';

const TOKEN_KEY = 'token';

function getApiBaseURL() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv;
  // Same-origin `/api` — Vite dev server proxies to the backend (see vite.config.js).
  // Avoids CORS issues when the app is opened at localhost while the API was hard-coded to 127.0.0.1.
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: { 'Content-Type': 'application/json' }
});

/** User-facing message for failed axios calls (network vs API body). */
export function getApiErrorMessage(err, fallback = 'Request failed') {
  const status = err.response?.status;
  // Vite proxy returns 502 when the upstream (Express) is down or refuses the connection.
  if (status === 502 || status === 503 || status === 504) {
    return (
      'API unreachable (bad gateway). Start the backend on port 9001 with MongoDB connected: cd backend && npm run dev. Use the Vite app at http://localhost:9000 so /api proxies correctly. Check backend/.env has MONGO_URI and PORT=9001.'
    );
  }
  const network =
    err.code === 'ERR_NETWORK' ||
    err.code === 'ECONNRESET' ||
    err.message === 'Network Error' ||
    (typeof err.message === 'string' && err.message.includes('Network Error'));
  if (network) {
    return (
      'Cannot reach the server. Run the backend on port 9001 (e.g. npm run dev in backend/) and open the app via the Vite dev server (npm run dev in frontend/) so /api is proxied.'
    );
  }
  const body = err.response?.data;
  const apiText =
    typeof body === 'object' && body !== null && typeof body.error === 'string'
      ? body.error
      : typeof body === 'string'
        ? body
        : null;
  return apiText || err.message || fallback;
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

if (typeof localStorage !== 'undefined') {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) setAuthToken(t);
}

// Auth
export const register = (data) => api.post('/auth/register', data).then((r) => r.data);
export const login = (data) => api.post('/auth/login', data).then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);

// Projects
export const getProjects = () => api.get('/projects').then((r) => r.data);
export const createProject = (data) => api.post('/projects', data).then((r) => r.data);
export const getProject = (id) => api.get(`/projects/${id}`).then((r) => r.data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data).then((r) => r.data);
export const deleteProject = (id) => api.delete(`/projects/${id}`).then((r) => r.data);

// Bids
export const getBids = (params) => api.get('/bids', { params }).then((r) => r.data);
export const createBid = (data) => api.post('/bids', data).then((r) => r.data);
export const acceptBid = (id) => api.put(`/bids/${id}/accept`).then((r) => r.data);
export const rejectBid = (id) => api.put(`/bids/${id}/reject`).then((r) => r.data);
export const deleteBid = (id) => api.delete(`/bids/${id}`).then((r) => r.data);

// Assignments
export const getAssignments = (params) => api.get('/assignments', { params }).then((r) => r.data);
export const createAssignment = (data) => api.post('/assignments', data).then((r) => r.data);
export const updateAssignment = (id, data) => api.put(`/assignments/${id}`, data).then((r) => r.data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`).then((r) => r.data);

// Stage Progress
export const getStageProgress = (params) => api.get('/stage-progress', { params }).then((r) => r.data);
export const createStageProgress = (data) => api.post('/stage-progress', data).then((r) => r.data);

// Milestones
export const getMilestones = (params) => api.get('/milestones', { params }).then((r) => r.data);
export const createMilestone = (data) => api.post('/milestones', data).then((r) => r.data);
export const updateMilestone = (id, data) => api.put(`/milestones/${id}`, data).then((r) => r.data);
export const deleteMilestone = (id) => api.delete(`/milestones/${id}`).then((r) => r.data);

// Payments
export const getPayments = (params) => api.get('/payments', { params }).then((r) => r.data);
export const createPayment = (data) => api.post('/payments', data).then((r) => r.data);
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data).then((r) => r.data);

// Loans
export const initiateLoanApplication = () => api.post('/loans/initiate').then((r) => r.data);
export const submitCustomerDetails = (id, data) => api.post(`/loans/${id}/customer-details`, data).then((r) => r.data);
export const submitIncomeDetails = (id, data) => api.post(`/loans/${id}/income-details`, data).then((r) => r.data);
export const getMyLoanApplications = () => api.get('/loans/my-applications').then((r) => r.data);
export const getLoanApplication = (id) => api.get(`/loans/${id}`).then((r) => r.data);
