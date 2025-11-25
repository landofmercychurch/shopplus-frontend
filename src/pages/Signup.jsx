import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [storeName, setStoreName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:5000/api";

  const phonePattern = /^\+?\d{7,15}$/;

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const cleanFullName = DOMPurify.sanitize(fullName.trim());
      const cleanEmail = DOMPurify.sanitize(email.trim());
      const cleanPassword = DOMPurify.sanitize(password);
      const cleanPhone = DOMPurify.sanitize(phone.trim());
      const cleanAddress = DOMPurify.sanitize(address.trim());
      const cleanStoreName = DOMPurify.sanitize(storeName.trim());
      const cleanAvatarUrl = DOMPurify.sanitize(avatarUrl.trim());

      if (!cleanFullName || !cleanEmail || !cleanPassword || !cleanPhone) {
        setErrorMsg("Full name, email, password, and phone are required.");
        return;
      }

      if (!phonePattern.test(cleanPhone)) {
        setErrorMsg("Phone number must be 7-15 digits and may start with +.");
        return;
      }

      if (role === "seller" && !cleanStoreName) {
        setErrorMsg("Store name is required for sellers.");
        return;
      }

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: cleanFullName,
          email: cleanEmail,
          password: cleanPassword,
          role,
          phone_number: cleanPhone,
          address: role === "buyer" ? cleanAddress || null : null,
          store_name: role === "seller" ? cleanStoreName : null,
          avatar_url: cleanAvatarUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Signup failed. Please try again.");
        return;
      }

      // Auto-login after signup
      const user = await login(cleanEmail, cleanPassword);

      if (user.role === "buyer") navigate("/");
      else if (user.role === "seller")
        navigate(user.has_store ? "/seller/dashboard" : "/seller/setup");

    } catch (err) {
      console.error("Signup error:", err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">Sign Up</h2>
        {errorMsg && <p className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">{errorMsg}</p>}

        <form onSubmit={handleSignup} className="space-y-4">
          <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
          <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
          <select value={role} onChange={e => setRole(e.target.value)} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
          {role === "buyer" && <input type="text" placeholder="Address (optional)" value={address} onChange={e => setAddress(e.target.value)} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500" />}
          {role === "seller" && <input type="text" placeholder="Store Name" value={storeName} onChange={e => setStoreName(e.target.value)} required className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500" />}
          <input type="text" placeholder="Avatar URL (optional)" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button type="submit" disabled={loading} className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50">
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-green-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

