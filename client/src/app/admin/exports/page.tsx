'use client';

import { DataExportCenter } from '@/components/unlimited/export/DataExportCenter';
import { useAuth } from '@/hooks/useAuth';
import { TierGate } from '@/components/tier/TierGate';

function ExportsPageContent() {
  const { user } = useAuth();

  if (!user?.clubId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <DataExportCenter clubId={user.clubId} />;
}

export default function ExportsPage() {
  return (
    <TierGate requiredTier="Expand" feature="data-export" showUpgrade={true}>
      <ExportsPageContent />
    </TierGate>
  );
}
