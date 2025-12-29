// frontend: src/lib/api.js
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const authHeader = () => {
  const raw = localStorage.getItem("user"); // adapt: store token object after login
  if (!raw) return {};
  try {
    const user = JSON.parse(raw);
    if (user?.token) return { Authorization: `Bearer ${user.token}` };
  } catch (e) {}
  return {};
};

export const lcaAPI = {
  // authentication
  register: (data) => axios.post(`${API}/auth/register`, data).then(r => r.data),
  login: (data) => axios.post(`${API}/auth/login`, data).then(r => r.data),

  // analysis (protected)
  analyze: (data) => axios.post(`${API}/api/analyze`, data, { headers: authHeader() }).then(r => r.data),
  aiAssist: (data) => axios.post(`${API}/api/ai-assist`, data, { headers: authHeader() }).then(r => r.data),

  // user results
  getResults: () => axios.get(`${API}/api/results`, { headers: authHeader() }).then(r => r.data),

  // compare + report
  compare: (body) => axios.post(`${API}/api/compare`, body, { headers: authHeader() }).then(r => r.data),
  generateReport: (body) => axios.post(`${API}/api/report`, body, { headers: authHeader() }).then(r => r.data),
};
