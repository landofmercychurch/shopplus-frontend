// src/pages/BuyerLogin.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext.jsx";
import DOMPurify from "dompurify";
import { ArrowLeft, HelpCircle, Bug, X, Trash2, RefreshCw, Wifi, AlertCircle, Terminal, Shield, Cookie, Key } from "lucide-react";

// ============================================
// MOBILE DEBUG HOOK
// ============================================
const useMobileDebug = () => {
  const [logs, setLogs] = useState([]);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const logsRef = useRef([]);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (!isMobile) return;

    const originalConsole = { log: console.log, error: console.error, warn: console.warn, info: console.info, debug: console.debug };

    const addLog = (type, args) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg))).join(" ");
      const logEntry = { id: Date.now() + Math.random(), timestamp, type, message, color: getLogColor(type) };
      logsRef.current = [logEntry, ...logsRef.current.slice(0, 49)];
      setLogs(logsRef.current);
      originalConsole[type](...args);
    };

    ["log", "error", "warn", "info", "debug"].forEach(method => {
      console[method] = (...args) => addLog(method, args);
    });

    window.addEventListener("unhandledrejection", (e) => addLog("error", ["Unhandled Promise Rejection:", e.reason]));
    window.addEventListener("error", (e) => addLog("error", [`Global Error: ${e.message}`, `File: ${e.filename}`, `Line: ${e.lineno}`]));

    console.log("📱 Mobile Debug System Activated", { 
      platform: navigator.platform, 
      userAgent: navigator.userAgent.substring(0, 50), 
      screen: `${window.screen.width}x${window.screen.height}`, 
      url: window.location.href,
      domain: window.location.hostname,
      isHTTPS: window.location.protocol === "https:"
    });

    // Toggle button
    const debugBtn = document.createElement("button");
    debugBtn.innerHTML = "🐛";
    debugBtn.id = "mobile-debug-toggle";
    debugBtn.style.cssText = "position: fixed; bottom: 80px; right: 20px; width: 50px; height: 50px; background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:white; border-radius:50%; border:none; font-size:24px; z-index:9999; display:flex; align-items:center; justify-content:center; cursor:pointer;";
    debugBtn.onclick = () => setIsDebugVisible(prev => !prev);
    document.body.appendChild(debugBtn);

    return () => {
      Object.keys(originalConsole).forEach(method => (console[method] = originalConsole[method]));
      const btn = document.getElementById("mobile-debug-toggle");
      if (btn) btn.remove();
    };
  }, [isMobile]);

  const getLogColor = (type) => {
    switch (type) {
      case "error": return "bg-red-50 text-red-700 border-l-4 border-red-500";
      case "warn": return "bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500";
      case "info": return "bg-blue-50 text-blue-700 border-l-4 border-blue-500";
      case "debug": return "bg-purple-50 text-purple-700 border-l-4 border-purple-500";
      default: return "bg-gray-50 text-gray-700 border-l-4 border-gray-500";
    }
  };

  const clearLogs = () => { 
    logsRef.current = []; 
    setLogs([]); 
    console.log("🧹 Debug logs cleared"); 
  };

  const DebugPanel = () => {
    if (!isDebugVisible || !isMobile) return null;
    return (
      <div className="fixed inset-0 z-[9998] bg-black bg-opacity-50 flex items-end md:items-center md:justify-center">
        <div className="bg-white w-full md:w-3/4 lg:w-1/2 h-3/4 rounded-t-lg md:rounded-lg shadow-xl flex flex-col">
          <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <Terminal size={24} />
              <div>
                <h3 className="font-bold text-lg">Mobile Debug Console</h3>
                <p className="text-sm opacity-90">{logs.length} logs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearLogs} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full" title="Clear logs"><Trash2 size={20} /></button>
              <button onClick={() => setIsDebugVisible(false)} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"><X size={24} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Terminal size={48} className="mx-auto mb-4 opacity-50" />
                <p>No logs yet.</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`p-3 rounded-lg ${log.color} font-mono text-sm`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{log.type.toUpperCase()}</span>
                        <span className="text-xs opacity-75">{log.timestamp}</span>
                      </div>
                      <pre className="whitespace-pre-wrap break-words overflow-x-auto">{log.message}</pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return { DebugPanel, logs, clearLogs };
};

