// src/pages/BuyerLogin.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext.jsx";
import DOMPurify from "dompurify";
import { ArrowLeft, HelpCircle, Bug, X, Trash2, RefreshCw, Wifi, AlertCircle, Terminal } from "lucide-react";

// ============================================
// SIMPLE MOBILE DEBUG SYSTEM (useEffect Level)
// ============================================
const useMobileDebug = () => {
  const [logs, setLogs] = useState([]);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const logsRef = useRef([]);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (!isMobile) return;

    // Store original console methods
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Custom log function
    const addLog = (type, args) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      const logEntry = {
        id: Date.now() + Math.random(),
        timestamp,
        type,
        message,
        color: getLogColor(type)
      };

      logsRef.current = [logEntry, ...logsRef.current.slice(0, 49)];
      setLogs(logsRef.current);

      // Call original console
      originalConsole[type](...args);
    };

    // Override console methods
    console.log = (...args) => addLog('log', args);
    console.error = (...args) => addLog('error', args);
    console.warn = (...args) => addLog('warn', args);
    console.info = (...args) => addLog('info', args);
    console.debug = (...args) => addLog('debug', args);

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      addLog('error', ['Unhandled Promise Rejection:', event.reason]);
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      addLog('error', [`Global Error: ${event.message}`, `File: ${event.filename}`, `Line: ${event.lineno}`]);
    });

    // Log initial debug info
    console.log('📱 Mobile Debug System Activated', {
      platform: navigator.platform,
      userAgent: navigator.userAgent.substring(0, 50),
      isIOS,
      isMobile,
      screen: `${window.screen.width}x${window.screen.height}`,
      url: window.location.href
    });

    // Test API connection
    testAPIConnection();

    // Add debug toggle button to DOM
    const debugBtn = document.createElement('button');
    debugBtn.innerHTML = '🐛';
    debugBtn.id = 'mobile-debug-toggle';
    debugBtn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      border: none;
      font-size: 24px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;
    debugBtn.onclick = () => setIsDebugVisible(prev => !prev);
    document.body.appendChild(debugBtn);

    return () => {
      // Restore original console
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;

      // Remove button
      const btn = document.getElementById('mobile-debug-toggle');
      if (btn) btn.remove();
    };
  }, [isMobile]);

  const testAPIConnection = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    console.log('🔍 Testing API connection to:', API_BASE);

    try {
      // Simple fetch test
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/api/health` || `${API_BASE}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      }).catch(err => {
        console.error('❌ Fetch failed:', err.message);
        return null;
      });

      const duration = Date.now() - startTime;

      if (response) {
        console.log(`✅ API responded in ${duration}ms`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: API_BASE
        });
      } else {
        console.error('❌ API is not responding');
      }
    } catch (err) {
      console.error('❌ API test error:', err);
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'bg-red-50 text-red-700 border-l-4 border-red-500';
      case 'warn': return 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500';
      case 'info': return 'bg-blue-50 text-blue-700 border-l-4 border-blue-500';
      case 'debug': return 'bg-purple-50 text-purple-700 border-l-4 border-purple-500';
      default: return 'bg-gray-50 text-gray-700 border-l-4 border-gray-500';
    }
  };

  const clearLogs = () => {
    logsRef.current = [];
    setLogs([]);
    console.log('🧹 Debug logs cleared');
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
                <p className="text-sm opacity-90">{isIOS ? 'iOS' : 'Android'} | {logs.length} logs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearLogs}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                title="Clear logs"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={testAPIConnection}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                title="Test API"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={() => setIsDebugVisible(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Logs Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Terminal size={48} className="mx-auto mb-4 opacity-50" />
                <p>No logs yet. Interact with your app to see logs here.</p>
                <button
                  onClick={() => console.log('Test log message')}
                  className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg"
                >
                  Generate Test Log
                </button>
              </div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg ${log.color} font-mono text-sm`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{log.type.toUpperCase()}</span>
                        <span className="text-xs opacity-75">{log.timestamp}</span>
                      </div>
                      <pre className="whitespace-pre-wrap break-words overflow-x-auto">
                        {log.message}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t p-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => console.log('Test info log:', new Date().toISOString())}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
              >
                Log Info
              </button>
              <button
                onClick={() => console.error('Test error for debugging')}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
              >
                Log Error
              </button>
              <button
                onClick={() => {
                  const API_BASE = import.meta.env.VITE_API_BASE_URL;
                  console.log('API Base URL:', API_BASE);
                  console.log('Environment:', import.meta.env.MODE);
                }}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium col-span-2"
              >
                Show Env Vars
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return {
    DebugPanel,
    isDebugVisible,
    setIsDebugVisible,
    logs,
    clearLogs,
    testAPIConnection
  };
};

// ============================================
// MAIN BUYER LOGIN COMPONENT
// ============================================
export default function BuyerLogin() {
  const { login } = useBuyerAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Initialize mobile debug
  const { DebugPanel } = useMobileDebug();

  // Enhanced login handler with detailed debugging
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    console.log('🔐 Login attempt started', { 
      email: email.substring(0, 3) + '...',
      timestamp: new Date().toISOString() 
    });

    // Sanitize inputs
    const cleanEmail = DOMPurify.sanitize(email.trim());
    const cleanPassword = DOMPurify.sanitize(password);

    console.debug('Input sanitization:', {
      originalEmail: email,
      cleanEmail,
      passwordLength: password.length,
      cleanPasswordLength: cleanPassword.length
    });

    // Validation
    if (!cleanEmail || !cleanPassword) {
      const error = "Email and password cannot be empty.";
      console.error('❌ Validation failed:', error);
      setErrorMsg(error);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      const error = "Please enter a valid email address.";
      console.error('❌ Invalid email format:', cleanEmail);
      setErrorMsg(error);
      return;
    }

    setLoading(true);
    console.log('⏳ Login in progress...');

    // Add timeout detection
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Login taking longer than expected (10s)');
        console.log('Checking network status...');
        
        // Test network
        fetch('https://api.ipify.org?format=json')
          .then(res => console.log('Network test:', res.ok ? 'Online' : 'Offline'))
          .catch(err => console.error('Network error:', err));
      }
    }, 10000);

    try {
      console.log('📤 Calling login function...');
      console.debug('Context login function type:', typeof login);
      
      const startTime = Date.now();
      
      // IMPORTANT: Wrap login in Promise to catch all errors
      const loginPromise = Promise.resolve(login(cleanEmail, cleanPassword));
      const data = await loginPromise;
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Login completed in ${duration}ms`);
      console.debug('Login response:', data);

      if (!data) {
        throw new Error('Login returned empty response');
      }

      // Check for error in response
      if (data.error) {
        throw new Error(data.error);
      }

      // Success - redirect
      console.log('🎉 Login successful! Redirecting...');
      setTimeout(() => {
        navigate("/");
      }, 100);

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('❌ Login error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack?.split('\n')[0]
      });

      // Enhanced error messages
      let errorMessage = "Login failed. Please try again.";
      
      if (err.message.includes('Network') || err.message.includes('fetch')) {
        errorMessage = "Network error. Check your connection and try again.";
        console.error('🌐 Network issue detected');
      } else if (err.message.includes('Invalid credentials') || err.message.includes('password')) {
        errorMessage = "Invalid email or password.";
      } else if (err.message.includes('User not found')) {
        errorMessage = "No account found with this email.";
      } else if (err.message.includes('timeout')) {
        errorMessage = "Request timed out. Server might be busy.";
      } else if (err.message.includes('CORS')) {
        errorMessage = "CORS error. Contact support.";
        console.error('⚠️ CORS issue - check backend configuration');
      }

      setErrorMsg(errorMessage);
      console.log('Error shown to user:', errorMessage);
      
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      console.log('🏁 Login process finished');
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`🔗 ${provider} login clicked`);
    
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000/api";
    const url = `${API_BASE}/auth/buyer/${provider}`;
    
    console.debug('Social login redirect:', { provider, url });
    window.location.href = url;
  };

  // Test backend connection
  const testBackend = async () => {
    console.log('🧪 Testing backend connection...');
    
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(API_BASE, { 
        method: 'GET',
        mode: 'cors'
      }).catch(err => {
        console.error('❌ Fetch failed:', err);
        return null;
      });

      if (response) {
        console.log('✅ Backend reached:', {
          status: response.status,
          statusText: response.statusText,
          url: API_BASE
        });
      } else {
        console.error('❌ Backend not reachable');
      }
    } catch (err) {
      console.error('❌ Test failed:', err);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 p-4">
        <header className="flex justify-between items-center mb-6 bg-white shadow p-3 rounded">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-indigo-600 hover:underline"
          >
            <ArrowLeft size={18} /> Back
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={testBackend}
              className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 text-sm"
              title="Test Backend"
            >
              <Wifi size={16} /> Test API
            </button>
            
            <button
              onClick={() => console.log('🔧 Debug info:', { 
                email, 
                loading, 
                errorMsg,
                env: import.meta.env.MODE,
                apiBase: import.meta.env.VITE_API_BASE_URL 
              })}
              className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 text-sm"
            >
              <Bug size={16} /> Debug
            </button>
            
            <Link 
              to="/help-center"
              className="flex items-center gap-1 text-gray-700 hover:text-indigo-600"
            >
              <HelpCircle size={18} /> Help
            </Link>
          </div>
        </header>

        <div className="max-w-md w-full mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4 text-indigo-600 text-center">Buyer Login</h2>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 font-medium">{errorMsg}</p>
                  <button
                    onClick={() => console.error('Current error:', errorMsg)}
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  console.debug('Email changed:', e.target.value.substring(0, 3) + '...');
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  console.debug('Password changed, length:', e.target.value.length);
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

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Tap the 🐛 button (bottom-right) to open debug console</p>
          <p className="mt-1">All errors will appear there</p>
        </div>
      </div>

      {/* Mobile Debug Panel */}
      <DebugPanel />
    </>
  );
} 