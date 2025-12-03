// services/sellerAuthService.js - UPDATED (Pure HttpOnly Cookies, NO localStorage)
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000/api";
const SELLER_AUTH = `${API_BASE}/auth/seller`;

let currentUser = null;

console.log('[sellerAuthService] Initialized with API_BASE:', API_BASE);

// ----------------------------
// User state (in-memory only)
// ----------------------------
export function setUser(user) {
  console.log('[sellerAuthService] setUser called:', user ? `User ${user.id}` : 'null');
  currentUser = user;
}

export function getUser() {
  console.log('[sellerAuthService] getUser called, current user:', currentUser ? 'exists' : 'null');
  return currentUser;
}

export function clearSession() {
  console.log('[sellerAuthService] clearSession called');
  currentUser = null;
  // Note: HttpOnly cookies can only be cleared by the server
  // They will be cleared when server sets them to expire
}

// ----------------------------
// JSON response helper
// ----------------------------
async function handleResponse(res) {
  console.log('[sellerAuthService] handleResponse status:', res.status, res.statusText);
  
  try {
    const data = await res.json();
    console.log('[sellerAuthService] Response data:', data);
    
    if (!res.ok) {
      const error = new Error(data.message || data.error || `API request failed with status ${res.status}`);
      error.status = res.status;
      error.response = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[sellerAuthService] handleResponse error:', error);
    throw error;
  }
}

// ----------------------------
// Login
// ----------------------------
export async function login(email, password) {
  console.log('[sellerAuthService] login called for:', email ? `${email.substring(0, 3)}...` : 'empty');
  
  const res = await fetch(`${SELLER_AUTH}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // HttpOnly cookies are sent automatically
    body: JSON.stringify({ email, password }),
  });

  console.log('[sellerAuthService] Login response status:', res.status);
  
  const data = await handleResponse(res);
  if (!data.user) throw new Error("Login failed: no user returned");

  console.log('[sellerAuthService] Login successful, user:', data.user.id);
  setUser(data.user);
  return data.user;
}

// ----------------------------
// Signup
// ----------------------------
export async function signup(payload) {
  console.log('[sellerAuthService] signup called');
  
  await fetch(`${SELLER_AUTH}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  }).then(handleResponse);

  console.log('[sellerAuthService] Signup successful, auto-logging in');
  return await login(payload.email, payload.password);
}

// ----------------------------
// Logout
// ----------------------------
export async function logout() {
  console.log('[sellerAuthService] logout called');
  
  try {
    const res = await fetch(`${SELLER_AUTH}/logout`, { 
      method: "POST", 
      credentials: "include" 
    });
    console.log('[sellerAuthService] Logout response status:', res.status);
  } catch (error) {
    console.warn('[sellerAuthService] Logout API call failed:', error.message);
  } finally {
    clearSession();
    console.log('[sellerAuthService] Session cleared locally');
  }
}

// ----------------------------
// Refresh session if cookie expired
// ----------------------------
async function refreshSession() {
  console.log('[sellerAuthService] refreshSession called');
  
  const res = await fetch(`${SELLER_AUTH}/refresh`, { 
    method: "POST", 
    credentials: "include" 
  });
  
  console.log('[sellerAuthService] Refresh response status:', res.status);
  
  if (!res.ok) {
    console.log('[sellerAuthService] Refresh failed, clearing session');
    clearSession();
    throw new Error("Session expired. Please login again.");
  }
  
  console.log('[sellerAuthService] Refresh successful');
  return true;
}

// ----------------------------
// Authenticated fetch
// ----------------------------
export async function fetchWithAuth(endpoint, method = "GET", body = null) {
  console.log('[sellerAuthService] fetchWithAuth called:', { endpoint, method });
  
  const headers = {};
  let fetchBody = null;

  // Set content type for JSON, but not for FormData
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    fetchBody = JSON.stringify(body);
  } else if (body instanceof FormData) {
    // FormData sets its own content-type with boundary
    fetchBody = body;
  }

  console.log('[sellerAuthService] Making request with credentials');
  
  let res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: method !== "GET" && method !== "HEAD" ? fetchBody : null,
    credentials: "include", // HttpOnly cookies sent here
  });

  console.log('[sellerAuthService] Response status:', res.status, res.statusText);

  // Handle 401 Unauthorized - try to refresh session
  if (res.status === 401) {
    console.log('[sellerAuthService] 401 detected, attempting refresh');
    
    try {
      await refreshSession();
      
      console.log('[sellerAuthService] Retrying original request after refresh');
      res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: method !== "GET" && method !== "HEAD" ? fetchBody : null,
        credentials: "include",
      });
      
      console.log('[sellerAuthService] Retry response status:', res.status);
    } catch (refreshError) {
      console.error('[sellerAuthService] Refresh failed, throwing error:', refreshError.message);
      // Re-throw the original error or refresh error
      throw new Error("Authentication failed. Please login again.");
    }
  }

  return await handleResponse(res);
}

// ----------------------------
// Fetch current seller profile
// ----------------------------
export async function fetchCurrentUser() {
  console.log('[sellerAuthService] fetchCurrentUser called');
  
  try {
    const data = await fetchWithAuth("/auth/seller/me");
    if (data.user) {
      console.log('[sellerAuthService] User fetched:', data.user.id);
      setUser(data.user);
    } else {
      console.warn('[sellerAuthService] No user in response');
    }
    return data.user;
  } catch (error) {
    console.error('[sellerAuthService] fetchCurrentUser failed:', error.message);
    throw error;
  }
}

// ----------------------------
// Test endpoint (for debugging)
// ----------------------------
export async function testConnection() {
  console.log('[sellerAuthService] Testing connection...');
  
  try {
    const res = await fetch(`${API_BASE}/health`, {
      credentials: "include",
    });
    console.log('[sellerAuthService] Connection test status:', res.status);
    return res.ok;
  } catch (error) {
    console.error('[sellerAuthService] Connection test failed:', error);
    return false;
  }
}
