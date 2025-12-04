// src/pages/BuyerLogin.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext.jsx";
import DOMPurify from "dompurify";
import { ArrowLeft, HelpCircle, Bug, X, Trash2, Shield, AlertCircle, Terminal, Cookie, Key, Lock } from "lucide-react";

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
// BUYER LOGIN COMPONENT WITH CSRF PROTECTION
// ============================================
export default function BuyerLogin() {
  const { login } = useBuyerAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [csrfReady, setCsrfReady] = useState(false);
  const [securityStatus, setSecurityStatus] = useState({
    cookies: "checking",
    https: "checking",
    csrf: "checking"
  });

  const { DebugPanel } = useMobileDebug();

  // Initialize security checks and fetch CSRF token
  useEffect(() => {
    const initializeSecurity = async () => {
      console.log("🔐 Initializing security checks...");
      
      // Check HTTPS
      const isHTTPS = window.location.protocol === "https:";
      setSecurityStatus(prev => ({ ...prev, https: isHTTPS ? "secure" : "insecure" }));
      console.log("🔐 HTTPS:", isHTTPS ? "✅ Secure" : "❌ Insecure");
      
      // Check cookies
      const cookiesEnabled = navigator.cookieEnabled;
      setSecurityStatus(prev => ({ ...prev, cookies: cookiesEnabled ? "enabled" : "disabled" }));
      console.log("🍪 Cookies:", cookiesEnabled ? "✅ Enabled" : "❌ Disabled");
      
      // Fetch CSRF token
      await fetchCSRFToken();
    };
    
    initializeSecurity();
  }, []);

  // Fetch CSRF token from backend
  const fetchCSRFToken = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
      console.log("🛡️ Fetching CSRF token from:", `${API_BASE}/csrf-token`);
      
      const response = await fetch(`${API_BASE}/csrf-token`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ CSRF token received");
        setCsrfToken(data.csrfToken);
        setCsrfReady(true);
        setSecurityStatus(prev => ({ ...prev, csrf: "ready" }));
        
        // Store for later use
        localStorage.setItem('csrfToken', data.csrfToken);
        
        // Check if cookie was actually set
        setTimeout(() => {
          const hasCsrfCookie = document.cookie.includes('X-CSRF-TOKEN');
          console.log("🍪 CSRF cookie present?", hasCsrfCookie);
        }, 100);
      } else {
        console.warn("⚠️ CSRF endpoint returned error:", response.status);
        setSecurityStatus(prev => ({ ...prev, csrf: "error" }));
        
        // Try backup endpoint
        await fetchBackupCSRFToken();
      }
    } catch (error) {
      console.error("❌ Failed to fetch CSRF token:", error.message);
      setSecurityStatus(prev => ({ ...prev, csrf: "error" }));
    }
  };

  // Backup CSRF token endpoint
  const fetchBackupCSRFToken = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
      console.log("🛡️ Trying backup CSRF endpoint...");
      
      const response = await fetch(`${API_BASE}/auth/buyer/csrf-token`, {
        method: "GET",
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        setCsrfReady(true);
        setSecurityStatus(prev => ({ ...prev, csrf: "ready" }));
        console.log("✅ Backup CSRF token received");
      }
    } catch (error) {
      console.warn("⚠️ Backup CSRF also failed");
    }
  };

  // Main login handler with CSRF protection
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    console.log("=".repeat(60));
    console.log("🔐 SECURE LOGIN ATTEMPT WITH CSRF PROTECTION");
    console.log("=".repeat(60));
    
    console.log("📊 Security Status:", securityStatus);
    console.log("🔑 CSRF Token:", csrfToken ? "Present" : "Missing");
    console.log("📧 Email:", email.substring(0, 3) + "...");
    
    // Validate inputs
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
      
      // Prepare CSRF token for request
      const tokenToUse = csrfToken || localStorage.getItem('csrfToken') || '';
      console.log("🛡️ Using CSRF token:", tokenToUse ? "Yes" : "No");
      
      // Make login request WITH CSRF protection
      const response = await fetch(`${API_BASE}/auth/buyer/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-Token": tokenToUse // ⭐ CRITICAL: CSRF token in header
        },
        credentials: "include", // ⭐ CRITICAL: For HTTP-only cookies
        mode: "cors",
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword
        })
      });
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ Request completed in ${duration}ms`);
      console.log("📡 Response Status:", response.status, response.statusText);
      
      const data = await response.json();
      console.log("📦 Response Data:", data);
      
      // Handle response
      if (!response.ok) {
        // Check if it's a CSRF error
        if (response.status === 403 && data.error?.includes("CSRF") || data.error?.includes("security token")) {
          console.error("❌ CSRF ERROR: Token invalid or missing");
          setErrorMsg("Security token expired. Please refresh the page and try again.");
          
          // Refresh CSRF token
          await fetchCSRFToken();
        } else {
          throw new Error(data.error || data.message || "Login failed");
        }
      } else {
        console.log("✅ LOGIN SUCCESSFUL with CSRF protection");
        console.log("👤 User:", data.user ? "Received" : "Not in response");
        
        // Check for cookies after successful login
        setTimeout(() => {
          console.log("🍪 Cookies after login:", document.cookie);
          const hasAuthCookies = document.cookie.includes('accessToken') || document.cookie.includes('refreshToken');
          console.log("🔐 Auth cookies present?", hasAuthCookies);
        }, 300);
        
        // Redirect to homepage
        setTimeout(() => {
          console.log("🔄 Redirecting to homepage...");
          navigate("/");
        }, 500);
      }
      
    } catch (err) {
      console.error("❌ LOGIN ERROR:", {
        message: err.message,
        name: err.name,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err.message.includes("Network Error") || err.message.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to server. Please check your internet connection.";
      } else if (err.message.includes("credentials") || err.message.includes("Invalid email")) {
        errorMessage = "Invalid email or password.";
      }
      
      setErrorMsg(errorMessage);
      
    } finally {
      setLoading(false);
      console.log("=".repeat(60));
      console.log("🏁 LOGIN PROCESS COMPLETED");
      console.log("=".repeat(60));
    }
  };

  // Test security features
  const testSecurityFeatures = async () => {
    console.log("🧪 Testing security features...");
    
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
    
    try {
      // Test 1: CSRF token endpoint
      console.log("1️⃣ Testing CSRF token endpoint...");
      const csrfRes = await fetch(`${API_BASE}/csrf-token`, {
        credentials: 'include'
      });
      console.log("   CSRF Endpoint:", csrfRes.status, csrfRes.ok ? "✅ OK" : "❌ Failed");
      
      // Test 2: Check cookies
      console.log("2️⃣ Testing cookie support...");
      document.cookie = "security_test=working; path=/; max-age=60; SameSite=None; Secure";
      setTimeout(() => {
        console.log("   Cookie test:", document.cookie.includes('security_test') ? "✅ Works" : "❌ Failed");
      }, 100);
      
      // Test 3: Backend connectivity
      console.log("3️⃣ Testing backend connectivity...");
      const healthRes = await fetch(API_BASE);
      console.log("   Backend:", healthRes.status, healthRes.ok ? "✅ Reachable" : "❌ Unreachable");
      
    } catch (error) {
      console.error("❌ Security test failed:", error);
    }
  };

  // Handle social login
  const handleSocialLogin = (provider) => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";
    const url = `${API_BASE}/auth/buyer/${provider}`;
    
    console.log(`🔗 ${provider} login redirect:`, { url });
    window.location.href = url;
  };

  // Refresh CSRF token manually
  const refreshCSRFToken = async () => {
    console.log("🔄 Manually refreshing CSRF token...");
    setCsrfReady(false);
    setSecurityStatus(prev => ({ ...prev, csrf: "refreshing" }));
    await fetchCSRFToken();
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 p-4">
        <header className="flex justify-between items-center mb-6 bg-white shadow p-3 rounded">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-indigo-600 hover:underline">
            <ArrowLeft size={18} /> Back
          </button>
          
          <div className="flex items-center gap-3">
            {/* Security Status Indicators */}
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              securityStatus.https === "secure" ? "bg-green-100 text-green-700" :
              securityStatus.https === "insecure" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              <Lock size={12} className="inline mr-1" />
              HTTPS: {securityStatus.https}
            </div>
            
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              securityStatus.csrf === "ready" ? "bg-green-100 text-green-700" :
              securityStatus.csrf === "error" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              <Shield size={12} className="inline mr-1" />
              CSRF: {securityStatus.csrf}
            </div>
            
            <button
              onClick={refreshCSRFToken}
              className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 text-sm"
              title="Refresh Security Token"
              disabled={loading}
            >
              <Key size={16} /> Refresh
            </button>
            
            <Link to="/help-center" className="flex items-center gap-1 text-gray-700 hover:text-indigo-600">
              <HelpCircle size={18} /> Help
            </Link>
          </div>
        </header>

        <div className="max-w-md w-full mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4 text-indigo-600 text-center">Secure Buyer Login</h2>
          
          {/* Security Info Banner */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded">
            <div className="flex items-start gap-2">
              <Shield size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-700">Enterprise-Grade Security</p>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    <span className="text-blue-600">HTTPS Encrypted Connection</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    <span className="text-blue-600">HTTP-Only Cookies (XSS Protected)</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      securityStatus.csrf === "ready" ? "bg-green-500" : "bg-yellow-500"
                    }`}></span>
                    <span className="text-blue-600">CSRF Protection {csrfReady ? "Active" : "Loading..."}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Error Display */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 font-medium">{errorMsg}</p>
                  {errorMsg.includes("Security token") && (
                    <button
                      onClick={refreshCSRFToken}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded mt-1 hover:bg-red-200"
                    >
                      Refresh Security Token
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  console.debug("Email updated:", e.target.value.substring(0, 3) + "...");
                }}
                required
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading || !csrfReady}
                autoComplete="email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  console.debug("Password updated, length:", e.target.value.length);
                }}
                required
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading || !csrfReady}
                autoComplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !csrfReady}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2.5 rounded font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Securely Logging In...
                </>
              ) : !csrfReady ? (
                <>
                  <div className="animate-pulse">🛡️</div>
                  Loading Security...
                </>
              ) : (
                'Secure Login'
              )}
            </button>
          </form>

          {/* Social Login Section */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-center text-gray-600 mb-4">Or continue with</p>
            <div className="grid grid-cols-3 gap-3">
              {['google', 'apple', 'facebook'].map(provider => (
                <button
                  key={provider}
                  onClick={() => handleSocialLogin(provider)}
                  className="border border-gray-300 px-3 py-2 rounded hover:bg-gray-50 text-sm capitalize transition-colors"
                  disabled={loading}
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>

          {/* Signup Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
              Create secure account
            </Link>
          </p>
        </div>

        {/* Security Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Security Status:</span>{" "}
              <span className={
                securityStatus.https === "secure" && securityStatus.csrf === "ready" 
                  ? "text-green-600" 
                  : "text-yellow-600"
              }>
                {securityStatus.https === "secure" && securityStatus.csrf === "ready" 
                  ? "🛡️ Fully Secured" 
                  : "⚠️ Securing..."}
              </span>
            </div>
            <button
              onClick={testSecurityFeatures}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition-colors"
            >
              Test Security
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Tap 🐛 button for detailed security logs
          </p>
        </div>
      </div>

      <DebugPanel />
    </>
  );
}