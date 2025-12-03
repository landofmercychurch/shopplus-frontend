import React from "react";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";

export default function CategoryCard({ category, loading = false }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-200 animate-pulse rounded-xl w-28 h-28 md:w-32 md:h-32 p-3">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-300 rounded mb-2" />
        <div className="h-3 w-16 bg-gray-300 rounded" />
      </div>
    );
  }

  const safeName = DOMPurify.sanitize(category.name);
  const safeImage = DOMPurify.sanitize(category.image_url || "/category-placeholder.png");

  return (
    <Link
      to={`/category/${encodeURIComponent(safeName)}`}
      className="flex flex-col items-center justify-center bg-white hover:shadow-lg transition-transform transform hover:-translate-y-1 rounded-xl w-28 h-28 md:w-32 md:h-32 p-3 flex-shrink-0"
    >
      <img
        src={safeImage}
        alt={safeName}
        className="w-12 h-12 md:w-14 md:h-14 object-cover mb-2 rounded-full"
      />
      <span className="text-xs md:text-sm font-medium text-center truncate">
        {safeName}
      </span>
    </Link>
  );
}

