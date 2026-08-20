import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Free Club Tools - GatherGrove',
    default: 'Free Club Tools - GatherGrove',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background py-8 px-4">
      {children}
    </main>
  );
}
