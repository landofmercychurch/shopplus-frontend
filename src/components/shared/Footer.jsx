// src/components/shared/Footer.jsx
import React, { useState, useEffect } from 'react';
import FooterCard from './FooterCard';

export default function Footer() {
  const [loading, setLoading] = useState(true);

  // Simulate loading (replace with real fetch if needed)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800); // 0.8s shimmer
    return () => clearTimeout(timer);
  }, []);

  const footerSections = [
    {
      title: 'Company',
      links: [
        { label: 'About Us', url: '/about' },
        { label: 'Careers', url: '/careers' },
        { label: 'Press', url: '/press' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', url: '/help' },
        { label: 'Returns', url: '/returns' },
        { label: 'Shipping Info', url: '/shipping' },
      ],
    },
    {
      title: 'Follow Us',
      links: [
        { label: 'Facebook', url: 'https://facebook.com' },
        { label: 'Instagram', url: 'https://instagram.com' },
        { label: 'Twitter', url: 'https://twitter.com' },
      ],
    },
    {
      title: 'Payments',
      links: [
        { label: 'Visa' },
        { label: 'MasterCard' },
        { label: 'PayPal' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-50 border-t mt-10 p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
        {footerSections.map((section, idx) => (
          <FooterCard key={idx} title={section.title} links={section.links} loading={loading} />
        ))}
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} ShopPlus. All rights reserved.
      </div>
    </footer>
  );
}

