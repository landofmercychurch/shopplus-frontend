// src/components/shared/FooterCard.jsx
import React from 'react';
import DOMPurify from 'dompurify';

export default function FooterCard({ title, links, loading = false }) {
  if (loading) {
    // Shimmer skeleton
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

  return (
    <div className="flex flex-col gap-2">
      <h3
        className="font-bold text-gray-800 mb-2"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }}
      />
      <ul className="flex flex-col gap-1 text-gray-600 text-sm">
        {links.map((link, idx) =>
          link.url ? (
            <li key={idx}>
              <a
                href={DOMPurify.sanitize(link.url)}
                target={link.url.startsWith('http') ? '_blank' : '_self'}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="hover:text-indigo-600 transition break-words"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(link.label) }}
              />
            </li>
          ) : (
            <li key={idx} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(link.label) }} />
          )
        )}
      </ul>
    </div>
  );
}

