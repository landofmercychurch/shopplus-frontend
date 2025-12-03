// src/pages/BuyerLogin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext.jsx";
import DOMPurify from "dompurify";
import { ArrowLeft, HelpCircle, Bug, X, Trash2, Eye, EyeOff } from "lucide-react";

// ============================================
// DEBUG CONSOLE SYSTEM (UI VISIBLE CONSOLE)
// ============================================
class DebugConsole {
  constructor() {
    this.logs = [];
    this.maxLogs = 100; // Prevent memory issues
    this.listeners = [];
    this.isIntercepted = false;
    
    // Initialize debug panel DOM element
    this.panel = null;
    this.logContainer = null;
    this.isVisible = false;
  }

  // Initialize the console system
  init() {
    if (this.isIntercepted) return;
    
    // Intercept console methods
    this.interceptConsole();
    this.createPanel();
    this.isIntercepted = true;
    
    this.log('info', '🔧 Debug Console initialized');
  }

  // Intercept all console methods
  interceptConsole() {
    const methods = ['log', 'error', 'warn', 'info', 'debug'];
    
    methods.forEach(method => {
      const original = console[method];
      console[method] = (...args) => {
        // Add to our debug console
        this.addLog(method, ...args);
        // Call original console
        original.apply(console, args);
      };
    });
  }

  // Add log entry with timestamp and level
  addLog(level, ...args) {
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
      level,
      message,
      color: this.getLevelColor(level)
    };

    this.logs.unshift(logEntry); // Newest first
    
    // Limit logs to prevent memory issues
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Update UI if panel exists
    this.updatePanel();
    
    // Notify listeners
    this.listeners.forEach(listener => listener(logEntry));
  }

  // Custom logging methods
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

  // Track login specific events
  trackLoginEvent(event, data = {}) {
    this.addLog('info', `🔑 LOGIN EVENT: ${event}`, data);
  }

  // Get color for log level
  getLevelColor(level) {
    const colors = {
      error: 'text-red-600',
      warn: 'text-yellow-600',
      info: 'text-blue-600',
      log: 'text-gray-800',
      debug: 'text-purple-600'
    };
    return colors[level] || 'text-gray-800';
  }

  // Create floating debug panel
  createPanel() {
    if (this.panel) return;

    // Create panel container
    this.panel = document.createElement('div');
    this.panel.id = 'debug-console-panel';
    this.panel.className = 'fixed bottom-4 right-4 w-96 max-w-full max-h-96 bg-white rounded-lg shadow-xl border border-gray-300 z-50 flex flex-col hidden';
    
    // Panel header
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
    
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '<EyeOff size={14} />';
    toggleBtn.className = 'p-1 hover:bg-gray-200 rounded';
    toggleBtn.title = 'Toggle logs';
    toggleBtn.onclick = () => this.toggleLogs();
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<X size={16} />';
    closeBtn.className = 'p-1 hover:bg-gray-200 rounded';
    closeBtn.title = 'Close panel';
    closeBtn.onclick = () => this.hide();
    
    controls.appendChild(clearBtn);
    controls.appendChild(toggleBtn);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);
    
    // Log container
    this.logContainer = document.createElement('div');
    this.logContainer.className = 'flex-1 overflow-y-auto p-3 font-mono text-sm';
    this.logContainer.style.maxHeight = '300px';
    
    // Footer with stats
    const footer = document.createElement('div');
    footer.className = 'p-2 border-t text-xs text-gray-500 text-center';
    footer.id = 'debug-console-stats';
    
    this.panel.appendChild(header);
    this.panel.appendChild(this.logContainer);
    this.panel.appendChild(footer);
    
    document.body.appendChild(this.panel);
  }

  // Update panel with logs
  updatePanel() {
    if (!this.logContainer) return;
    
    this.logContainer.innerHTML = '';
    
    this.logs.forEach(log => {
      const logElement = document.createElement('div');
      logElement.className = `mb-1 ${log.color}`;
      logElement.innerHTML = `
        <span class="text-gray-500 text-xs">[${log.timestamp}]</span>
        <span class="font-medium ml-1">${log.level.toUpperCase()}:</span>
        <span class="ml-1">${log.message}</span>
      `;
      this.logContainer.appendChild(logElement);
    });
    
    // Update stats
    const stats = document.getElementById('debug-console-stats');
    if (stats) {
      const errorCount = this.logs.filter(l => l.level === 'error').length;
      const warnCount = this.logs.filter(l => l.level === 'warn').length;
      stats.textContent = `${this.logs.length} logs | ${errorCount} errors | ${warnCount} warnings`;
    }
  }

  // Toggle panel visibility
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

  // Toggle auto-scroll for logs
  toggleLogs() {
    // Implementation for log toggling
  }

  // Clear all logs
  clear() {
    this.logs = [];
    this.updatePanel();
    this.addLog('info', '🧹 Console cleared');
  }

  // Add listener for log events
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

