// src/pages/seller/SellerSetup.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fetchWithAuth } from '../../services/authService';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SellerSetup() {
  const { user, rehydrated } = useAuth();
  const navigate = useNavigate();

  const [storeData, setStoreData] = useState({
    name: '',
    description: '',
    logo_url: '',
    address: '',
    phone: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Validate phone & URL
  const validatePhone = (p) => /^\d{7,15}$/.test(p.replace(/\D/g, ''));
  const validateUrl = (url) => {
    if (!url) return true;
    try { new URL(url, window.location.origin); return true; } catch { return false; }
  };

  // Initialize seller store
  useEffect(() => {
    if (!rehydrated) return; // wait until AuthContext is ready

    if (!user || user.role !== 'seller') {
      navigate('/');
      return;
    }

    const loadStore = async () => {
      try {
        const resStore = await fetchWithAuth(`/seller/stores/user/${user.id}`);
        if (resStore?.id) {
          setStoreData({
            name: resStore.name || '',
            description: resStore.description || '',
            logo_url: resStore.logo_url || '',
            address: resStore.address || '',
            phone: resStore.phone || '',
          });

          // If store is already fully setup, redirect to dashboard
          if (resStore.name && resStore.address && resStore.phone) {
            navigate('/seller/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to fetch store info.');
      } finally {
        setLoading(false);
      }
    };

    loadStore();
  }, [user, rehydrated, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }
    setLogoFile(file);
    setStoreData((prev) => ({ ...prev, logo_url: URL.createObjectURL(file) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStoreData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (submitting) return;

    const { name, address, phone, logo_url, description } = storeData;

    if (!name.trim() || !address.trim() || !phone.trim()) {
      setErrorMsg('Store Name, Address, and Phone are required.');
      return;
    }

    if (!validatePhone(phone)) { setErrorMsg('Invalid phone number.'); return; }
    if (!validateUrl(logo_url)) { setErrorMsg('Invalid Logo URL.'); return; }

    setSubmitting(true);

    try {
      let uploadedLogoUrl = logo_url;

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const resUpload = await fetchWithAuth('/uploads', 'POST', formData);
        uploadedLogoUrl = resUpload.url;
      }

      // Check if store exists for update vs create
      const resStore = await fetchWithAuth(`/seller/stores/user/${user.id}`);
      const method = resStore?.id ? 'PUT' : 'POST';
      const endpoint = resStore?.id ? `/seller/stores/${resStore.id}` : '/seller/stores';

      await fetchWithAuth(endpoint, method, {
        name: DOMPurify.sanitize(name.trim()),
        description: description ? DOMPurify.sanitize(description.trim()) : null,
        logo_url: uploadedLogoUrl || null,
        address: DOMPurify.sanitize(address.trim()),
        phone: DOMPurify.sanitize(phone.trim()),
      });

      navigate('/seller/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !rehydrated) return <div className="p-4 text-center">Loading store details...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">
          {storeData.name ? 'Update Your Store' : 'Setup Your Store'}
        </h2>

        {errorMsg && <p className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">{errorMsg}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Store Name"
            value={storeData.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            value={storeData.description}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <div className="flex flex-col space-y-2">
            {storeData.logo_url && (
              <img
                src={storeData.logo_url}
                alt="Logo Preview"
                className="w-32 h-32 object-cover rounded border mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="url"
              name="logo_url"
              placeholder="Or paste Logo URL"
              value={storeData.logo_url}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <input
            type="text"
            name="address"
            placeholder="Store Address"
            value={storeData.address}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Contact Phone"
            value={storeData.phone}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {submitting ? (storeData.name ? 'Updating Store...' : 'Creating Store...') :
              (storeData.name ? 'Update Store' : 'Create Store')}
          </button>
        </form>
      </div>
    </div>
  );
}

