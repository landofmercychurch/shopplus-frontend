import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';

export default function CampaignHeroCard({ campaigns, slideInterval = 10000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  // ---------------- SAFE GUARDS ----------------
  const hasCampaigns = Array.isArray(campaigns) && campaigns.length > 0;

  useEffect(() => {
    if (!hasCampaigns) return;

    startAutoSlide();
    return () => clearInterval(intervalRef.current);
  }, [campaigns, slideInterval]);

  if (!hasCampaigns) return null;

  const campaign = campaigns[currentIndex];
  const discount = Number(campaign?.discount_percent) || 0;

  // ---------------- SLIDE FUNCTIONS ----------------
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? campaigns.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const startAutoSlide = () => {
    if (!hasCampaigns || campaigns.length <= 1) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(nextSlide, slideInterval);
  };

  const safeText = (text) => DOMPurify.sanitize(text || '');
  const safeUrl = (url) => DOMPurify.sanitize(url || '');

  return (
    <div
      className="relative w-full h-64 md:h-96 overflow-hidden rounded-xl"
      onMouseEnter={() => clearInterval(intervalRef.current)}  // pause on hover
      onMouseLeave={startAutoSlide}                            // resume
    >
      {/* ---------------- SLIDE ---------------- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={campaign?.id || `campaign-${currentIndex}`}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          <Link
            to={`/campaign/${campaign?.id}`}
            className="block w-full h-full relative"
          >
            <img
              src={safeUrl(campaign?.banner_url) || '/default-campaigns-banner.png'}
              alt={safeText(campaign?.name) || 'Campaign'}
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-4">
              <h2 className="text-white text-2xl md:text-4xl font-bold">
                {safeText(campaign?.name) || 'Unnamed Campaign'}
              </h2>

              {discount > 0 && (
                <p className="text-white text-lg md:text-2xl font-semibold mt-1">
                  {discount}% OFF
                </p>
              )}
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* ---------------- PREV/NEXT BUTTONS ---------------- */}
      {campaigns.length > 1 && (
        <>
          <button
            onClick={() => { prevSlide(); startAutoSlide(); }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded hover:bg-black/70 transition"
          >
            &#10094;
          </button>

          <button
            onClick={() => { nextSlide(); startAutoSlide(); }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded hover:bg-black/70 transition"
          >
            &#10095;
          </button>
        </>
      )}

      {/* ---------------- DOT INDICATORS ---------------- */}
      {campaigns.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
          {campaigns.map((_, index) => (
            <button
              key={index}
              onClick={() => { goToSlide(index); startAutoSlide(); }}
              className={`w-3 h-3 rounded-full transition ${
                index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

