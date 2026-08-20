'use client';

import Script from 'next/script';

declare global {
  interface Window {
    hj: (...args: unknown[]) => void;
    _hjSettings: { hjid: number; hjsv: number };
  }
}

const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
const HOTJAR_SV = process.env.NEXT_PUBLIC_HOTJAR_SV;

export default function Hotjar() {
  if (!HOTJAR_ID || !HOTJAR_SV) return null;

  return (
    <Script id="hotjar" strategy="afterInteractive">
      {`
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:${Number(HOTJAR_ID)},hjsv:${Number(HOTJAR_SV)}};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `}
    </Script>
  );
}

