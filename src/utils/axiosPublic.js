//src/utils/axiosPublic.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const axiosPublic = axios.create({
  baseURL: API_BASE_URL,
});

export default axiosPublic;

