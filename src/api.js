import axios from "axios";
import { getDeviceFingerprint } from "./utils/deviceFingerprint";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["x-device-fingerprint"] = getDeviceFingerprint();
  return config;
});

export default api;
