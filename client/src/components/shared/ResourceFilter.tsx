"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FileText, Clock } from "lucide-react";

interface Resource {
  title: string;
  description: string;
  category: string;
  readTime: string;
  href: string;
}

interface ResourceFilterProps {
  resources: Resource[];
}

export function ResourceFilter({ resources }: ResourceFilterProps) {
  const categories = ["All", ...Array.from(new Set(resources.map((r) => r.category)))];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered =
    selectedCategory === "All"
      ? resources
      : resources.filter((r) => r.category === selectedCategory);

  return (
    <>
      {/* Category filter buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filtered resource cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((resource, index) => (
          <div
            key={resource.title || `resource-${index}`}
            className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded">
                    {resource.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {resource.readTime}
                  </div>
                </div>
                <h3 className="text-lg font-semibold leading-tight">
                  {resource.title}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {resource.description}
              </p>

              <Link
                href={resource.href}
                className="inline-flex items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full"
              >
                {resource.category === "Templates" ? (
                  <>
                    <Download className="w-4 h-4" />
                    Browse Templates
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Read Article
                  </>
                )}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
