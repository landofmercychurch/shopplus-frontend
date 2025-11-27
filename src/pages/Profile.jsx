import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, getUser, setUser, clearSession } from '../services/authService';

export default function Profile() {
  const [profile, setProfileState] = useState(getUser());
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    avatar_url: '',
  });
  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [addressForm, setAddressForm] = useState({
    label: '',
    full_name: '',
    phone_number: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
    is_default: false,
  });

  const navigate = useNavigate();

  // ===== Fetch profile and addresses on mount =====
  useEffect(() => {
    fetchProfile();
    if (profile?.role === 'buyer') fetchAddresses();
  }, [profile?.role]);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchWithAuth('/auth/profile');
      setProfileState(data.profile);
      setUser(data.profile);

      setFormData({
        full_name: data.profile.full_name || '',
        email: data.profile.email || '',
        phone_number: data.profile.phone_number || '',
        avatar_url: data.profile.avatar_url || '',
      });
    } catch (err) {
      console.error('Profile fetch error:', err);
      setErrorMsg(err.message || 'Failed to fetch profile.');
      clearSession();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const data = await fetchWithAuth('/buyer/metadata');
      setAddresses(data.addresses || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await fetchWithAuth('/auth/profile', 'PUT', formData);
      setProfileState(data.profile);
      setUser(data.profile);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await fetchWithAuth('/buyer/metadata', 'POST', addressForm);
      setAddressForm({
        label: '',
        full_name: '',
        phone_number: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: 'Nigeria',
        postal_code: '',
        is_default: false,
      });
      fetchAddresses();
      alert('Address added successfully!');
    } catch (err) {
      console.error('Add address error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await fetchWithAuth(`/buyer/metadata/${id}`, 'DELETE');
      fetchAddresses();
    } catch (err) {
      console.error('Delete address error:', err);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await fetchWithAuth(`/buyer/metadata/${id}/default`, 'PATCH');
      fetchAddresses();
    } catch (err) {
      console.error('Set default address error:', err);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600">Profile</h2>
      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

      {editing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            disabled
            className="w-full border px-3 py-2 rounded bg-gray-100"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            placeholder="Avatar URL"
            value={formData.avatar_url}
            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="w-full bg-gray-300 py-2 rounded">Cancel</button>
        </form>
      ) : (
        <div>
          {profile.avatar_url && <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full mx-auto mb-2" />}
          <p><strong>Name:</strong> {profile.full_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Phone:</strong> {profile.phone_number}</p>
          <div className="flex flex-col gap-2 mt-4">
            <button onClick={() => setEditing(true)} className="bg-indigo-500 text-white py-2 rounded">Edit Profile</button>
            <button onClick={handleLogout} className="bg-gray-700 text-white py-2 rounded">Logout</button>
          </div>
        </div>
      )}

      {profile.role === 'buyer' && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Addresses</h3>

          {/* Address List */}
          {addresses.map(addr => (
            <div key={addr.id} className="border p-3 rounded mb-2">
              <p><strong>{addr.label}</strong> {addr.is_default && '(Default)'}</p>
              <p>{addr.full_name} - {addr.phone_number}</p>
              <p>{addr.address1} {addr.address2 ? `, ${addr.address2}` : ''}</p>
              <p>{addr.city}, {addr.state}, {addr.country}</p>
              {addr.postal_code && <p>Postal: {addr.postal_code}</p>}
              <div className="flex gap-2 mt-2">
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)} className="bg-green-500 text-white py-1 px-2 rounded">Set Default</button>
                )}
                <button onClick={() => handleDeleteAddress(addr.id)} className="bg-red-500 text-white py-1 px-2 rounded">Delete</button>
              </div>
            </div>
          ))}

          {/* Add Address Form */}
          <form onSubmit={handleAddAddress} className="border p-3 rounded mt-4 space-y-2">
            <h4 className="font-semibold">Add New Address</h4>
            <input type="text" placeholder="Label (Home, Office)" value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} className="w-full border px-2 py-1 rounded" />
            <input type="text" placeholder="Full Name" value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })} className="w-full border px-2 py-1 rounded" />
            <input type="tel" placeholder="Phone Number" value={addressForm.phone_number} onChange={e => setAddressForm({ ...addressForm, phone_number: e.target.value })} className="w-full border px-2 py-1 rounded" />
            <input type="text" placeholder="Address 1" value={addressForm.address1} onChange={e => setAddressForm({ ...addressForm, address1: e.target.value })} className="w-full border px-2 py-1 rounded" />
            <input type="text" placeholder="Address 2 (optional)" value={addressForm.address2} onChange={e => setAddressForm({ ...addressForm, address2: e.target.value })} className="w-full border px-2 py-1 rounded" />
            <input type="text" placeholder="City" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full border px-2 py-1 rounded" />
            <input type="text" placeholder="State" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} className="w-full border px-2 py-1 rounded" />
            <input type="text" placeholder="Postal Code" value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} className="w-full border px-2 py-1 rounded" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} />
              Set as default
            </label>
            <button type="submit" className="bg-blue-500 text-white py-2 rounded w-full">Add Address</button>
          </form>
        </div>
      )}
    </div>
  );
}
