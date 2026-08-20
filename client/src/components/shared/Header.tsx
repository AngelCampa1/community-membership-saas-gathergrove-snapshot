"use client";

import posthog from "posthog-js";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X } from "lucide-react";
import { GLASSMORPHISM } from "@/utils/chartColors";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const pathname = usePathname();

  const detectActiveSection = useCallback(() => {
    const sectionIds = ["features", "roi", "pricing"];
    const headerOffset = 100;
    let found: string | null = null;
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= headerOffset && rect.bottom > headerOffset) {
          found = id;
          break;
        }
      }
    }
    setActiveSection(found);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
      detectActiveSection();
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [detectActiveSection]);

  const scrollToSection = (sectionId: string) => {
    const headerOffset = 80;
    const scrollToElement = (el: HTMLElement) => {
      const pos = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: pos - headerOffset, behavior: "smooth" });
    };

    const element = document.getElementById(sectionId);
    if (element) {
      scrollToElement(element);
    } else {
      // Element may not exist yet (lazy-loaded). Scroll down to trigger lazy load,
      // then use requestAnimationFrame retry pattern to wait for it.
      window.scrollTo({ top: window.scrollY + window.innerHeight, behavior: "smooth" });
      let attempts = 0;
      const maxAttempts = 20;
      const tryScroll = () => {
        const el = document.getElementById(sectionId);
        if (el) {
          scrollToElement(el);
        } else if (attempts < maxAttempts) {
          attempts++;
          requestAnimationFrame(tryScroll);
        }
      };
      requestAnimationFrame(tryScroll);
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (sectionId: string) => {
    if (pathname === '/') {
      scrollToSection(sectionId);
    }
    // On non-homepage routes the Link href takes over for navigation
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const headerStyles = {
    background: `linear-gradient(135deg, ${GLASSMORPHISM.light.background} 0%, ${GLASSMORPHISM.light.backgroundSubtle} 100%)`,
    borderBottom: isScrolled
      ? `1px solid ${GLASSMORPHISM.light.border}`
      : '1px solid transparent',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    boxShadow: isScrolled
      ? `${GLASSMORPHISM.light.shadow}, ${GLASSMORPHISM.light.shadowInset}`
      : `inset 0 1px 0 ${GLASSMORPHISM.light.insetBorder}`
  };

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={headerStyles}
      role="banner"
    >
      <div className={`container mx-auto flex items-center justify-between px-4 transition-all duration-300 ${
        isScrolled ? "h-14" : "h-16"
      }`}>
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/favicon.svg"
            alt="GatherGrove"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
            unoptimized
          />
          <span className="ml-3 text-xl font-bold">GatherGrove</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6" role="navigation">
          <Link
            href="/features"
            onClick={() => handleNavClick("features")}
            className={`text-sm font-medium hover:text-primary transition-all duration-200 cursor-pointer px-3 py-2 rounded-md hover:bg-primary/5 focus-ring relative group ${activeSection === "features" ? "text-primary" : ""}`}
          >
            Features
            <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-200 ${activeSection === "features" ? "w-full" : "w-0 left-1/2 group-hover:w-full group-hover:left-0"}`}></span>
          </Link>
          <Link
            href="/#roi"
            onClick={(e) => { if (pathname === '/') { e.preventDefault(); scrollToSection("roi"); } }}
            className={`text-sm font-medium hover:text-primary transition-all duration-200 cursor-pointer px-3 py-2 rounded-md hover:bg-primary/5 focus-ring relative group ${activeSection === "roi" ? "text-primary" : ""}`}
          >
            ROI Calculator
            <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-200 ${activeSection === "roi" ? "w-full" : "w-0 left-1/2 group-hover:w-full group-hover:left-0"}`}></span>
          </Link>
          <Link
            href="/pricing"
            onClick={() => handleNavClick("pricing")}
            className={`text-sm font-medium hover:text-primary transition-all duration-200 cursor-pointer px-3 py-2 rounded-md hover:bg-primary/5 focus-ring relative group ${activeSection === "pricing" ? "text-primary" : ""}`}
          >
            Pricing
            <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-200 ${activeSection === "pricing" ? "w-full" : "w-0 left-1/2 group-hover:w-full group-hover:left-0"}`}></span>
          </Link>

          {/* Visual separator before Resources */}
          <div className="h-6 w-px bg-border mx-2"></div>

          <Link
            href="/resources"
            className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2 rounded-md hover:bg-primary/5 focus-ring relative group"
          >
            Resources
            <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full group-hover:left-0"></span>
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {/* Mobile compact CTA - visible without opening menu */}
          <div className="md:hidden mr-1">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 min-h-[36px] whitespace-nowrap transition-colors duration-200"
              data-testid="button-signup-mobile-header"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9 p-2"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 min-h-[44px]"
              data-testid="link-login"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 min-h-[44px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
              data-testid="button-signup"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  posthog.capture('header_cta_clicked', { location: 'header', cta: 'start_free_trial' });
                }
              }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 z-40 border-t border-border"
          style={{
            background: `linear-gradient(135deg, ${GLASSMORPHISM.light.backgroundStrong} 0%, ${GLASSMORPHISM.light.background} 100%)`,
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          }}
        >
          <nav className="container mx-auto px-4 py-4 space-y-2" role="navigation">
            <Link
              href="/features"
              onClick={() => handleNavClick("features")}
              className={`block w-full text-left text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-3 rounded-md hover:bg-primary/5 focus-ring ${activeSection === "features" ? "text-primary bg-primary/5" : ""}`}
            >
              Features
            </Link>
            <Link
              href="/#roi"
              onClick={(e) => { if (pathname === '/') { e.preventDefault(); scrollToSection("roi"); } }}
              className={`block w-full text-left text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-3 rounded-md hover:bg-primary/5 focus-ring ${activeSection === "roi" ? "text-primary bg-primary/5" : ""}`}
            >
              ROI Calculator
            </Link>
            <Link
              href="/pricing"
              onClick={() => handleNavClick("pricing")}
              className={`block w-full text-left text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-3 rounded-md hover:bg-primary/5 focus-ring ${activeSection === "pricing" ? "text-primary bg-primary/5" : ""}`}
            >
              Pricing
            </Link>

            {/* Separator before Resources */}
            <div className="border-t border-border my-2"></div>

            <Link
              href="/resources"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-3 rounded-md hover:bg-primary/5 focus-ring"
            >
              Resources
            </Link>

            {/* Mobile CTA Buttons */}
            <div className="flex flex-col space-y-2 pt-4 mt-4 border-t border-border">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
                data-testid="link-login-mobile"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
                data-testid="button-signup-mobile"
              >
                Start Free Trial
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
