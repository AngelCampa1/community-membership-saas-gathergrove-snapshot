"use client";

import React, { useEffect, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';

interface AccessibilityAnnouncerProps {
  children: React.ReactNode;
}

export default function AccessibilityAnnouncer({ children }: AccessibilityAnnouncerProps) {
  const { announce } = useAccessibility();
  const routeRef = useRef<string>('');

  useEffect(() => {
    // Announce route changes for screen readers
    const currentRoute = window.location.pathname;
    if (routeRef.current !== currentRoute && routeRef.current !== '') {
      const routeName = getRouteAnnouncement(currentRoute);
      announce(`Navigated to ${routeName}`);
    }
    routeRef.current = currentRoute;
  }, [announce]);

  // Announce loading states
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Announce loading states
            if (element.getAttribute('aria-busy') === 'true') {
              announce('Content is loading');
            }
            
            // Announce form errors
            if (element.getAttribute('role') === 'alert') {
              const text = element.textContent;
              if (text) {
                announce(text);
              }
            }
            
            // Announce success messages
            if (element.classList.contains('success') || element.getAttribute('data-type') === 'success') {
              const text = element.textContent;
              if (text) {
                announce(`Success: ${text}`);
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-busy', 'role', 'data-type']
    });

    return () => observer.disconnect();
  }, [announce]);

  return <>{children}</>;
}

function getRouteAnnouncement(path: string): string {
  const routes: Record<string, string> = {
    '/': 'Home page',
    '/login': 'Login page',
    '/register': 'Registration page',
    '/admin': 'Admin dashboard',
    '/admin/members': 'Members management',
    '/admin/events': 'Events management',
    '/admin/communications': 'Communications',
    '/admin/settings': 'Settings',
    '/app': 'Member dashboard',
    '/app/profile': 'Member profile',
    '/app/events': 'Member events',
    '/app/directory': 'Member directory',
    '/forgot-password': 'Password reset',
    '/resources': 'Resources page',
    '/support': 'Support page',
    '/privacy-policy': 'Privacy policy',
    '/terms-of-service': 'Terms of service'
  };

  return routes[path] || `Page: ${path.split('/').pop() || 'Unknown'}`;
}