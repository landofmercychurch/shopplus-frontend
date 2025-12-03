// src/pages/BuyerLogin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext.jsx";
import DOMPurify from "dompurify";
import { ArrowLeft, HelpCircle, Bug, X, Trash2, AlertCircle, CheckCircle } from "lucide-react";

// ============================================
// DEBUG CONSOLE SYSTEM - ENHANCED VERSION
// ============================================
class DebugConsole {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.listeners = [];
    this.isIntercepted = false;
    this.panel = null;
    this.logContainer = null;
    this.isVisible = false;
    this.requestTimeouts = new Map(); // Track timeouts for requests
  }

  init() {
    if (this.isIntercepted) return;
    
    this.interceptConsole();
    this.createPanel();
    this.isIntercepted = true;
    
    this.log('info', '🔧 Debug Console initialized');
  }

  interceptConsole() {
    const methods = ['log', 'error', 'warn', 'info', 'debug'];
    
    methods.forEach(method => {
      const original = console[method];
      console[method] = (...args) => {
        this.addLog(method, ...args);
        original.apply(console, args);
      };
    });

    // Also intercept fetch/XHR requests
    this.interceptFetch();
  }

  interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const requestId = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
      
      this.addLog('info', `📡 Fetch Request [${requestId}]: ${url}`, args[1] || {});
      
      const startTime = Date.now();
      this.requestTimeouts.set(requestId, setTimeout(() => {
        this.addLog('warn', `⏰ Request [${requestId}] taking too long (>5s): ${url}`);
      }, 5000));

      return originalFetch(...args)
        .then(response => {
          clearTimeout(this.requestTimeouts.get(requestId));
          this.requestTimeouts.delete(requestId);
          const duration = Date.now() - startTime;
          this.addLog('info', `✅ Request [${requestId}] completed in ${duration}ms`, {
            status: response.status,
            ok: response.ok
          });
          return response;
        })
        .catch(error => {
          clearTimeout(this.requestTimeouts.get(requestId));
          this.requestTimeouts.delete(requestId);
          const duration = Date.now() - startTime;
          this.addLog('error', `❌ Request [${requestId}] failed after ${duration}ms:`, error);
          throw error;
        });
    };
  }

  addLog(level, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
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
      level,
      message,
      color: this.getLevelColor(level)
    };

    this.logs.unshift(logEntry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.updatePanel();
    this.listeners.forEach(listener => listener(logEntry));
  }

  log(level, ...args) {
    this.addLog(level, ...args);
  }

  error(...args) {
    this.addLog('error', ...args);
  }

  warn(...args) {
    this.addLog('warn', ...args);
  }

  info(...args) {
    this.addLog('info', ...args);
  }

  debug(...args) {
    this.addLog('debug', ...args);
  }

  trackLoginEvent(event, data = {}) {
    this.addLog('info', `🔑 LOGIN EVENT: ${event}`, data);
  }

  trackAPIRequest(apiName, requestData = {}) {
    const requestId = Date.now();
    this.addLog('info', `📤 API Request [${requestId}]: ${apiName}`, requestData);
    return requestId;
  }

  trackAPIResponse(requestId, responseData = {}, success = true) {
    const status = success ? '✅' : '❌';
    this.addLog(success ? 'info' : 'error', 
      `${status} API Response [${requestId}]`, responseData);
  }

  getLevelColor(level) {
    const colors = {
      error: 'text-red-600 bg-red-50',
      warn: 'text-yellow-600 bg-yellow-50',
      info: 'text-blue-600 bg-blue-50',
      log: 'text-gray-800',
      debug: 'text-purple-600 bg-purple-50'
    };
    return colors[level] || 'text-gray-800';
  }

  createPanel() {
    if (this.panel) return;

    this.panel = document.createElement('div');
    this.panel.id = 'debug-console-panel';
    this.panel.className = 'fixed bottom-4 right-4 w-96 max-w-full max-h-96 bg-white rounded-lg shadow-xl border border-gray-300 z-50 flex flex-col hidden';
    
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-3 border-b bg-gray-50 rounded-t-lg';
    
    const title = document.createElement('div');
    title.className = 'flex items-center gap-2 font-semibold text-gray-800';
    title.innerHTML = '<Bug size={16} /> Debug Console';
    
    const controls = document.createElement('div');
    controls.className = 'flex items-center gap-2';
    
    const clearBtn = document.createElement('button');
    clearBtn.innerHTML = '<Trash2 size={14} />';
    clearBtn.className = 'p-1 hover:bg-gray-200 rounded';
    clearBtn.title = 'Clear logs';
    clearBtn.onclick = () => this.clear();
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<X size={16} />';
    closeBtn.className = 'p-1 hover:bg-gray-200 rounded';
    closeBtn.title = 'Close panel';
    closeBtn.onclick = () => this.hide();
    
    controls.appendChild(clearBtn);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);
    
    this.logContainer = document.createElement('div');
    this.logContainer.className = 'flex-1 overflow-y-auto p-3 font-mono text-sm space-y-1';
    this.logContainer.style.maxHeight = '300px';
    
    const footer = document.createElement('div');
    footer.className = 'p-2 border-t text-xs text-gray-500 text-center';
    footer.id = 'debug-console-stats';
    
    this.panel.appendChild(header);
    this.panel.appendChild(this.logContainer);
    this.panel.appendChild(footer);
    
    document.body.appendChild(this.panel);
  }

  updatePanel() {
    if (!this.logContainer) return;
    
    this.logContainer.innerHTML = '';
    
    this.logs.forEach(log => {
      const logElement = document.createElement('div');
      logElement.className = `p-2 rounded mb-1 ${log.color}`;
      logElement.innerHTML = `
        <div class="flex items-start gap-2">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-gray-500 text-xs font-medium">[${log.timestamp}]</span>
              <span class="font-bold ${this.getLevelTextColor(log.level)}">${log.level.toUpperCase()}</span>
            </div>
            <div class="mt-1 whitespace-pre-wrap break-words">${log.message}</div>
          </div>
        </div>
      `;
      this.logContainer.appendChild(logElement);
    });
    
    const stats = document.getElementById('debug-console-stats');
    if (stats) {
      const errorCount = this.logs.filter(l => l.level === 'error').length;
      const warnCount = this.logs.filter(l => l.level === 'warn').length;
      stats.textContent = `${this.logs.length} logs | ${errorCount} errors | ${warnCount} warnings`;
    }
  }

  getLevelTextColor(level) {
    const colors = {
      error: 'text-red-700',
      warn: 'text-yellow-700',
      info: 'text-blue-700',
      debug: 'text-purple-700'
    };
    return colors[level] || 'text-gray-700';
  }

  toggle() {
    this.isVisible = !this.isVisible;
    if (this.panel) {
      this.panel.classList.toggle('hidden', !this.isVisible);
    }
  }

  show() {
    this.isVisible = true;
    if (this.panel) {
      this.panel.classList.remove('hidden');
    }
  }

  hide() {
    this.isVisible = false;
    if (this.panel) {
      this.panel.classList.add('hidden');
    }
  }

  clear() {
    this.logs = [];
    this.updatePanel();
    this.addLog('info', '🧹 Console cleared');
  }
}

