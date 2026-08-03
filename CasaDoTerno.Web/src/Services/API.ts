import axios from "axios";
import.meta.env.VITE_API_URL


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// injeta automaticamente o token de login em toda chamada, se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
