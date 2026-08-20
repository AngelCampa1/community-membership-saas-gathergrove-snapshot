'use client';

import SegmentManager from '@/components/features/members/segmentation/SegmentManager';
import { useAuth } from '@/hooks/useAuth';
import { TierGate } from '@/components/tier/TierGate';

function SegmentsPageContent() {
  const { user } = useAuth();

  if (!user?.clubId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <SegmentManager clubId={user.clubId} />;
}

export default function SegmentsPage() {
  return (
    <TierGate requiredTier="Expand" feature="member-segmentation" showUpgrade={true}>
      <SegmentsPageContent />
    </TierGate>
  );
}
