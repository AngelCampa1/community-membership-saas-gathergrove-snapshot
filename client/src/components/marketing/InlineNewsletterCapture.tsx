"use client";

import { useState } from "react";

// TODO: Replace localStorage with API call to newsletter backend when available
export function InlineNewsletterCapture() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      const existing = JSON.parse(localStorage.getItem("newsletter_emails") || "[]");
      if (!existing.includes(email)) {
        existing.push(email);
        localStorage.setItem("newsletter_emails", JSON.stringify(existing));
      }
    } catch {
      localStorage.setItem("newsletter_emails", JSON.stringify([email]));
    }
    setSubmitted(true);
    setEmail("");
  };

  if (submitted) {
    return (
      <div className="text-center py-6 px-4 bg-success/5 rounded-lg border border-success/20">
        <p className="text-success font-medium">Thanks for subscribing! Check your inbox soon.</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-6 bg-muted/50 rounded-lg border border-border">
      <div className="max-w-xl mx-auto text-center">
        <p className="font-semibold mb-2">Get more guides like this delivered to your inbox</p>
        <p className="text-sm text-muted-foreground mb-4">Weekly club management tips. No spam.</p>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            aria-label="Email address"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
}
