// src/services/buyerAuthService.js

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';

// ----------------------------
// In-memory storage
// ----------------------------
let currentUser = null;

// ----------------------------
// User management
// ----------------------------
export function setUser(user) {
  currentUser = user;
}

export function getUser() {
  return currentUser;
}

export function clearSession() {
  currentUser = null;
}

// ----------------------------
// Helper: handle JSON response
// ----------------------------
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }
  return data;
}

// ----------------------------
// Login
// ----------------------------
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/buyer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // cookies will be sent
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse(res);

  if (!data.user) throw new Error('Login failed: no user returned');

  setUser(data.user);
  return data.user;
}

// ----------------------------
// Signup
// ----------------------------
export async function signup(payload) {
  const res = await fetch(`${API_BASE}/auth/buyer/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  await handleResponse(res);

  // Auto-login after signup
  return await login(payload.email, payload.password);
}

// ----------------------------
// Logout
// ----------------------------
export async function logout() {
  try {
    const res = await fetch(`${API_BASE}/auth/buyer/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    await handleResponse(res);
  } finally {
    clearSession();
  }
}

// ----------------------------
// Automatic refresh (HTTP-only cookies)
// ----------------------------
async function refreshSession() {
  try {
    const res = await fetch(`${API_BASE}/auth/buyer/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      clearSession();
      throw new Error('Session expired. Please login again.');
    }
  } catch (err) {
    clearSession();
    throw err;
  }
}

// ----------------------------
// Fetch authenticated data
// ----------------------------
export async function fetchWithAuth(endpoint, method = 'GET', body = null) {
  let fetchBody = null;
  const headers = {};

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  } else if (body instanceof FormData) {
    fetchBody = body;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: method !== 'GET' ? fetchBody : null,
    credentials: 'include',
  });

  // Auto-refresh if 401
  if (res.status === 401) {
    await refreshSession(); // refresh HTTP-only cookie
    // Retry original request
    res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: method !== 'GET' ? fetchBody : null,
      credentials: 'include',
    });
  }

  return await handleResponse(res);
}

// ----------------------------
// Fetch current user profile
// ----------------------------
export async function fetchCurrentUser() {
  const data = await fetchWithAuth('/auth/buyer/profile');
  if (data.profile) setUser(data.profile);
  return data.profile;
}

