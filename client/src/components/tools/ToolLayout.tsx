import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  relatedLinks?: Array<{ label: string; href: string }>;
}

export default function ToolLayout({
  title,
  description,
  children,
  relatedLinks,
}: ToolLayoutProps) {
  const hasRelatedLinks = relatedLinks && relatedLinks.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li>
            <Link href="/tools" className="hover:text-foreground transition-colors">
              Free Tools
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li>
            <span aria-current="page" className="text-foreground font-medium">
              {title}
            </span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-lg">{description}</p>
      </header>

      {/* Tool content */}
      <section>{children}</section>

      {/* Related links */}
      {hasRelatedLinks && (
        <footer className="border-t pt-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Related resources:
          </p>
          <ul className="flex flex-wrap gap-4">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-primary hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      )}
      </div>
      <Footer />
    </div>
  );
}
