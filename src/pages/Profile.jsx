import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth, getUser, setUser, clearSession } from '../services/buyerAuthService';

// Nigerian States + LGAs mapping
const SHIPPING_RATES = {
  Lagos: [
    "Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry",
    "Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe",
    "Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere"
  ],
  "Abia": [], "Adamawa": [], "Akwa Ibom": [], "Anambra": [], "Bauchi": [], "Bayelsa": [], "Benue": [],
  "Borno": [], "Cross River": [], "Delta": [], "Ebonyi": [], "Edo": [], "Ekiti": [], "Enugu": [], "FCT": [],
  "Gombe": [], "Imo": [], "Jigawa": [], "Kaduna": [], "Kano": [], "Katsina": [], "Kebbi": [], "Kogi": [],
  "Kwara": [], "Nasarawa": [], "Niger": [], "Ogun": [], "Ondo": [], "Osun": [], "Oyo": [], "Plateau": [],
  "Rivers": [], "Sokoto": [], "Taraba": [], "Yobe": [], "Zamfara": []
};

const NIGERIAN_STATES = Object.keys(SHIPPING_RATES);

export default function Profile() {
  const [profile, setProfile] = useState(getUser());
  const [formData, setFormData] = useState({ full_name: '', email: '', phone_number: '', avatar_url: '' });
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    label: '', full_name: '', phone_number: '', address1: '', address2: '',
    city: '', state: '', lga: '', country: 'Nigeria', postal_code: '', is_default: false
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const navigate = useNavigate();

  // ===== Fetch profile =====
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchWithAuth('/auth/buyer/profile');
      setProfile(data.profile);
      setUser(data.profile);
      setFormData({
        full_name: data.profile.full_name || '',
        email: data.profile.email || '',
        phone_number: data.profile.phone_number || '',
        avatar_url: data.profile.avatar_url || ''
      });
    } catch (err) {
      console.error('❌ Profile fetch error:', err);
      setErrorMsg(err.message || 'Failed to fetch profile.');
      clearSession();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ===== Fetch addresses =====
  const fetchAddresses = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/buyer/metadata');
      setAddresses(data.addresses || []);
    } catch (err) {
      console.error('❌ Failed to fetch addresses:', err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?.role === 'buyer') fetchAddresses();
  }, [profile, fetchAddresses]);

  // ===== Update profile =====
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchWithAuth('/auth/buyer/profile', 'PUT', formData);
      setProfile(data.profile);
      setUser(data.profile);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('❌ Profile update error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== Add new address =====
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    if (!addressForm.state || !addressForm.lga) {
      alert("Please select State and LGA.");
      setLoading(false);
      return;
    }
    try {
      await fetchWithAuth('/buyer/metadata', 'POST', addressForm);
      setAddressForm({
        label: '', full_name: '', phone_number: '', address1: '', address2: '',
        city: '', state: '', lga: '', country: 'Nigeria', postal_code: '', is_default: false
      });
      setShowAddressModal(false);
      fetchAddresses();
      alert('Address added successfully!');
    } catch (err) {
      console.error('❌ Add address error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== Delete / Set Default =====
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await fetchWithAuth(`/buyer/metadata/${id}`, 'DELETE');
      fetchAddresses();
    } catch (err) {
      console.error('❌ Delete address error:', err);
    }
  };
  const handleSetDefault = async (id) => {
    try {
      await fetchWithAuth(`/buyer/metadata/${id}/default`, 'PATCH');
      fetchAddresses();
    } catch (err) {
      console.error('❌ Set default address error:', err);
    }
  };
  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  // ===== LGA options based on selected state =====
  const lgasForState = addressForm.state ? SHIPPING_RATES[addressForm.state] : [];

  if (loading) return <p className="p-4 text-center">Loading...</p>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600">Profile</h2>
      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

      {/* Profile edit */}
      {editing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <input type="text" placeholder="Full Name" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full border px-3 py-2 rounded" />
          <input type="email" placeholder="Email" value={formData.email} disabled className="w-full border px-3 py-2 rounded bg-gray-100" />
          <input type="tel" placeholder="Phone Number" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} className="w-full border px-3 py-2 rounded" />
          <input type="text" placeholder="Avatar URL" value={formData.avatar_url} onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} className="w-full border px-3 py-2 rounded" />
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="w-full bg-gray-300 py-2 rounded">Cancel</button>
        </form>
      ) : (
        <div className="text-center">
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

      {/* Buyer Addresses */}
      {profile.role === 'buyer' && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Addresses</h3>
          {addresses.map(addr => (
            <div key={addr.id} className="border p-3 rounded mb-2">
              <p><strong>{addr.label}</strong> {addr.is_default && '(Default)'}</p>
              <p>{addr.full_name} - {addr.phone_number}</p>
              <p>{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</p>
              <p>{addr.city}{addr.lga ? `, ${addr.lga}` : ''}, {addr.state}, {addr.country}</p>
              {addr.postal_code && <p>Postal: {addr.postal_code}</p>}
              <div className="flex gap-2 mt-2">
                {!addr.is_default && <button onClick={() => handleSetDefault(addr.id)} className="bg-green-500 text-white py-1 px-2 rounded">Set Default</button>}
                <button onClick={() => handleDeleteAddress(addr.id)} className="bg-red-500 text-white py-1 px-2 rounded">Delete</button>
              </div>
            </div>
          ))}

          {/* Open Modal */}
          <button onClick={() => setShowAddressModal(true)} className="bg-blue-500 text-white py-2 px-4 rounded mt-2">Add New Address</button>

          {/* Modal */}
          {showAddressModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start overflow-auto z-50 pt-16 px-2">
              <div className="bg-white rounded-lg w-full max-w-md p-4 space-y-3 shadow-lg">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Add Address</h4>
                  <button onClick={() => setShowAddressModal(false)} className="text-red-500 font-bold">X</button>
                </div>
                <form onSubmit={handleAddAddress} className="space-y-2 max-h-[70vh] overflow-auto">
                  <input type="text" placeholder="Label (Home, Office)" value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} className="w-full border px-2 py-1 rounded" />
                  <input type="text" placeholder="Full Name" value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })} className="w-full border px-2 py-1 rounded" />
                  <input type="tel" placeholder="Phone Number" value={addressForm.phone_number} onChange={e => setAddressForm({ ...addressForm, phone_number: e.target.value })} className="w-full border px-2 py-1 rounded" />
                  <input type="text" placeholder="Address 1" value={addressForm.address1} onChange={e => setAddressForm({ ...addressForm, address1: e.target.value })} className="w-full border px-2 py-1 rounded" />
                  <input type="text" placeholder="Address 2 (optional)" value={addressForm.address2} onChange={e => setAddressForm({ ...addressForm, address2: e.target.value })} className="w-full border px-2 py-1 rounded" />
                  <input type="text" placeholder="City" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full border px-2 py-1 rounded" />

                  {/* State dropdown */}
                  <select value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value, lga: '' })} className="w-full border px-2 py-1 rounded">
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>

                  {/* LGA dropdown */}
                  <select value={addressForm.lga} onChange={e => setAddressForm({ ...addressForm, lga: e.target.value })} className="w-full border px-2 py-1 rounded" disabled={!lgasForState.length}>
                    <option value="">{lgasForState.length ? "Select LGA" : "No LGAs available"}</option>
                    {lgasForState.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                  </select>

                  <input type="text" placeholder="Postal Code" value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} className="w-full border px-2 py-1 rounded" />
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} />
                    Set as default
                  </label>
                  <button type="submit" className="bg-blue-500 text-white py-2 rounded w-full">Add Address</button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

