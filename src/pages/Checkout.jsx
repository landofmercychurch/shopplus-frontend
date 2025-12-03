import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBuyerAuth } from "../context/BuyerAuthContext";
import axios from "../utils/axiosPublic";

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

export default function Checkout({ onCartUpdateRef }) {
  const { user } = useBuyerAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [newAddress, setNewAddress] = useState({
    full_name: "",
    phone_number: "",
    address1: "",
    city: "",
    state: "",
    lga: "",
    postal_code: "",
    is_default: false
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const cartRef = useRef();

  const formatPrice = (price) => "₦" + Number(price).toLocaleString();

  // ---------------- Fetch Cart ----------------
  const fetchCart = async () => {
    setLoadingCart(true);
    try {
      const res = await axios.get("/cart", { withCredentials: true });
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      setCartItems(items);
      if (cartRef.current) cartRef.current(items.length);
    } catch (err) {
      console.error("❌ Error fetching cart:", err);
      setCartItems([]);
    } finally {
      setLoadingCart(false);
    }
  };

  // ---------------- Fetch Buyer Addresses ----------------
  const fetchAddresses = async () => {
    try {
      const res = await axios.get("/buyer/metadata", { withCredentials: true });
      const addrData = Array.isArray(res.data?.addresses) ? res.data.addresses : [];
      setAddresses(addrData);

      const defaultAddr = addrData.find((a) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setNewAddress({
          full_name: defaultAddr.full_name || "",
          phone_number: defaultAddr.phone_number || "",
          address1: defaultAddr.address1 || "",
          city: defaultAddr.city || "",
          state: defaultAddr.state || "",
          lga: defaultAddr.lga || "",
          postal_code: defaultAddr.postal_code || "",
          is_default: true
        });
      }
    } catch (err) {
      console.error("❌ Failed to fetch addresses:", err);
      setAddresses([]);
    }
  };

  // ---------------- On Mount ----------------
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchCart();
    fetchAddresses();
  }, [user, navigate]);

  // ---------------- Totals ----------------
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 0),
    0
  );

  const calculateShipping = () => {
    if (!cartItems.length) return 0;
    const allFree = cartItems.every((item) => item.free_shipping);
    if (allFree) return 0;
    const totalWeight = cartItems.reduce(
      (sum, item) => sum + (item.weight || 0) * (item.quantity || 0),
      0
    );
    const shippingFeePerKg = 500;
    return totalWeight * shippingFeePerKg;
  };

  const deliveryFee = calculateShipping();
  const total = subtotal + deliveryFee;

  // ---------------- Place Order ----------------
  const handleCheckout = async () => {
    if (!cartItems.length) return alert("Your cart is empty.");

    if (!newAddress.address1.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.lga.trim())
      return alert("Please provide a complete shipping address.");
    if (!newAddress.phone_number.trim())
      return alert("Please provide a phone number.");

    setProcessingPayment(true);

    try {
      const orderRes = await axios.post(
        "/orders",
        {
          items: cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product_weight: item.weight || 0,
            free_shipping: !!item.free_shipping,
          })),
          total_amount: total,
          subtotal,
          delivery_fee: deliveryFee,
          total_weight: cartItems.reduce((sum, item) => sum + (item.weight || 0) * (item.quantity || 0), 0),
          shipping_address: JSON.stringify(newAddress),
          payment_method: paymentMethod,
        },
        { withCredentials: true }
      );

      const orderData = orderRes?.data?.order;
      if (!orderData) throw new Error("Failed to place order");

      if (paymentMethod === "cod") {
        alert("✅ Order placed successfully! Cash on Delivery selected.");
      } else if (paymentMethod === "online") {
        alert("✅ Order created! Proceed to payment gateway.");
        // redirect to payment gateway with orderData.payment_url
      }

      navigate("/orders");
      fetchCart();
      if (onCartUpdateRef?.current) onCartUpdateRef.current();
    } catch (err) {
      console.error("❌ Checkout failed:", err);
      alert(err.response?.data?.error || err.message || "Checkout failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await axios.delete(`/buyer/metadata/${id}`, { withCredentials: true });
      fetchAddresses();
    } catch (err) {
      console.error("❌ Delete address error:", err);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await axios.patch(`/buyer/metadata/${id}/default`, {}, { withCredentials: true });
      fetchAddresses();
    } catch (err) {
      console.error("❌ Set default address error:", err);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.full_name || !newAddress.phone_number || !newAddress.address1 || !newAddress.city || !newAddress.state || !newAddress.lga) {
      return alert("Please fill all required fields for the address");
    }

    try {
      await axios.post("/buyer/metadata", newAddress, { withCredentials: true });
      setShowAddressModal(false);
      fetchAddresses();
      alert("Address added successfully!");
    } catch (err) {
      console.error("❌ Add address error:", err);
      alert(err.response?.data?.error || err.message || "Failed to add address");
    }
  };

  const lgasForState = newAddress.state ? SHIPPING_RATES[newAddress.state] : [];

  if (!user) return null;
  if (loadingCart) return <div className="p-4 text-center">Loading checkout...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Checkout</h2>

      {/* Cart Items */}
      {cartItems.length === 0 ? (
        <p className="text-center">Your cart is empty.</p>
      ) : (
        <div className="bg-white p-4 rounded shadow mb-6 space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between border-b pb-2">
              <span>{item.name} x {item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="text-right font-bold mt-2">Subtotal: {formatPrice(subtotal)}</div>
          <div className="text-right font-bold mt-1">Shipping Fee: {formatPrice(deliveryFee)}</div>
          <div className="text-right font-bold mt-1">Total: {formatPrice(total)}</div>
        </div>
      )}

      {/* Shipping Addresses */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Shipping Address</h3>
        {addresses.length > 0 && (
          <div className="space-y-2 mb-2">
            {addresses.map((addr) => (
              <label key={addr.id} className={`block p-2 border rounded cursor-pointer ${selectedAddressId === addr.id ? "border-blue-600 bg-blue-50" : ""}`}>
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === addr.id}
                  onChange={() => {
                    setSelectedAddressId(addr.id);
                    setNewAddress({
                      full_name: addr.full_name,
                      phone_number: addr.phone_number,
                      address1: addr.address1,
                      city: addr.city,
                      state: addr.state,
                      lga: addr.lga || "",
                      postal_code: addr.postal_code || "",
                      is_default: addr.is_default || false
                    });
                  }}
                  className="mr-2"
                />
                {addr.full_name} - {addr.phone_number} <br />
                {addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}, {addr.city}{addr.lga ? `, ${addr.lga}` : ''}, {addr.state}{addr.postal_code ? `, ${addr.postal_code}` : ''}
                {addr.is_default && <span className="ml-1 text-green-600">(Default)</span>}
              </label>
            ))}
          </div>
        )}

        <button onClick={() => setShowAddressModal(true)} className="bg-blue-500 text-white py-2 px-4 rounded mt-2">Add New Address</button>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start overflow-auto z-50 pt-20 px-2">
          <div className="bg-white rounded-lg w-full max-w-md p-4 space-y-3 shadow-lg max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold">Add New Address</h4>
              <button onClick={() => setShowAddressModal(false)} className="text-red-500 font-bold">X</button>
            </div>
            <form onSubmit={handleAddAddress} className="space-y-2">
              <input type="text" placeholder="Full Name" value={newAddress.full_name} onChange={e => setNewAddress({ ...newAddress, full_name: e.target.value })} className="w-full border p-2 rounded" />
              <input type="text" placeholder="Phone Number" value={newAddress.phone_number} onChange={e => setNewAddress({ ...newAddress, phone_number: e.target.value })} className="w-full border p-2 rounded" />
              <input type="text" placeholder="Address 1" value={newAddress.address1} onChange={e => setNewAddress({ ...newAddress, address1: e.target.value })} className="w-full border p-2 rounded" />
              <input type="text" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full border p-2 rounded" />
              <select value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value, lga: '' })} className="w-full border p-2 rounded">
                <option value="">Select State</option>
                {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
              <select value={newAddress.lga} onChange={e => setNewAddress({ ...newAddress, lga: e.target.value })} className="w-full border p-2 rounded" disabled={!lgasForState.length}>
                <option value="">{lgasForState.length ? "Select LGA" : "No LGAs available"}</option>
                {lgasForState.map(lga => <option key={lga} value={lga}>{lga}</option>)}
              </select>
              <input type="text" placeholder="Postal Code" value={newAddress.postal_code} onChange={e => setNewAddress({ ...newAddress, postal_code: e.target.value })} className="w-full border p-2 rounded" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={newAddress.is_default} onChange={e => setNewAddress({ ...newAddress, is_default: e.target.checked })} />
                Set as default
              </label>
              <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Add Address</button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="mb-6">
        <h3 className="font-semibold mb-1">Payment Method</h3>
        <label className="border rounded p-2 cursor-pointer border-blue-600 bg-blue-50 block mb-1">
          <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="mr-2" />
          Cash on Delivery
        </label>
        <label className="border rounded p-2 cursor-pointer border-green-600 bg-green-50 block">
          <input type="radio" name="payment" value="online" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} className="mr-2" />
          Online Payment
        </label>
      </div>

      {/* Place Order */}
      <button onClick={handleCheckout} disabled={processingPayment || !cartItems.length} className={`w-full py-2 px-4 rounded text-white ${processingPayment ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
        {processingPayment ? "Processing..." : "Place Order"}
      </button>
    </div>
  );
}

