// Server Component — no 'use client'. Critical CSS is a hardcoded constant
// (not user input) so no runtime sanitization is needed.

// Critical CSS for above-the-fold content
const criticalCSS = `
  /* Critical styles for first contentful paint */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  html {
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  body {
    font-family: var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
    margin: 0;
    background-color: var(--background);
    color: var(--foreground);
  }
  
  /* Critical layout styles */
  .min-h-screen {
    min-height: 100vh;
  }
  
  .bg-background {
    background-color: var(--background);
  }
  
  /* Hero section critical styles */
  .hero-section {
    padding: 4rem 1rem 2rem;
    text-align: center;
    background-color: var(--background);
    min-height: 80vh; /* Reserve minimum space to prevent CLS */
  }
  
  .hero-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0 0 1rem 0;
    color: var(--foreground);
    line-height: 1.2;
    min-height: 3rem; /* Reserve space for title */
  }
  
  .hero-description {
    font-size: 1.25rem;
    color: var(--muted-foreground);
    margin: 0 auto 2rem auto;
    max-width: 600px;
    min-height: 2.5rem; /* Reserve space for description */
  }
  
  .cta-button {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 2rem;
    background-color: var(--primary);
    color: var(--primary-foreground);
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: background-color 0.2s ease;
  }
  
  .cta-button:hover {
    background-color: var(--primary);
    opacity: 0.9;
  }
  
  /* Header critical styles */
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background-color: var(--background);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
  }
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--foreground);
    text-decoration: none;
  }
  
  .nav-links {
    display: none;
    gap: 2rem;
  }
  
  @media (min-width: 640px) {
    .nav-links {
      display: flex;
    }
    .hero-title {
      font-size: 3.5rem;
    }
    .hero-section {
      padding: 6rem 1rem 4rem;
    }
  }
  
  /* Loading states */
  .skeleton {
    background-color: var(--muted);
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Layout stabilization */
  .platform-preview-container {
    min-height: 400px;
    aspect-ratio: 16/10;
    width: 100%;
  }
  
  .section-spacing {
    padding: 4rem 0;
  }
  
  /* Prevent CLS from dynamic content */
  [data-lazy-loaded="false"] {
    min-height: 200px;
    background-color: var(--muted);
  }
  
  /* Theme-aware styling is handled by the theme system in globals.css */
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default function CriticalCSS() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: criticalCSS,
      }}
    />
  );
}