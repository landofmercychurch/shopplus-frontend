// src/pages/seller/EditStore.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../services/authService";
import ImageUpload from "../../components/ImageUpload";

// ===============================
// Skeleton Loader Component
// ===============================
const Skeleton = ({ height = 20, width = "100%", className }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={{ height, width }}
  />
);

export default function EditStore() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sections, setSections] = useState({
    branding: true,
    socials: false,
    policies: false,
  });

  // ===============================
  // Fetch current seller store
  // ===============================
  useEffect(() => {
    const init = async () => {
      if (!user) {
        navigate("/login");
        return;
      }
      if (user.role !== "seller") {
        navigate("/");
        return;
      }

      setLoading(true);
      setErrorMsg("");

      try {
        const storeData = await fetchWithAuth(`/seller/stores/user/${user.id}`);
        if (!storeData?.id) {
          setErrorMsg("No store found for your account.");
          return;
        }
        // Sanitize all incoming strings to prevent XSS
        const sanitizedStore = Object.fromEntries(
          Object.entries(storeData).map(([key, value]) => [
            key,
            typeof value === "string" ? DOMPurify.sanitize(value) : value,
          ])
        );
        setStore(sanitizedStore);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setErrorMsg(err.message || "Failed to fetch store data.");
        if ((err.message || "").toLowerCase().includes("token") || (err.message || "").toLowerCase().includes("unauthorized")) {
          logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, navigate, logout]);

  // ===============================
  // Input handlers
  // ===============================
  const handleInputChange = (field, value) => {
    setStore((prev) => ({ ...prev, [field]: DOMPurify.sanitize(value) }));
  };

  // ===============================
  // Submit updated store
  // ===============================
  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!store.name?.trim() || !store.address?.trim() || !store.phone?.trim()) {
      setErrorMsg("Store Name, Address, and Phone are required.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchWithAuth(`/seller/stores/${storeId}`, "PUT", store);
      alert("✅ Store updated successfully!");
      navigate("/seller/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update store.");
      if ((err.message || "").toLowerCase().includes("token") || (err.message || "").toLowerCase().includes("unauthorized")) {
        logout();
        navigate("/login");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSection = (section) => setSections((prev) => ({ ...prev, [section]: !prev[section] }));

  // ===============================
  // Render UI
  // ===============================
  
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-2xl w-full bg-white p-6 rounded shadow space-y-6">
          <Skeleton height={30} width="60%" />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
      </div>
    );

  if (!store)
    return <p className="text-center mt-10 text-red-600">{errorMsg || "Store not found."}</p>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4 space-y-6">
      {/* ================= Header with Back Button ================= */}
      <div className="w-full max-w-2xl flex justify-start">
        <button
          onClick={() => navigate("/seller/dashboard")}
          className="bg-gray-200 text-gray-800 px-3 py-1 rounded shadow hover:bg-gray-300 transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="max-w-2xl w-full bg-white p-6 rounded shadow space-y-6">
        <h2 className="text-2xl font-bold text-center text-blue-600">Edit Store</h2>

        {errorMsg && <p className="bg-red-100 text-red-700 px-3 py-2 rounded">{errorMsg}</p>}

        <form onSubmit={handleUpdate} className="space-y-4" noValidate>
          <Input label="Store Name" value={store.name} onChange={(v) => handleInputChange("name", v)} required />
          <Textarea label="Description (optional)" value={store.description} onChange={(v) => handleInputChange("description", v)} />
          <Input label="Address" value={store.address} onChange={(v) => handleInputChange("address", v)} required />
          <Input label="Phone" value={store.phone} onChange={(v) => handleInputChange("phone", v)} required />

          {/* Branding Section */}
          <Section title="Branding" open={sections.branding} toggle={() => toggleSection("branding")}>
            <ImageUpload
              label="Logo"
              url={store.logo_url}
              onUrlChange={(v) => handleInputChange("logo_url", v)}
              type="store"
              showProgressMessages
            />
            <ImageUpload
              label="Banner"
              url={store.banner_url}
              onUrlChange={(v) => handleInputChange("banner_url", v)}
              fullWidth
              type="store"
              showProgressMessages
            />
          </Section>

          {/* Socials Section */}
          <Section title="Social Links" open={sections.socials} toggle={() => toggleSection("socials")}>
            {["facebook_url", "instagram_url", "tiktok_url", "website_url"].map((field) => (
              <Input key={field} label={field.replace("_", " ").toUpperCase()} value={store[field]} onChange={(v) => handleInputChange(field, v)} />
            ))}
          </Section>

          {/* Policies Section */}
          <Section title="Policies" open={sections.policies} toggle={() => toggleSection("policies")}>
            {["shipping_policy", "return_policy"].map((field) => (
              <Textarea key={field} label={field.replace("_", " ").toUpperCase()} value={store[field]} onChange={(v) => handleInputChange(field, v)} />
            ))}
            <Input label="Opening Hours" value={store.opening_hours} onChange={(v) => handleInputChange("opening_hours", v)} />
          </Section>

          <button type="submit" disabled={submitting} className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50">
            {submitting ? "Updating Store..." : "Update Store"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===============================
// Reusable Section component
// ===============================
const Section = ({ title, open, toggle, children }) => (
  <div className="border rounded">
    <button type="button" className="w-full text-left px-4 py-2 font-semibold bg-gray-100 rounded-t" onClick={toggle}>
      {title} {open ? "▲" : "▼"}
    </button>
    {open && <div className="p-4 space-y-3">{children}</div>}
  </div>
);

// ===============================
// Reusable Input and Textarea
// ===============================
const Input = ({ label, value, onChange, required }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}{required && " *"}</label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      required={required}
    />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3 }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full border px-3 py-2 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

