import { Link } from 'react-router-dom';

export default function ProductCard({ product, onDelete }) {
  const price = product?.price ? Number(product.price).toFixed(2) : '0.00';
  const name = product?.name || 'Unnamed Product';
  const category = product?.category || '-';
  const imageUrl = product?.image_url || '/product-placeholder.png';

  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-lg transition bg-white">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-40 object-cover mb-2 rounded"
      />
      <h3 className="font-semibold text-gray-800">{name}</h3>
      <p className="text-sm text-gray-600">{category}</p>
      <p className="font-bold mt-1 text-gray-900">₦{price}</p>
      <div className="mt-3 flex gap-2">
        <Link
          to={`/seller/product/${product?.id}/edit`}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
        >
          Edit
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(product?.id)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

