// src/pages/BuyerLogin.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext.jsx";
import DOMPurify from "dompurify";
import { ArrowLeft, HelpCircle } from "lucide-react";

export default function BuyerLogin() {
  const { login } = useBuyerAuth(); // context handles login & profile
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // -------------------------------
  // Handle Buyer Login (Shopee-style)
  // -------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Sanitize inputs
    const cleanEmail = DOMPurify.sanitize(email);
    const cleanPassword = DOMPurify.sanitize(password);

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg("Email and password cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      // Context login automatically sets cookies & user state
      const data = await login(cleanEmail, cleanPassword);

      // Buyer-only page: force redirect to homepage
      navigate("/");

    } catch (err) {
      console.error("[BuyerLogin] Login error:", err);
      setErrorMsg(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Social login buttons
  // -------------------------------
  const handleSocialLogin = (provider) => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000/api";
    window.location.href = `${API_BASE}/auth/buyer/${provider}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-4">
      <header className="flex justify-between items-center mb-6 bg-white shadow p-3 rounded">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-indigo-600 hover:underline">
          <ArrowLeft size={18} /> Back
        </button>
        <Link to="/help-center" className="flex items-center gap-1 text-gray-700 hover:text-indigo-600">
          <HelpCircle size={18} /> ?
        </Link>
      </header>

      <div className="max-w-md w-full mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-indigo-600 text-center">Buyer Login</h2>

        {errorMsg && <p className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">{errorMsg}</p>}

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off" noValidate>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
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
      </div>
    </div>
  );
}

