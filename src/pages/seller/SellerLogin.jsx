import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSellerAuth } from "../../context/SellerAuthContext.jsx";
import DOMPurify from "dompurify";
import { ArrowLeft, HelpCircle } from "lucide-react";

export default function SellerLogin() {
  const { login } = useSellerAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Debug: Log component mount
  console.log("[SellerLogin] Component mounted");

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("[SellerLogin] handleLogin triggered");
    setErrorMsg("");

    const cleanEmail = DOMPurify.sanitize(email.trim());
    const cleanPassword = DOMPurify.sanitize(password);

    console.log("[SellerLogin] Email sanitized:", { 
      original: email, 
      cleaned: cleanEmail,
      length: cleanEmail.length 
    });

    if (!cleanEmail || !cleanPassword) {
      console.warn("[SellerLogin] Empty email or password detected");
      setErrorMsg("Email and password cannot be empty.");
      return;
    }

    console.log("[SellerLogin] Starting login process...");
    setLoading(true);
    
    try {
      console.log("[SellerLogin] Calling login function with credentials");
      const user = await login(cleanEmail, cleanPassword);
      console.log("[SellerLogin] Login response received:", user);

      if (!user) {
        console.error("[SellerLogin] No user object returned from login");
        setErrorMsg("Login failed. Please check your credentials.");
        return; // stop redirect
      }

      console.log("[SellerLogin] User role:", user.role);
      if (user.role !== "seller") {
        console.warn("[SellerLogin] Non-seller account attempted login:", user.role);
        setErrorMsg("This is not a seller account.");
        return; // stop redirect
      }

      console.log("[SellerLogin] Seller login successful");
      console.log("[SellerLogin] User has_store:", user.has_store);
      
      // Successful seller login
      const redirectPath = user.has_store ? "/seller/dashboard" : "/seller/setup";
      console.log("[SellerLogin] Redirecting to:", redirectPath);
      navigate(redirectPath);
      
    } catch (err) {
      console.error("[SellerLogin] Login error:", {
        message: err.message,
        response: err.response?.data,
        stack: err.stack
      });
      
      const errorMessage = err.response?.data?.message ||
                          err.message ||
                          "Login failed. Please try again.";
      console.log("[SellerLogin] Setting error message:", errorMessage);
      setErrorMsg(errorMessage);
    } finally {
      console.log("[SellerLogin] Login process completed, setting loading to false");
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log("[SellerLogin] Social login triggered for provider:", provider);
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    console.log("[SellerLogin] API Base URL:", baseUrl);
    
    const socialLoginUrl = `${baseUrl}/auth/seller/social-login?provider=${provider}`;
    console.log("[SellerLogin] Redirecting to social login URL:", socialLoginUrl);
    
    window.location.href = socialLoginUrl;
  };

  // Debug: Log state changes
  React.useEffect(() => {
    console.log("[SellerLogin] State updated:", {
      email: email ? `${email.substring(0, 3)}...` : "empty",
      password: password ? "***" : "empty",
      loading,
      errorMsg
    });
  }, [email, password, loading, errorMsg]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-4">
      <header className="flex justify-between items-center mb-6 bg-white shadow p-3 rounded">
        <button
          onClick={() => {
            console.log("[SellerLogin] Back button clicked");
            navigate("/");
          }}
          className="flex items-center gap-1 text-indigo-600 hover:underline"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <Link
          to="/help-center"
          className="flex items-center gap-1 text-gray-700 hover:text-indigo-600"
          onClick={() => console.log("[SellerLogin] Help center link clicked")}
        >
          <HelpCircle size={18} /> ?
        </Link>
      </header>

      <div className="max-w-md w-full mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-indigo-600 text-center">
          Seller Login
        </h2>

        {errorMsg && (
          <p className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">
            {errorMsg}
          </p>
        )}

        <form 
          onSubmit={(e) => {
            console.log("[SellerLogin] Form submission intercepted");
            handleLogin(e);
          }} 
          className="space-y-4" 
          autoComplete="off" 
          noValidate
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              console.log("[SellerLogin] Email input changed:", e.target.value);
              setEmail(e.target.value);
            }}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onFocus={() => console.log("[SellerLogin] Email input focused")}
            onBlur={() => console.log("[SellerLogin] Email input blurred")}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              console.log("[SellerLogin] Password input changed, length:", e.target.value.length);
              setPassword(e.target.value);
            }}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onFocus={() => console.log("[SellerLogin] Password input focused")}
            onBlur={() => console.log("[SellerLogin] Password input blurred")}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
            onClick={() => console.log("[SellerLogin] Login button clicked, loading:", loading)}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Don't have a seller account?{" "}
          <Link
            to="/seller/signup"
            className="text-indigo-600 font-medium hover:underline"
            onClick={() => console.log("[SellerLogin] Signup link clicked")}
          >
            Sign up
          </Link>
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => {
              console.log("[SellerLogin] Google login button clicked");
              handleSocialLogin("google");
            }}
            className="w-full border px-3 py-2 rounded flex justify-center items-center gap-2 hover:bg-gray-100"
          >
            Login with Google
          </button>
          <button
            onClick={() => {
              console.log("[SellerLogin] Facebook login button clicked");
              handleSocialLogin("facebook");
            }}
            className="w-full border px-3 py-2 rounded flex justify-center items-center gap-2 hover:bg-gray-100"
          >
            Login with Facebook
          </button>
          <button
            onClick={() => {
              console.log("[SellerLogin] Apple login button clicked");
              handleSocialLogin("apple");
            }}
            className="w-full border px-3 py-2 rounded flex justify-center items-center gap-2 hover:bg-gray-100"
          >
            Login with Apple
          </button>
        </div>
      </div>
    </div>
  );
}
