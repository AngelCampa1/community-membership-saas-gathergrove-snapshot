"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import posthog from "posthog-js";
import { TurnstileWidget } from "@/components/marketing/TurnstileWidget";
import { marketingService } from "@/services/marketingService";

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setIsSubmitting(true);
    setError("");

    // Route through the shared marketing service so the request reaches the
    // backend (apiClient base URL + CSRF/credential handling) instead of a raw
    // fetch to a relative URL that resolves to the Next.js frontend origin.
    const result = await marketingService.captureNewsletterLead({
      email,
      source: "newsletter",
      companyWebsite,
      turnstileToken,
    });

    if (result.success) {
      if (typeof window !== "undefined") {
        posthog.capture("newsletter_subscribed", { source: "footer" });
      }
      setSubmitted(true);
      setEmail("");
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <p className="text-sm text-success font-medium mt-3">
        Thanks for subscribing! Keep an eye on your inbox for club management tips.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="footer-company-website">Company website</label>
          <input
            id="footer-company-website"
            name="company_website"
            type="text"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="Your email"
          aria-label="Email address"
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Subscribe"}
        </button>
      </form>
      <div className="mt-2 max-w-sm">
        <TurnstileWidget onTokenChange={setTurnstileToken} />
      </div>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      <p className="text-xs text-muted-foreground mt-1.5">Weekly club management tips. No spam.</p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="w-full bg-muted/50 border-t">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center">
              <Image
                src="/logos/horizontal-logo.png"
                alt="GatherGrove"
                width={160}
                height={53}
                className="h-8 w-auto"
              />
            </div>
            <p className="text-muted-foreground max-w-md">
              Simple, affordable membership and event management for organizations of all types.
            </p>
            <NewsletterSignup />
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/for" className="text-muted-foreground hover:text-foreground transition-colors">
                  Club Types
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Learn</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/resources" className="text-muted-foreground hover:text-foreground transition-colors">
                  Resource Library
                </Link>
              </li>
              <li>
                <Link href="/glossary" className="text-muted-foreground hover:text-foreground transition-colors">
                  Glossary
                </Link>
              </li>
              <li>
                <Link href="/how-to-start" className="text-muted-foreground hover:text-foreground transition-colors">
                  Formation Guides
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-muted-foreground hover:text-foreground transition-colors">
                  Compare Platforms
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/alternatives" className="text-muted-foreground hover:text-foreground transition-colors">
                  Alternatives
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-muted-foreground hover:text-foreground transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/volunteer-management" className="text-muted-foreground hover:text-foreground transition-colors">
                  Volunteer Management
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-muted-foreground hover:text-foreground transition-colors">
                  Free Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Get Started Section - Simplified */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <h3 className="font-semibold">Get Started</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full sm:w-auto"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full sm:w-auto"
                >
                  See All Features
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GatherGrove. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
