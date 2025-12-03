import React from 'react';
import DOMPurify from 'dompurify';
import { FaFacebookF, FaInstagram, FaTwitter, FaCcVisa, FaCcMastercard, FaCcPaypal } from 'react-icons/fa';

export default function FooterCard({ title, links, loading = false }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
        <ul className="flex flex-col gap-1">
          {[...Array(4)].map((_, i) => (
            <li key={i} className="h-3 w-full bg-gray-200 rounded"></li>
          ))}
        </ul>
      </div>
    );
  }

  const renderIcon = (label) => {
    const key = label.toLowerCase();
    if (key.includes('facebook')) return <FaFacebookF className="inline text-blue-600" />;
    if (key.includes('instagram')) return <FaInstagram className="inline text-pink-500" />;
    if (key.includes('twitter')) return <FaTwitter className="inline text-blue-400" />;
    if (key.includes('visa')) return <FaCcVisa className="inline text-blue-700" />;
    if (key.includes('mastercard')) return <FaCcMastercard className="inline text-red-600" />;
    if (key.includes('paypal')) return <FaCcPaypal className="inline text-blue-500" />;
    return null;
  };

  return (
    <div className="flex flex-col gap-2">
      <h3
        className="font-bold text-gray-800 mb-2"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }}
      />
      <ul className="flex flex-col gap-1 text-gray-600 text-sm">
        {links.map((link, idx) => {
          const icon = renderIcon(link.label);

          return link.url ? (
            <li key={idx}>
              <a
                href={DOMPurify.sanitize(link.url)}
                target={link.url.startsWith('http') ? '_blank' : '_self'}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="hover:text-indigo-600 transition break-words flex items-center gap-1"
              >
                {icon}
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(link.label) }} />
              </a>
            </li>
          ) : (
            <li key={idx} className="flex items-center gap-1">
              {icon}
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(link.label) }} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

