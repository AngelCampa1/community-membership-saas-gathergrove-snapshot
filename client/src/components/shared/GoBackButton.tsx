"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function GoBackButton() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <Button variant="outline" onClick={handleBack} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      Go Back
    </Button>
  );
}
