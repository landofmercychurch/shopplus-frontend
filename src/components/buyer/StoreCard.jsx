import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';

export default function StoreCard({ store }) {
  const logo = store?.logo_url || '/store-placeholder.png';
  const name = DOMPurify.sanitize(store?.name || 'Unnamed Store');
  const address = DOMPurify.sanitize(store?.address || 'Address not provided');
  const id = store?.id;

  return (
    <div className="border rounded shadow p-4 hover:shadow-lg transition flex flex-col items-center bg-white">
      
      <img
        src={logo}
        alt={name}
        className="w-24 h-24 object-cover rounded-full border-2 border-gray-200"
      />

      <h2 className="font-semibold mt-3 text-gray-800 text-center truncate w-full">
        {name}
      </h2>

      <p className="text-gray-500 text-sm mt-1 text-center truncate w-full">
        {address}
      </p>

      <Link
        to={id ? `/store/${id}` : "#"}
        className="mt-3 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1 rounded font-medium transition"
      >
        Visit Store
      </Link>
    </div>
  );
}      
