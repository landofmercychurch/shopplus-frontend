import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, getUser, setUser, clearSession } from '../services/authService';

export default function Profile() {
  const [profile, setProfileState] = useState(getUser());
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
    store_name: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // ===== Fetch profile on mount =====
  useEffect(() => {
    fetchProfile();
  }, []);

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
        address: data.profile.address || '',
        store_name: data.profile.store_name || '',
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

  const handleUpdate = async (e) => {
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) return;
    setLoading(true);

    try {
      await fetchWithAuth('/auth/delete', 'DELETE');
      clearSession();
      navigate('/signup');
    } catch (err) {
      console.error('Profile delete error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  // ===== Skeleton component =====
  const Skeleton = ({ width = 'w-full', height = 'h-6', rounded = 'rounded' }) => (
    <div className={`${width} ${height} bg-gray-200 animate-pulse ${rounded} mb-2`}></div>
  );

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4">
        <Skeleton width="w-20" height="h-20" rounded="rounded-full mx-auto" />
        <Skeleton width="w-40" />
        <Skeleton width="w-56" />
        <Skeleton width="w-48" />
        <Skeleton width="w-32" />
        <div className="space-y-2 mt-4">
          <Skeleton width="w-full" height="h-10" />
          <Skeleton width="w-full" height="h-10" />
          <Skeleton width="w-full" height="h-10" />
        </div>
      </div>
    );
  }

  if (!profile) return <div className="p-4 text-center text-red-600">{errorMsg || 'Profile not found.'}</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600">Profile</h2>

      {errorMsg && <p className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">{errorMsg}</p>}

      {editing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
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
          {profile.role === 'buyer' && (
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            />
          )}
          {profile.role === 'seller' && (
            <input
              type="text"
              placeholder="Store Name"
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            />
          )}
          <input
            type="text"
            placeholder="Avatar URL"
            value={formData.avatar_url}
            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Save Changes</button>
          <button type="button" onClick={() => setEditing(false)} className="w-full bg-gray-300 py-2 rounded">Cancel</button>
        </form>
      ) : (
        <div className="space-y-2">
          {profile.avatar_url && <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full mx-auto mb-2" />}
          <p><strong>Name:</strong> {profile.full_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Phone:</strong> {profile.phone_number}</p>
          {profile.role === 'buyer' && <p><strong>Address:</strong> {profile.address || '-'}</p>}
          {profile.role === 'seller' && <p><strong>Store:</strong> {profile.store_name || '-'}</p>}

          <div className="flex flex-col gap-2 mt-4">
            <button onClick={() => setEditing(true)} className="bg-indigo-500 text-white py-2 rounded">Edit Profile</button>
            <button onClick={handleDelete} className="bg-red-500 text-white py-2 rounded">Delete Account</button>
            <button onClick={handleLogout} className="bg-gray-700 text-white py-2 rounded">Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}