// ============================================
// BUYER LOGIN COMPONENT - FINAL VERSION
// ============================================
export default function BuyerLogin() {
  const { login } = useBuyerAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cookieStatus, setCookieStatus] = useState("unknown");

  const { DebugPanel } = useMobileDebug();

  // Test cookie functionality on mount
  useEffect(() => {
    const testCookieSupport = () => {
      console.log("🔍 Testing browser cookie support...");
      
      // Check if cookies are enabled
      const cookiesEnabled = navigator.cookieEnabled;
      console.log("🍪 navigator.cookieEnabled:", cookiesEnabled);
      
      // Try to set and read a test cookie
      document.cookie = "shopplus_test=working; path=/; max-age=60; SameSite=None; Secure";
      
      setTimeout(() => {
        const canReadCookie = document.cookie.includes("shopplus_test");
        console.log("✅ Can read test cookie?", canReadCookie);
        console.log("📝 All cookies:", document.cookie);
        
        setCookieStatus(canReadCookie ? "enabled" : "disabled");
        
        if (!canReadCookie) {
          console.warn("⚠️ Cookie support may be disabled in browser settings");
        }
      }, 100);
    };
    
    testCookieSupport();
  }, []);

  // Enhanced login handler with detailed cookie tracking
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    console.log("=".repeat(50));
    console.log("🔐 LOGIN ATTEMPT STARTED");
    console.log("=".repeat(50));
    
    console.log("📝 Initial state:", {
      email: email.substring(0, 3) + "...",
      passwordLength: password.length,
      loading,
      cookieStatus,
      frontendDomain: window.location.hostname,
      isHTTPS: window.location.protocol === "https:",
      cookiesBefore: document.cookie
    });

    const cleanEmail = DOMPurify.sanitize(email.trim());
    const cleanPassword = DOMPurify.sanitize(password);

    if (!cleanEmail || !cleanPassword) { 
      setErrorMsg("Email and password cannot be empty."); 
      return; 
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) { 
      setErrorMsg("Please enter a valid email address."); 
      return; 
    }

    setLoading(true);

    try {
      const startTime = Date.now();
      const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
      
      console.log("📤 Calling context login function...");
      console.log("🔧 Expected cookie behavior:");
      console.log("   - withCredentials: true");
      console.log("   - SameSite: none");
      console.log("   - Secure: true (HTTPS)");
      console.log("   - Domain: .onrender.com");
      console.log("🌐 Backend URL:", API_BASE);
      
      // Intercept fetch to see actual request
      const originalFetch = window.fetch;
      let interceptedRequest = null;
      
      window.fetch = function(url, options = {}) {
        if (url && url.includes('/auth/buyer/login')) {
          interceptedRequest = {
            url,
            method: options.method,
            credentials: options.credentials,
            headers: options.headers,
            mode: options.mode,
            body: options.body ? JSON.parse(options.body) : null
          };
          console.log("🌐 [INTERCEPTED] Login request:", interceptedRequest);
        }
        return originalFetch(url, options);
      };
      
      // Call the login function
      const userData = await login(cleanEmail, cleanPassword);
      
      // Restore original fetch
      window.fetch = originalFetch;
      
      const duration = Date.now() - startTime;
      
      console.log(`⏱️ Login completed in ${duration}ms`);
      console.log("📦 Login response data:", userData);
      
      // Check cookies after login
      setTimeout(() => {
        console.log("🍪 Cookies after login response:", document.cookie);
        
        const hasAccessToken = document.cookie.includes('accessToken');
        const hasRefreshToken = document.cookie.includes('refreshToken');
        
        console.log("✅ Cookie presence check:", {
          accessToken: hasAccessToken ? 'PRESENT 🎉' : 'MISSING ❌',
          refreshToken: hasRefreshToken ? 'PRESENT 🎉' : 'MISSING ❌'
        });
        
        if (!hasAccessToken) {
          console.warn("⚠️ accessToken cookie not found!");
          console.warn("Possible issues:");
          console.warn("1. Backend not setting cookie correctly");
          console.warn("2. Cookie blocked by browser (check SameSite)");
          console.warn("3. Domain mismatch (frontend vs backend)");
        }
      }, 300);
      
      if (userData) {
        console.log("🎉 Login successful! User data:", {
          id: userData.id,
          email: userData.email,
          name: userData.full_name
        });
        
        // Wait a moment for cookies to be processed
        setTimeout(() => {
          console.log("🔄 Redirecting to homepage...");
          navigate("/");
        }, 500);
      } else {
        throw new Error("Login returned no user data");
      }

    } catch (err) {
      console.error("❌ LOGIN ERROR DETAILS:", {
        message: err.message,
        name: err.name,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        stack: err.stack?.split('\n')[0]
      });
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err.message.includes("Network Error") || err.message.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to server. Check your internet connection.";
      } else if (err.message.includes("credentials") || err.message.includes("cookie")) {
        errorMessage = "Authentication failed. Try clearing browser cookies.";
      } else if (err.response?.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (err.response?.status === 403) {
        errorMessage = "Account not authorized as buyer.";
      }
      
      setErrorMsg(errorMessage);
      
      // Run diagnostic tests
      setTimeout(() => {
        runLoginDiagnostics(cleanEmail, cleanPassword);
      }, 1000);
    } finally {
      setLoading(false);
      console.log("=".repeat(50));
      console.log("🏁 LOGIN PROCESS COMPLETED");
      console.log("=".repeat(50));
    }
  };

  // Diagnostic function to identify exact issue
  const runLoginDiagnostics = async (testEmail, testPassword) => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
    
    console.log("🔧 RUNNING LOGIN DIAGNOSTICS");
    
    try {
      // Test 1: Check if backend is reachable
      console.log("1️⃣ Testing backend connectivity...");
      const healthCheck = await fetch(API_BASE, {
        method: "GET",
        mode: "cors"
      }).catch(err => {
        console.error("   ❌ Backend unreachable:", err.message);
        return null;
      });
      
      if (healthCheck) {
        console.log(`   ✅ Backend reachable (${healthCheck.status})`);
      }
      
      // Test 2: Check CORS configuration
      console.log("2️⃣ Testing CORS configuration...");
      const corsTest = await fetch(`${API_BASE}/api/auth/buyer/login`, {
        method: "OPTIONS",
        credentials: "include",
        mode: "cors"
      }).catch(err => {
        console.error("   ❌ CORS preflight failed:", err.message);
        return null;
      });
      
      if (corsTest) {
        console.log("   ✅ CORS preflight successful");
        console.log("   📋 CORS Headers:", {
          allowOrigin: corsTest.headers.get('access-control-allow-origin'),
          allowCredentials: corsTest.headers.get('access-control-allow-credentials')
        });
      }
      
      // Test 3: Direct login attempt with full logging
      console.log("3️⃣ Testing direct login...");
      const loginResponse = await fetch(`${API_BASE}/api/auth/buyer/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      console.log("   📡 Direct login response:", {
        status: loginResponse.status,
        statusText: loginResponse.statusText,
        ok: loginResponse.ok,
        headers: {
          'set-cookie': loginResponse.headers.get('set-cookie'),
          'content-type': loginResponse.headers.get('content-type')
        }
      });
      
      const responseData = await loginResponse.json().catch(() => ({}));
      console.log("   📦 Response data:", responseData);
      
    } catch (error) {
      console.error("❌ Diagnostic failed:", error);
    }
  };

  // Quick cookie test
  const testCookieFlow = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
    
    console.log("🧪 Testing cookie flow with backend...");
    
    try {
      // Clear existing cookies
      document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Set a test cookie from frontend
      document.cookie = "frontend_test_cookie=hello; path=/; max-age=60; SameSite=None; Secure";
      
      // Test if backend receives cookies
      const response = await fetch(`${API_BASE}/api/debug/cookies`, {
        method: "GET",
        credentials: "include",
        mode: "cors"
      });
      
      const data = await response.json();
      console.log("📡 Backend cookie debug:", data);
      
    } catch (error) {
      console.error("❌ Cookie test failed:", error);
    }
  };

  const handleSocialLogin = (provider) => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
    const url = `${API_BASE}/api/auth/buyer/${provider}`;
    
    console.log(`🔗 ${provider} login redirect:`, { url });
    window.location.href = url;
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 p-4">
        <header className="flex justify-between items-center mb-6 bg-white shadow p-3 rounded">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-indigo-600 hover:underline">
            <ArrowLeft size={18} /> Back
          </button>
          
          <div className="flex items-center gap-4">
            {/* Cookie Status Indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              cookieStatus === "enabled" ? "bg-green-100 text-green-700" :
              cookieStatus === "disabled" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              <Cookie size={12} className="inline mr-1" />
              Cookies: {cookieStatus}
            </div>
            
            <button
              onClick={testCookieFlow}
              className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 text-sm"
              title="Test Cookie Flow"
            >
              <Key size={16} /> Test Cookies
            </button>
            
            <Link to="/help-center" className="flex items-center gap-1 text-gray-700 hover:text-indigo-600">
              <HelpCircle size={18} /> Help
            </Link>
          </div>
        </header>

        <div className="max-w-md w-full mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4 text-indigo-600 text-center">Buyer Login</h2>
          
          {/* Cookie Info Banner */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700">HTTP-only Cookies Enabled</p>
                <p className="text-blue-600 text-xs mt-1">
                  Using secure, cross-domain cookies with SameSite=None
                </p>
              </div>
            </div>
          </div>
          
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 font-medium">{errorMsg}</p>
                  <button
                    onClick={() => console.error("Error logged to console")}
                    className="text-xs text-red-600 hover:underline mt-1"
                  >
                    View error details in console
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  console.debug("Email updated:", e.target.value.substring(0, 3) + "...");
                }}
                required
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  console.debug("Password updated, length:", e.target.value.length);
                }}
                required
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-center text-gray-600 mb-4">Or continue with</p>
            <div className="grid grid-cols-3 gap-3">
              {['google', 'apple', 'facebook'].map(provider => (
                <button
                  key={provider}
                  onClick={() => handleSocialLogin(provider)}
                  className="border px-3 py-2 rounded hover:bg-gray-50 text-sm capitalize"
                  disabled={loading}
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Debug Info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Tap the 🐛 button (bottom-right) to see detailed debug logs</p>
          <p className="mt-1">All cookie and network details will be logged there</p>
        </div>
      </div>

      <DebugPanel />
    </>
  );
}