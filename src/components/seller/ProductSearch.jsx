import React, { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";

export const ProductSearch = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  // Debounced search to reduce frequent calls
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(query.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  // Reset search
  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className="w-full max-w-lg mx-auto my-4">
      <label
        htmlFor="product-search"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Search Products
      </label>

      <div className="relative flex items-center">
        {/* Search Icon */}
        <Search className="absolute left-3 text-gray-400 w-5 h-5 pointer-events-none" />

        {/* Input Field */}
        <input
          id="product-search"
          type="text"
          placeholder="Search for products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
          aria-label="Search products"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 rounded"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

