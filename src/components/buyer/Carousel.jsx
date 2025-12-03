import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

export default function Carousel({ items, type }) {
  return (
    <motion.div className="flex overflow-x-scroll gap-4 py-2 px-2" drag="x">
      {items.map((item) => {
        const safeName = DOMPurify.sanitize(item.name || '');
        const safeImage = DOMPurify.sanitize(
          type === 'campaign'
            ? item.banner_url || '/default-campaigns-banner.png'
            : item.image_url || type === 'category' ? '/category-placeholder.png' : '/product-placeholder.png'
        );

        return (
          <motion.div
            key={item.id}
            className="min-w-[200px] rounded shadow p-2 bg-white"
            whileHover={{ scale: 1.05 }}
          >
            {type === 'product' && (
              <>
                <img src={safeImage} alt={safeName} className="w-full h-32 object-cover rounded" />
                <h3 className="font-semibold mt-1">{safeName}</h3>
                {item.price && <p className="text-indigo-600 font-bold">₦{item.price}</p>}
              </>
            )}
            {type === 'campaign' && (
              <>
                <img src={safeImage} alt={safeName} className="w-full h-36 object-cover rounded" />
                <h3 className="font-semibold mt-1">{safeName}</h3>
                {item.discount_percent && <p className="text-red-600 font-bold">{item.discount_percent}% OFF</p>}
              </>
            )}
            {type === 'category' && (
              <>
                <img src={safeImage} alt={safeName} className="w-16 h-16 object-cover rounded-full mx-auto" />
                <p className="text-center mt-1 font-medium">{safeName}</p>
              </>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

