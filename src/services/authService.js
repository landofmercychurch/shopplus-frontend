// src/services/authService.js

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';

// ----------------------------
// In-memory storage
// ----------------------------
let accessToken = null;
let currentUser = null;

// ----------------------------
// Token & User Management
// ----------------------------
export function setToken(token) {
  accessToken = token;
}

export function getToken() {
  return accessToken;
}

export function clearSession() {
  accessToken = null;
  currentUser = null;
}

export function setUser(user) {
  currentUser = user;
}

export function getUser() {
  return currentUser;
}

// ----------------------------
// Refresh Access Token (Rehydration)
// ----------------------------
export async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // Send HttpOnly cookie
  });

  if (!res.ok) {
    clearSession();
    throw new Error('Failed to refresh access token');
  }

  const data = await res.json();
  if (!data.token) {
    clearSession();
    throw new Error('Invalid refresh response from server');
  }

  setToken(data.token);
  return data.token;
}

// ----------------------------
// Ensure Valid Access Token
// ----------------------------
export async function getValidToken() {
  if (!accessToken) {
    // Try refreshing if token is missing (rehydration step)
    return await refreshAccessToken();
  }
  return accessToken;
}

// ----------------------------
// Authenticated Fetch Wrapper
// ----------------------------
export async function fetchWithAuth(endpoint, method = 'GET', body = null) {
  let token = await getValidToken();

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  let fetchBody = null;
  if (body) {
    if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    fetchBody = body instanceof FormData ? body : JSON.stringify(body);
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: method !== 'GET' ? fetchBody : null,
    credentials: 'include', // Send cookies
  });

  // Retry once on 401 (expired token)
  if (res.status === 401) {
    try {
      token = await refreshAccessToken();
      headers.Authorization = `Bearer ${token}`;

      res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: method !== 'GET' ? fetchBody : null,
        credentials: 'include',
      });
    } catch (err) {
      clearSession();
      throw new Error('Session expired. Please login again.');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }

  return data;
}

