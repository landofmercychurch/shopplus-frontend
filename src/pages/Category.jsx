// src/pages/Category.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../utils/axiosPublic"; // PUBLIC API INSTANCE
import DOMPurify from "dompurify";
import ProductCard from "../components/ProductCard";

export default function Category() {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/products", {
        params: { category: categoryName },
      });
      const result = Array.isArray(res.data) ? res.data : res.data.products || [];
      // sanitize product names and descriptions
      const sanitizedProducts = result.map((p) => ({
        ...p,
        name: DOMPurify.sanitize(p.name),
        description: DOMPurify.sanitize(p.description || ""),
      }));
      setProducts(sanitizedProducts);
    } catch (err) {
      console.error("Error fetching category products:", err);
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategoryProducts();
  }, [categoryName]);

  // -------------------- Shimmer Skeleton --------------------
  if (loading) {
    return (
      <div className="p-4 pb-20">
        <h2 className="text-xl font-bold mb-4">{DOMPurify.sanitize(categoryName)}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-2">
              <div className="w-full aspect-square bg-gray-200 rounded-md" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <p className="text-center mt-10 text-gray-500">
        No products found in this category.
      </p>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold mb-4">{DOMPurify.sanitize(categoryName)}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map((product) => (
          <div key={product.id} className="flex flex-col">
            <ProductCard
              product={product}
              className="w-full aspect-square sm:aspect-[4/5] md:aspect-[3/4]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

