import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { GoBackButton } from "@/components/shared/GoBackButton";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "Sorry, we couldn't find the page you're looking for. It may have been moved or doesn't exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        {/* Logo */}
        <Link href="/" className="inline-block">
          <Image
            src="/icon-192x192.png"
            alt="GatherGrove"
            width={64}
            height={64}
            className="mx-auto"
          />
        </Link>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
            It may have been moved or doesn&apos;t exist.
          </p>
        </div>

        {/* Navigation Options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
          <GoBackButton />
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-border mt-8">
          <p className="text-sm text-muted-foreground mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/login" className="text-primary hover:underline">Login</Link>
            <Link href="/register" className="text-primary hover:underline">Sign Up</Link>
            <Link href="/resources" className="text-primary hover:underline">Resources</Link>
            <Link href="/support" className="text-primary hover:underline">Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
