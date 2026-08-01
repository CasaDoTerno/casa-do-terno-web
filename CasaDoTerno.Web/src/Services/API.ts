import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5120/api", // troque XXXX pela porta real da sua API
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
