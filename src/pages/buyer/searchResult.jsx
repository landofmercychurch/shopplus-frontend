import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DOMPurify from "dompurify"; // sanitize inputs
import axios from "../../utils/axiosPublic"; // ⬅ PUBLIC INSTANCE
import ProductCard from "../../components/ProductCard";
import StoreCard from "../../components/buyer/StoreCard";

export default function SearchResults() {
  const location = useLocation();
  const rawQuery = new URLSearchParams(location.search).get("q") || "";
  const query = DOMPurify.sanitize(rawQuery); // sanitize URL query

  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [activeTab, setActiveTab] = useState("products");

  const fetchResults = async () => {
    setLoading(true);

    try {
      const params = {
        query,
        category: DOMPurify.sanitize(category),
        minPrice: Number(priceRange[0]) || 0,
        maxPrice: Number(priceRange[1]) || 100000,
      };

      const res = await axios.get("/search", { params });

      if (res.data.success) {
        setProducts(Array.isArray(res.data.products) ? res.data.products : []);
        setStores(Array.isArray(res.data.stores) ? res.data.stores : []);
        setCampaigns(Array.isArray(res.data.campaigns) ? res.data.campaigns : []);
      } else {
        setProducts([]);
        setStores([]);
        setCampaigns([]);
      }
    } catch (err) {
      console.error("Search fetch error:", err);
      setProducts([]);
      setStores([]);
      setCampaigns([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchResults();
  }, [query, category, priceRange]);

  if (loading) return <div className="p-4 text-center">Searching...</div>;

  const sanitizeText = (text) => DOMPurify.sanitize(text || "");

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* Filters */}
      <div className="w-full md:w-1/4 flex-shrink-0 mb-4 md:mb-0">
        <h3 className="font-bold mb-2">Filters</h3>

        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(DOMPurify.sanitize(e.target.value))}
          className="border rounded px-2 py-1 mb-4 w-full"
        />

        <div className="flex gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([Number(e.target.value) || 0, priceRange[1]])
            }
            placeholder="Min"
            className="border rounded px-2 py-1 w-1/2"
          />

          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], Number(e.target.value) || 100000])
            }
            placeholder="Max"
            className="border rounded px-2 py-1 w-1/2"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1">
        <div className="mb-4 flex gap-2">
          {["products", "stores", "campaigns"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded font-medium ${
                activeTab === tab ? "bg-indigo-600 text-white" : "bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Stores */}
        {activeTab === "stores" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stores.length > 0
              ? stores.map((store) => <StoreCard key={store.id} store={store} />)
              : <p>No stores found.</p>}
          </div>
        )}

        {/* Products */}
        {activeTab === "products" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.length > 0
              ? products.map((product) => <ProductCard key={product.id} product={product} />)
              : <p>No products found.</p>}
          </div>
        )}

        {/* Campaigns */}
        {activeTab === "campaigns" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {campaigns.length > 0
              ? campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="border rounded overflow-hidden shadow hover:shadow-lg transition"
                  >
                    <img
                      src={sanitizeText(c.banner_url) || "/default-campaigns-banner.png"}
                      alt={sanitizeText(c.title)}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-2">
                      <p className="font-semibold">{sanitizeText(c.title)}</p>
                    </div>
                  </div>
                ))
              : <p>No campaigns found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

