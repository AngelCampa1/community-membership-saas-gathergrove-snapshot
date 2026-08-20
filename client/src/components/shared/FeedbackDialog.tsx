"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/services/apiClient";
import { Star } from "lucide-react";
import { logger } from "@/lib/logger";
import { TurnstileWidget } from "@/components/marketing/TurnstileWidget";

// Helper functions to parse user agent for device info
function getBrowserFromUA(ua: string): string {
  if (ua.includes("Edg/")) {
    const match = ua.match(/Edg\/(\d+)/);
    return match ? `Edge ${match[1]}` : "Edge";
  }
  if (ua.includes("Chrome/")) {
    const match = ua.match(/Chrome\/(\d+)/);
    return match ? `Chrome ${match[1]}` : "Chrome";
  }
  if (ua.includes("Firefox/")) {
    const match = ua.match(/Firefox\/(\d+)/);
    return match ? `Firefox ${match[1]}` : "Firefox";
  }
  if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    const match = ua.match(/Version\/(\d+)/);
    return match ? `Safari ${match[1]}` : "Safari";
  }
  return "Unknown Browser";
}

function getOsFromUA(ua: string): string {
  if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
  if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
  if (ua.includes("Windows NT 6.2")) return "Windows 8";
  if (ua.includes("Windows NT 6.1")) return "Windows 7";
  if (ua.includes("Mac OS X")) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    return match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
  }
  if (ua.includes("Android")) {
    const match = ua.match(/Android (\d+)/);
    return match ? `Android ${match[1]}` : "Android";
  }
  if (ua.includes("iPhone") || ua.includes("iPad")) {
    const match = ua.match(/OS (\d+)/);
    return match ? `iOS ${match[1]}` : "iOS";
  }
  if (ua.includes("Linux")) return "Linux";
  return "Unknown OS";
}

function getDeviceInfo() {
  if (typeof window === "undefined") return {};
  const ua = navigator.userAgent;
  return {
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    browserInfo: getBrowserFromUA(ua),
    osVersion: getOsFromUA(ua),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
  };
}

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FeedbackFormData {
  rating: number;
  subject: string;
  message: string;
  name: string;
  email: string;
  companyWebsite: string;
}

const SUBJECT_OPTIONS = [
  "Feature Request",
  "Bug Report",
  "General Feedback",
  "Usability Issue",
  "Performance Issue",
  "Other",
];

const initialFormData: FeedbackFormData = {
  rating: 0,
  subject: "",
  message: "",
  name: "",
  email: "",
  companyWebsite: "",
};

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [formData, setFormData] = useState<FeedbackFormData>(initialFormData);
  const [turnstileToken, setTurnstileToken] = useState("");

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.fullName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        ...initialFormData,
        name: user?.fullName || "",
        email: user?.email || "",
      });
      setHoveredStar(0);
      setTurnstileToken("");
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!formData.subject.trim()) {
      toast.error("Please select a subject");
      return;
    }

    if (formData.message.trim().length < 10) {
      toast.error("Please provide more detail in your message (at least 10 characters)");
      return;
    }

    setIsSubmitting(true);

    try {
      const deviceInfo = getDeviceInfo();
      await apiClient.post("/feedback", {
        rating: formData.rating,
        subject: formData.subject,
        message: formData.message,
        name: formData.name || undefined,
        email: formData.email || undefined,
        platform: "web",
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        companyWebsite: formData.companyWebsite,
        turnstileToken,
        ...deviceInfo,
      });

      toast.success("Thank you for your feedback!");
      onOpenChange(false);
    } catch (error) {
      logger.error("ui", "Failed to submit feedback", { error });
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
          onMouseEnter={() => setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(0)}
          className="p-1 focus:outline-none focus:ring-2 focus:ring-primary rounded transition-transform hover:scale-110"
          aria-label={`Rate ${star} out of 5 stars`}
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              star <= (hoveredStar || formData.rating)
                ? "fill-warning text-warning"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
      {formData.rating > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">{formData.rating}/5</span>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve GatherGrove by sharing your thoughts, reporting issues, or
            requesting features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="sr-only" aria-hidden="true">
            <Label htmlFor="feedback-company-website">Company website</Label>
            <Input
              id="feedback-company-website"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              value={formData.companyWebsite}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, companyWebsite: e.target.value }))
              }
            />
          </div>

          {!user && <TurnstileWidget onTokenChange={setTurnstileToken} />}

          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating">How would you rate your experience? *</Label>
            <StarRating />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <select
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              required
            >
              <option value="">Select a category...</option>
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Your Feedback *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Tell us what you think, describe an issue, or suggest an improvement..."
              rows={4}
              required
              minLength={10}
              className="resize-none"
            />
          </div>

          {/* Optional contact info for guests */}
          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
                <p className="text-xs text-muted-foreground">
                  Provide your email if you would like us to follow up with you.
                </p>
              </div>
            </>
          )}

          {/* Show pre-filled info for logged-in users */}
          {user && (
            <p className="text-sm text-muted-foreground">
              Submitting as: {formData.name} ({formData.email})
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
