// src/pages/BuyerLogin.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext.jsx";
import DOMPurify from "dompurify";
import { ArrowLeft, HelpCircle, Bug, X, Trash2, RefreshCw, Wifi, AlertCircle, Terminal, Shield } from "lucide-react";

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
      url: window.location.href 
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

  const testAPIConnection = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
    console.log("🔍 Testing API connection to:", API_BASE);
    
    try {
      const startTime = Date.now();
      
      // Test CORS preflight
      console.log("🛫 Testing CORS preflight...");
      const preflight = await fetch(`${API_BASE}/api/auth/buyer/login`, {
        method: "OPTIONS",
        mode: "cors",
        credentials: "include"
      }).catch(err => {
        console.error("❌ CORS preflight failed:", err.message);
        return null;
      });
      
      if (preflight) {
        console.log("✅ CORS headers:", {
          'access-control-allow-origin': preflight.headers.get('access-control-allow-origin'),
          'access-control-allow-credentials': preflight.headers.get('access-control-allow-credentials'),
          'access-control-allow-methods': preflight.headers.get('access-control-allow-methods')
        });
      }
      
      // Test actual endpoint
      const response = await fetch(`${API_BASE}/api`, {
        method: "GET",
        mode: "cors",
        credentials: "include"
      }).catch(err => {
        console.error("❌ Fetch failed:", err.message);
        return null;
      });
      
      const duration = Date.now() - startTime;
      
      if (response) {
        console.log(`✅ API responded in ${duration}ms`, { 
          status: response.status, 
          ok: response.ok, 
          url: API_BASE,
          cookies: response.headers.get('set-cookie')
        });
      } else {
        console.error("❌ API is not responding");
      }
    } catch (err) { 
      console.error("❌ API test error:", err); 
    }
  };

  const DebugPanel = () => {
    if (!isDebugVisible || !isMobile) return null;
    return (
      <div className="fixed inset-0 z-[9998] bg-black bg-opacity-50 flex items-end md:items-center md:justify-center">
        <div className="bg-white w-full md:w-3/4 lg:w-1/2 h-3/4 rounded-t-lg md:rounded-lg shadow-xl flex flex-col">
          {/* Header */}
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
              <button onClick={testAPIConnection} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full" title="Test API"><RefreshCw size={20} /></button>
              <button onClick={() => setIsDebugVisible(false)} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"><X size={24} /></button>
            </div>
          </div>
          {/* Logs */}
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

  return { DebugPanel, logs, clearLogs, testAPIConnection };
};

// ============================================
// BUYER LOGIN COMPONENT - FIXED FOR HTTP-ONLY COOKIES
// ============================================
export default function BuyerLogin() {
  const { login } = useBuyerAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [corsStatus, setCorsStatus] = useState("unknown");

  const { DebugPanel, testAPIConnection } = useMobileDebug();

  // Test CORS configuration on mount
  useEffect(() => {
    const testCORS = async () => {
      const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
      console.log("🔍 Testing CORS configuration on mount...");
      
      try {
        const response = await fetch(`${API_BASE}/api/auth/buyer/login`, {
          method: "OPTIONS",
          mode: "cors",
          credentials: "include"
        });
        
        const allowOrigin = response.headers.get('access-control-allow-origin');
        const allowCredentials = response.headers.get('access-control-allow-credentials');
        
        console.log("🛫 CORS Configuration:", {
          allowOrigin,
          allowCredentials,
          status: response.status
        });
        
        if (allowOrigin && allowCredentials === "true") {
          setCorsStatus("configured");
          console.log("✅ CORS properly configured for cookies");
        } else {
          setCorsStatus("misconfigured");
          console.warn("⚠️ CORS not properly configured for cookies");
        }
      } catch (error) {
        setCorsStatus("error");
        console.error("❌ CORS test failed:", error);
      }
    };
    
    testCORS();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    console.log("🔐 Login attempt started", { 
      email: email.substring(0, 3) + "...", 
      timestamp: new Date().toISOString(),
      corsStatus 
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
      
      console.log("📤 Calling context login function...");
      console.log("🔧 Credentials mode: withCredentials should be true");
      console.log("🌐 Expected API URL:", import.meta.env.VITE_API_BASE_URL);
      
      // This should use axios with withCredentials: true
      const userData = await login(cleanEmail, cleanPassword);
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Login completed in ${duration}ms`, { 
        success: !!userData,
        user: userData ? { id: userData.id, email: userData.email } : null
      });
      
      // Check cookies after login
      setTimeout(() => {
        console.log("🍪 Cookies after login attempt:", document.cookie);
      }, 100);
      
      // Redirect on success
      if (userData) {
        console.log("🎉 Login successful, redirecting...");
        setTimeout(() => navigate("/"), 300);
      } else {
        throw new Error("Login returned no user data");
      }

    } catch (err) {
      console.error("❌ Login error:", {
        message: err.message,
        name: err.name,
        response: err.response?.data
      });
      
      let errorMessage = err.message || "Login failed. Please try again.";
      
      // Enhanced error detection
      if (err.message.includes("Network Error") || err.message.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to server. Check your internet connection.";
      } else if (err.response?.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (err.response?.status === 0) {
        errorMessage = "Server is not responding. It might be down or blocked by CORS.";
      }
      
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Direct fetch test (bypassing context for debugging)
  const testDirectLogin = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
    const loginURL = `${API_BASE}/api/auth/buyer/login`;
    
    console.log("🧪 Testing direct login fetch...", { 
      url: loginURL,
      withCredentials: true 
    });
    
    try {
      const testEmail = "test@example.com";
      const testPassword = "password123";
      
      const response = await fetch(loginURL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include", // CRITICAL FOR COOKIES
        body: JSON.stringify({ 
          email: testEmail, 
          password: testPassword 
        })
      });
      
      console.log("📡 Direct login response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          'set-cookie': response.headers.get('set-cookie'),
          'access-control-allow-origin': response.headers.get('access-control-allow-origin')
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Direct login successful:", data);
      } else {
        const error = await response.json().catch(() => ({}));
        console.error("❌ Direct login failed:", error);
      }
    } catch (err) {
      console.error("❌ Direct login test error:", err);
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
            {/* CORS Status Indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              corsStatus === "configured" ? "bg-green-100 text-green-700" :
              corsStatus === "misconfigured" ? "bg-yellow-100 text-yellow-700" :
              corsStatus === "error" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              <Shield size={12} className="inline mr-1" />
              CORS: {corsStatus}
            </div>
            
            <button
              onClick={testDirectLogin}
              className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 text-sm"
              title="Test Direct Login"
            >
              <Wifi size={16} /> Test API
            </button>
            
            <Link to="/help-center" className="flex items-center gap-1 text-gray-700 hover:text-indigo-600">
              <HelpCircle size={18} /> Help
            </Link>
          </div>
        </header>

        <div className="max-w-md w-full mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4 text-indigo-600 text-center">Buyer Login</h2>
          
          {/* Cookie Warning */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700">Using HTTP-only Cookies</p>
                <p className="text-blue-600 text-xs mt-1">Cookies are sent automatically with <code>credentials: "include"</code></p>
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
                    onClick={() => console.error("Current error logged:", errorMsg)}
                    className="text-xs text-red-600 hover:underline mt-1"
                  >
                    Log this error
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
                  console.debug("Email changed:", e.target.value.substring(0, 3) + "...");
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
                  console.debug("Password changed, length:", e.target.value.length);
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

        {/* Debug Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Tap the 🐛 button (bottom-right) to open debug console</p>
          <p className="mt-1">All HTTP-only cookie errors will appear there</p>
        </div>
      </div>

      <DebugPanel />
    </>
  );
}