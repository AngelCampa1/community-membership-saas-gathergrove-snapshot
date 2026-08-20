'use client';

import { TagManager } from '@/components/features/members/segmentation/TagManager';
import { useAuth } from '@/hooks/useAuth';
import { TierGate } from '@/components/tier/TierGate';

function TagsPageContent() {
  const { user } = useAuth();

  if (!user?.clubId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <TagManager clubId={user.clubId} />;
}

export default function TagsPage() {
  return (
    <TierGate requiredTier="Expand" feature="member-tagging" showUpgrade={true}>
      <TagsPageContent />
    </TierGate>
  );
}
