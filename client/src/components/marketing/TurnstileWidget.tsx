'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import apiClient from '@/services/apiClient';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onTokenChange: (token: string) => void;
}

export function TurnstileWidget({ onTokenChange }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [siteKey, setSiteKey] = useState(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '');

  useEffect(() => {
    if (siteKey) {
      return;
    }

    let isMounted = true;

    apiClient
      .get<{ siteKey?: string }>('/marketing/turnstile/site-key')
      .then((response) => {
        if (isMounted && response.data.siteKey) {
          setSiteKey(response.data.siteKey);
        }
      })
      .catch(() => {
        if (isMounted) {
          onTokenChange('');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onTokenChange, siteKey]);

  useEffect(() => {
    if (!scriptReady || !siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onTokenChange,
      'expired-callback': () => onTokenChange(''),
      'error-callback': () => onTokenChange(''),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onTokenChange, scriptReady, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