// Global instance
const debugConsole = new DebugConsole();

// Initialize
if (typeof window !== 'undefined') {
  window.__debugConsole = debugConsole;
}

// ============================================
// MAIN COMPONENT WITH ENHANCED DEBUGGING
// ============================================
export default function BuyerLogin() {
  const { login } = useBuyerAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loginStatus, setLoginStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    debugConsole.init();
    debugConsole.trackLoginEvent('Login page loaded');
    
    // Check if context is available
    try {
      debugConsole.debug('useBuyerAuth context:', { 
        login: typeof login,
        contextAvailable: !!login
      });
    } catch (err) {
      debugConsole.error('❌ Context error:', err);
    }

    // Add debug toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '🐛';
    toggleBtn.className = 'fixed bottom-4 left-4 w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-lg z-40 hover:bg-indigo-700 transition-colors';
    toggleBtn.title = 'Toggle Debug Console';
    toggleBtn.onclick = () => debugConsole.toggle();
    toggleBtn.id = 'debug-toggle-btn';
    
    if (!document.getElementById('debug-toggle-btn')) {
      document.body.appendChild(toggleBtn);
    }

    // Add status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'login-status-indicator';
    statusIndicator.className = 'fixed top-4 right-4 z-40';
    document.body.appendChild(statusIndicator);

    return () => {
      const btn = document.getElementById('debug-toggle-btn');
      const indicator = document.getElementById('login-status-indicator');
      if (btn) btn.remove();
      if (indicator) indicator.remove();
    };
  }, []);

  // Update status indicator
  useEffect(() => {
    const indicator = document.getElementById('login-status-indicator');
    if (!indicator) return;

    const statusConfig = {
      idle: { text: 'Ready', color: 'bg-gray-500', icon: '⏳' },
      loading: { text: 'Logging in...', color: 'bg-blue-500', icon: '⏳' },
      success: { text: 'Logged in!', color: 'bg-green-500', icon: '✅' },
      error: { text: 'Login failed', color: 'bg-red-500', icon: '❌' }
    };

    const config = statusConfig[loginStatus] || statusConfig.idle;
    indicator.innerHTML = `
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg shadow ${config.color} text-white text-sm font-medium">
        <span>${config.icon}</span>
        <span>${config.text}</span>
      </div>
    `;
  }, [loginStatus]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoginStatus('loading');
    
    const loginRequestId = debugConsole.trackAPIRequest('Buyer Login', {
      email: email.substring(0, 3) + '...',
      timestamp: new Date().toISOString()
    });

    debugConsole.info('🔄 Starting login process...');
    debugConsole.debug('Form data:', {
      emailLength: email.length,
      passwordLength: password.length,
      loading,
      errorMsg
    });

    // Sanitize inputs
    const cleanEmail = DOMPurify.sanitize(email.trim());
    const cleanPassword = DOMPurify.sanitize(password);

    debugConsole.debug('Sanitized:', {
      cleanEmail: cleanEmail ? `${cleanEmail.substring(0, 3)}...` : 'empty',
      cleanPasswordLength: cleanPassword ? cleanPassword.length : 0
    });

    if (!cleanEmail || !cleanPassword) {
      const error = "Email and password cannot be empty.";
      debugConsole.trackAPIResponse(loginRequestId, { error }, false);
      debugConsole.error('❌ Validation failed:', error);
      setErrorMsg(error);
      setLoginStatus('error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      const error = "Please enter a valid email address.";
      debugConsole.trackAPIResponse(loginRequestId, { error }, false);
      debugConsole.error('❌ Invalid email format');
      setErrorMsg(error);
      setLoginStatus('error');
      return;
    }

    setLoading(true);
    
    // Set a timeout to detect hanging requests
    const timeoutId = setTimeout(() => {
      if (loading) {
        debugConsole.warn('⚠️ Login request taking too long (>10 seconds)');
        debugConsole.trackAPIResponse(loginRequestId, { 
          status: 'timeout',
          message: 'Request timed out after 10 seconds'
        }, false);
        
        setErrorMsg("Login request is taking too long. Please check your connection.");
        setLoginStatus('error');
        setLoading(false);
      }
    }, 10000);

    try {
      debugConsole.info('📤 Calling login function from context...');
      debugConsole.debug('Context login function:', typeof login);
      
      // Log the actual API endpoint being called
      const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000/api";
      debugConsole.info('🌐 API Base URL:', API_BASE);
      
      const startTime = Date.now();
      debugConsole.info('⏱️ Login request started at:', new Date(startTime).toLocaleTimeString());

      // Call the login function
      const data = await login(cleanEmail, cleanPassword);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      debugConsole.info(`✅ Login completed in ${duration}ms`);
      debugConsole.trackAPIResponse(loginRequestId, {
        success: true,
        duration: `${duration}ms`,
        hasData: !!data,
        dataType: typeof data
      }, true);
      
      debugConsole.debug('Login response data:', data);
      
      // Check if login was successful
      if (data && (data.success || data.token || data.user)) {
        debugConsole.info('🎉 Login successful! Redirecting...');
        debugConsole.trackLoginEvent('Login successful', {
          email: cleanEmail.substring(0, 3) + '...',
          timestamp: new Date().toISOString()
        });
        
        setLoginStatus('success');
        
        // Small delay to show success state
        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        throw new Error(data?.message || "Login failed: Invalid response");
      }
      
    } catch (err) {
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      debugConsole.error(`❌ Login failed after ${duration}ms:`, err);
      debugConsole.trackAPIResponse(loginRequestId, {
        error: err.message,
        type: err.name,
        duration: `${duration}ms`,
        stack: err.stack
      }, false);
      
      debugConsole.trackLoginEvent('Login failed', {
        error: err.message,
        email: cleanEmail.substring(0, 3) + '...'
      });
      
      let errorMessage = "Login failed. Please try again.";
      
      // Provide more specific error messages
      if (err.message.includes('Network Error') || err.message.includes('Failed to fetch')) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.message.includes('timeout')) {
        errorMessage = "Request timed out. Server might be slow or unreachable.";
      } else if (err.message.includes('Invalid credentials')) {
        errorMessage = "Invalid email or password.";
      } else if (err.message.includes('User not found')) {
        errorMessage = "No account found with this email.";
      }
      
      setErrorMsg(errorMessage);
      setLoginStatus('error');
      
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      debugConsole.info('🏁 Login process completed');
    }
  };

  const handleSocialLogin = (provider) => {
    debugConsole.info(`🔗 ${provider} login clicked`);
    debugConsole.trackLoginEvent('Social login initiated', { provider });
    
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000/api";
    debugConsole.debug('Social login endpoint:', `${API_BASE}/auth/buyer/${provider}`);
    
    window.location.href = `${API_BASE}/auth/buyer/${provider}`;
  };

  const testLoginFunction = async () => {
    debugConsole.info('🧪 Testing login function...');
    
    try {
      // Test if login function exists and is callable
      debugConsole.debug('Testing login function type:', typeof login);
      
      if (typeof login !== 'function') {
        throw new Error('login is not a function');
      }
      
      // Try a mock call to see if it throws
      debugConsole.info('Testing login function signature...');
      
    } catch (err) {
      debugConsole.error('❌ Login function test failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-4">
      <header className="flex justify-between items-center mb-6 bg-white shadow p-3 rounded">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-indigo-600 hover:underline"
        >
          <ArrowLeft size={18} /> Back
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={testLoginFunction}
            className="flex items-center gap-1 text-gray-700 hover:text-indigo-600 text-sm"
            title="Test Login Function"
          >
            <Bug size={16} /> Test
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

        {/* Connection Status */}
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {loginStatus === 'loading' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              )}
              {loginStatus === 'error' && <AlertCircle size={16} className="text-red-500" />}
              {loginStatus === 'success' && <CheckCircle size={16} className="text-green-500" />}
              <span className="text-sm font-medium">
                Status: {loginStatus.toUpperCase()}
              </span>
            </div>
            <button 
              onClick={() => debugConsole.toggle()}
              className="text-xs text-indigo-600 hover:underline"
            >
              View Debug
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-red-500 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">{errorMsg}</p>
                <button 
                  onClick={() => {
                    debugConsole.error('Error details:', errorMsg);
                    debugConsole.toggle();
                  }}
                  className="text-xs text-red-600 hover:underline mt-1"
                >
                  View error in debug console
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                debugConsole.debug('Email updated:', e.target.value.substring(0, 3) + '...');
              }}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                debugConsole.debug('Password updated (length):', e.target.value.length);
              }}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
          <p className="text-center text-sm text-gray-600 mb-4">
            Or continue with
          </p>
          <div className="grid grid-cols-3 gap-3">
            {['google', 'apple', 'facebook'].map((provider) => (
              <button
                key={provider}
                onClick={() => handleSocialLogin(provider)}
                disabled={loading}
                className="border border-gray-300 py-2 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                <span className="text-sm font-medium capitalize">{provider}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link 
            to="/signup"
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign up here
          </Link>
        </p>
      </div>

      {/* Debug Info Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>Having issues? Check the debug console (🐛 button) for details</p>
        <button 
          onClick={() => debugConsole.show()}
          className="mt-2 text-indigo-600 hover:underline"
        >
          Show Debug Console
        </button>
      </div>
    </div>
  );
}

export { debugConsole };