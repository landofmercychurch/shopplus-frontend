import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerAuth } from "../../context/SellerAuthContext.jsx";
import DOMPurify from "dompurify";

export default function SellerSignup() {
  const { signup } = useSellerAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
      const cleanStoreName = DOMPurify.sanitize(storeName.trim());
      const cleanAvatarUrl = DOMPurify.sanitize(avatarUrl.trim());

      if (!cleanFullName || !cleanEmail || !cleanPassword || !cleanPhone || !cleanStoreName) {
        setErrorMsg("All fields except Avatar are required.");
        return;
      }

      if (!phonePattern.test(cleanPhone)) {
        setErrorMsg("Phone number must be 7-15 digits and may start with +.");
        return;
      }

      const payload = {
        full_name: cleanFullName,
        email: cleanEmail,
        password: cleanPassword,
        phone_number: cleanPhone,
        store_name: cleanStoreName,
        avatar_url: cleanAvatarUrl || null,
        role: "seller",
      };

      const user = await signup(payload);

      if (!user) {
        setErrorMsg("Signup failed. Please try again.");
        return;
      }

      navigate(user.has_store ? "/seller/dashboard" : "/seller/setup");

    } catch (err) {
      setErrorMsg(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">
          Seller Sign Up
        </h2>

        {errorMsg && (
          <p className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            placeholder="Store Name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            placeholder="Avatar URL (optional)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

