"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";

export function FeedbackFAB() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      {!dialogOpen && (
        <button
          onClick={() => setDialogOpen(true)}
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Send feedback"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Feedback Dialog */}
      <FeedbackDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
