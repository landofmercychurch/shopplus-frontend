import React from "react";
import ProductCard from "./ProductCard";

export const ProductList = ({ products = [], onDelete }) => {
  if (!products.length) {
    return (
      <div className="text-center py-12 text-gray-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-16 w-16 mb-4 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3v18h18V3H3zm5 7h4m-4 4h4"
          />
        </svg>
        <p className="mb-2 text-lg font-medium">No products added yet.</p>
        <p className="text-sm text-gray-500">
          Start by adding your first product to showcase it in your store.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default ProductList;