// Global debug console instance
const debugConsole = new DebugConsole();

// Initialize debug console when module loads
if (typeof window !== 'undefined') {
  window.__debugConsole = debugConsole;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function BuyerLogin() {
  const { login } = useBuyerAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  // Initialize debug console
  useEffect(() => {
    debugConsole.init();
    debugConsole.trackLoginEvent('Login page loaded');
    
    // Log initial state
    debugConsole.info('📱 BuyerLogin component mounted');
    debugConsole.debug('Initial state:', { email, loading });
    
    // Add button to toggle debug panel
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '🐛';
    toggleBtn.className = 'fixed bottom-4 left-4 w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-lg z-40';
    toggleBtn.title = 'Toggle Debug Console';
    toggleBtn.onclick = () => debugConsole.toggle();
    toggleBtn.id = 'debug-toggle-btn';
    
    if (!document.getElementById('debug-toggle-btn')) {
      document.body.appendChild(toggleBtn);
    }

    return () => {
      const btn = document.getElementById('debug-toggle-btn');
      if (btn) btn.remove();
    };
  }, []);

  // -------------------------------
  // Handle Buyer Login (Shopee-style)
  // -------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    debugConsole.trackLoginEvent('Login attempt started', { email: email.substring(0, 3) + '...' });
    debugConsole.info('🔄 Starting login process...');

    // Sanitize inputs
    const cleanEmail = DOMPurify.sanitize(email);
    const cleanPassword = DOMPurify.sanitize(password);

    debugConsole.debug('Sanitized inputs:', { 
      originalEmail: email.length,
      originalPassword: password.length,
      cleanEmail: cleanEmail ? '***' : 'empty',
      cleanPassword: cleanPassword ? '***' : 'empty'
    });

    if (!cleanEmail || !cleanPassword) {
      const error = "Email and password cannot be empty.";
      debugConsole.error('❌ Validation failed:', error);
      debugConsole.trackLoginEvent('Login validation failed', { reason: 'empty_fields' });
      setErrorMsg(error);
      return;
    }

    setLoading(true);
    debugConsole.info('⏳ Setting loading state to true');

    try {
      debugConsole.trackLoginEvent('Calling login API', { email: cleanEmail.substring(0, 3) + '...' });
      debugConsole.info('📤 Sending login request to context...');

      // Context login automatically sets cookies & user state
      const data = await login(cleanEmail, cleanPassword);

      debugConsole.info('✅ Login successful!', { 
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : 'none'
      });
      debugConsole.trackLoginEvent('Login successful', { 
        userEmail: cleanEmail.substring(0, 3) + '...',
        timestamp: new Date().toISOString()
      });

      // Buyer-only page: force redirect to homepage
      debugConsole.info('🔄 Redirecting to homepage...');
      navigate("/");

    } catch (err) {
      debugConsole.error('❌ Login error:', err);
      debugConsole.trackLoginEvent('Login failed', { 
        error: err.message,
        type: err.name || 'Unknown'
      });
      
      const errorMessage = err.message || "Login failed. Please try again.";
      debugConsole.warn('⚠️ Setting error message:', errorMessage);
      setErrorMsg(errorMessage);
    } finally {
      debugConsole.info('🏁 Login process completed');
      debugConsole.debug('Setting loading state to false');
      setLoading(false);
    }
  };

  // -------------------------------
  // Social login buttons
  // -------------------------------
  const handleSocialLogin = (provider) => {
    debugConsole.trackLoginEvent('Social login clicked', { provider });
    debugConsole.info(`🔗 Redirecting to ${provider} OAuth...`);
    
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000/api";
    const url = `${API_BASE}/auth/buyer/${provider}`;
    
    debugConsole.debug('Social login URL:', { 
      provider, 
      url,
      apiBase: import.meta.env.VITE_API_BASE_URL || 'default localhost'
    });
    
    window.location.href = url;
  };

  // Manual debug button handler
  const handleManualDebug = () => {
    debugConsole.info('🔍 Manual debug triggered');
    debugConsole.debug('Current state:', { 
      email: email || 'empty',
      passwordLength: password ? password.length : 0,
      loading,
      errorMsg
    });
    debugConsole.trackLoginEvent('Manual debug check');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-4">
      <header className="flex justify-between items-center mb-6 bg-white shadow p-3 rounded">
        <button 
          onClick={() => {
            debugConsole.info('← Navigating back to homepage');
            navigate("/");
          }} 
          className="flex items-center gap-1 text-indigo-600 hover:underline"
        >
          <ArrowLeft size={18} /> Back
        </button>
        
        {/* Debug Button - Only visible in development */}
        <button 
          onClick={handleManualDebug}
          className="flex items-center gap-1 text-gray-700 hover:text-indigo-600"
          title="Debug Info"
        >
          <Bug size={18} /> Debug
        </button>
        
        <Link 
          to="/help-center" 
          className="flex items-center gap-1 text-gray-700 hover:text-indigo-600"
          onClick={() => debugConsole.info('Navigating to help center')}
        >
          <HelpCircle size={18} /> ?
        </Link>
      </header>

      <div className="max-w-md w-full mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-indigo-600 text-center">Buyer Login</h2>

        {errorMsg && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">
            {errorMsg}
            <button 
              onClick={() => {
                debugConsole.error('User viewed error:', errorMsg);
                debugConsole.trackLoginEvent('Error displayed', { message: errorMsg });
              }}
              className="ml-2 text-xs underline"
            >
              (log)
            </button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off" noValidate>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              debugConsole.debug('Email field changed:', e.target.value.substring(0, 3) + '...');
            }}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              debugConsole.debug('Password field changed (length):', e.target.value.length);
            }}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
            onClick={() => debugConsole.trackLoginEvent('Login button clicked')}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Don’t have an account?{" "}
          <Link 
            to="/signup" 
            className="text-indigo-600 font-medium hover:underline"
            onClick={() => debugConsole.info('Navigating to signup page')}
          >
            Sign up
          </Link>
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => handleSocialLogin("google")}
            className="w-full border px-3 py-2 rounded flex justify-center items-center gap-2 hover:bg-gray-100"
          >
            Login with Gmail
          </button>
          <button
            onClick={() => handleSocialLogin("apple")}
            className="w-full border px-3 py-2 rounded flex justify-center items-center gap-2 hover:bg-gray-100"
          >
            Login with Apple
          </button>
          <button
            onClick={() => handleSocialLogin("facebook")}
            className="w-full border px-3 py-2 rounded flex justify-center items-center gap-2 hover:bg-gray-100"
          >
            Login with Facebook
          </button>
        </div>

        {/* Hidden debug info for mobile inspection */}
        <div className="mt-4 text-xs text-gray-500 hidden" id="hidden-debug-info">
          Debug Console Active - Use 🐛 button to view logs
        </div>
      </div>

      {/* Inline debug panel for mobile (alternative) */}
      {showDebug && (
        <div className="fixed inset-4 bg-white border rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-bold">Debug Console</h3>
            <button 
              onClick={() => setShowDebug(false)}
              className="p-1"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3 font-mono text-sm">
            {/* Logs would be rendered here */}
          </div>
        </div>
      )}
    </div>
  );
}

// Export debug console for use in other files
export { debugConsole };