'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FreeTrialBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSparkle?: boolean;
}

export function FreeTrialBadge({
  className,
  size = 'md',
  showSparkle = true
}: FreeTrialBadgeProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-full font-semibold shadow-lg",
        sizeClasses[size],
        className
      )}
      animate={{
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {showSparkle && (
        <motion.span
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-warning/80"
        >
          🚀
        </motion.span>
      )}
      <span>30-Day Free Trial</span>
    </motion.div>
  );
}
