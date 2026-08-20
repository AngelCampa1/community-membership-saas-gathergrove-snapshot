"use client";

import React from 'react';

interface SkipLinksProps {
  className?: string;
}

export default function SkipLinks({ className = '' }: SkipLinksProps) {
  const skipLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#primary-navigation', text: 'Skip to navigation' },
    { href: '#search', text: 'Skip to search' },
    { href: '#footer', text: 'Skip to footer' }
  ];

  return (
    <div className={`skip-links ${className}`}>
      {skipLinks.map(({ href, text }) => (
        <a
          key={href}
          href={href}
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onFocus={(e) => {
            e.currentTarget.classList.remove('sr-only');
          }}
          onBlur={(e) => {
            e.currentTarget.classList.add('sr-only');
          }}
        >
          {text}
        </a>
      ))}
    </div>
  );
}