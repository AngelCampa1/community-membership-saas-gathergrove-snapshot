"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { GLASSMORPHISM } from "@/utils/chartColors";

export function MinimalistHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

        {/* Minimalist Navigation */}
        <nav className="hidden md:flex items-center space-x-6" role="navigation">
          <Link 
            href="/"
            className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2 rounded-md hover:bg-primary/5 focus-ring"
          >
            Home
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <Link 
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 min-h-[44px]"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 min-h-[44px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile CTAs */}
          <div className="flex md:hidden items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 whitespace-nowrap transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
