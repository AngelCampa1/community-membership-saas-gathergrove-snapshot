'use client';

import { useEffect, useRef } from 'react';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import { useAuth } from '@/hooks/useAuth';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

function PostHogIdentity() {
  const { user } = useAuth();
  const wasIdentifiedRef = useRef(false);

  useEffect(() => {
    if (!POSTHOG_KEY || !posthog.__loaded) return;

    if (user) {
      posthog.identify(String(user.userId), {
        email: user.email,
        name: user.fullName,
        role: user.role,
        club_id: user.clubId,
        club_name: user.clubName,
        club_tier: user.clubTier,
      });
      wasIdentifiedRef.current = true;
    } else if (wasIdentifiedRef.current) {
      // Only reset when transitioning from identified → logged out,
      // not on every render where user happens to be null.
      posthog.reset();
      wasIdentifiedRef.current = false;
    }
  }, [user]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogIdentity />
      {children}
    </PHProvider>
  );
}
