// src/pages/PaymentInstructions.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { getValidToken, fetchWithAuth } from "../../services/authService";

// Simple shimmer skeleton for loading
function SkeletonRow({ width = "full", height = "4" }) {
  return (
    <div
      className={`animate-pulse bg-gray-300 rounded mb-2`}
      style={{ width: width === "full" ? "100%" : width, height: `${height}rem` }}
    />
  );
}

export default function PaymentInstructions() {
  const { orderId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      setError("");
      try {
        const token = await getValidToken();
        if (!token) throw new Error("User not authenticated");

        const data = await fetchWithAuth(`/payments/${orderId}`, token);

        // Backend should verify order belongs to this user
        if (!data || !data.method) throw new Error("Payment info not found or invalid");

        // Sanitize any user-supplied strings
        const sanitizedData = {
          ...data,
          method: DOMPurify.sanitize(data.method),
          transaction_ref: data.transaction_ref ? DOMPurify.sanitize(data.transaction_ref) : "",
        };

        setPayment(sanitizedData);
      } catch (err) {
        console.error("❌ Payment fetch error:", err);
        setError(err.message || "Failed to load payment info.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [orderId, navigate]);

  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-3">
        <SkeletonRow width="60%" height="6" />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow width="80%" />
        <SkeletonRow />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!payment) return null;

  const { method, amount, transaction_ref, status } = payment;

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-2">Payment Instructions</h2>

      {status === "successful" ? (
        <div className="p-4 bg-green-100 text-green-800 rounded text-center font-semibold">
          Payment completed successfully!
        </div>
      ) : (
        <>
          <p className="text-gray-700">
            Your order has been placed. Complete the payment below to confirm your order.
          </p>

          <div className="bg-white p-4 rounded shadow space-y-3">
            <p>
              <span className="font-semibold">Payment Method:</span>{" "}
              {method === "card" ? "Card Payment" : method === "bank" ? "Bank Transfer" : "Other"}
            </p>

            <p>
              <span className="font-semibold">Amount:</span> ₦{Number(amount).toLocaleString()}
            </p>

            {method !== "cod" && transaction_ref && (
              <p>
                <span className="font-semibold">Transaction Reference:</span>{" "}
                {transaction_ref}{" "}
                <button
                  onClick={() => copyToClipboard(transaction_ref)}
                  className="ml-2 text-sm text-blue-600 underline"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </p>
            )}

            {method === "bank" && (
              <div className="p-2 bg-gray-50 border rounded space-y-1">
                <p className="font-semibold">Bank Details:</p>
                <p>Bank: XYZ Bank</p>
                <p>Account Name: MyShop Ltd.</p>
                <p>
                  Account Number: 1234567890{" "}
                  <button
                    onClick={() => copyToClipboard("1234567890")}
                    className="ml-2 text-sm text-blue-600 underline"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </p>
                <p className="text-xs text-gray-500">Use the transaction reference above as narration.</p>
              </div>
            )}

            {method === "card" && (
              <div className="p-2 bg-gray-50 border rounded text-gray-700">
                Complete your card payment using the secure payment gateway.
              </div>
            )}

            <p className="text-gray-500 text-sm mt-2">
              Once payment is confirmed, your order will be processed immediately.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

