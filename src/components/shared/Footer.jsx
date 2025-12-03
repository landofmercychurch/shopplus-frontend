// src/components/shared/Footer.jsx
import React, { useState, useEffect } from 'react';
import FooterCard from './FooterCard';

export default function Footer() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800); // shimmer effect
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
    <footer className="bg-gray-50 border-t mt-12">
      {/* Footer Cards */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {footerSections.map((section, idx) => (
          <FooterCard key={idx} title={section.title} links={section.links} loading={loading} />
        ))}
      </div>

      {/* Social & Payment Icons */}
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6">
        <div className="flex gap-4 text-gray-500 text-xl">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
            <i className="fab fa-facebook-f" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
            <i className="fab fa-instagram" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
            <i className="fab fa-twitter" />
          </a>
        </div>

        <div className="flex gap-4 text-gray-400 text-sm">
          <span>Visa</span>
          <span>MasterCard</span>
          <span>PayPal</span>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-6 text-center text-gray-500 text-sm pb-6">
        &copy; {new Date().getFullYear()} ShopPlus. All rights reserved.
      </div>
    </footer>
  );
}

