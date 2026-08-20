'use client';

import { motion } from "framer-motion";
import { CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupProgressProps {
  className?: string;
  animated?: boolean;
}

export function SetupProgress({ className, animated = true }: SetupProgressProps) {
  const steps = [
    { title: "Create Account", time: "30 seconds", completed: true },
    { title: "Club Details", time: "1 minute", completed: true },
    { title: "Payment Setup", time: "2 minutes", completed: false },
    { title: "Import Members", time: "1 minute", completed: false },
    { title: "First Event", time: "30 seconds", completed: false }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center space-y-2">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
          animate={animated ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Clock className="w-4 h-4" />
          Ready in just 5 minutes
        </motion.div>
        <p className="text-sm text-muted-foreground">
          Simple setup process - no technical expertise required
        </p>
      </div>

      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial={animated ? "hidden" : "visible"}
        animate="visible"
      >
        {steps.map((step, index) => (
          <motion.div
            key={step.title || `step-${index}`}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              className="flex-shrink-0"
              animate={animated && step.completed ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <CheckCircle
                className={cn(
                  "w-5 h-5",
                  step.completed
                    ? "text-success"
                    : "text-muted-foreground"
                )}
              />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{step.title}</div>
              <div className="text-xs text-muted-foreground">{step.time}</div>
            </div>

            {!step.completed && (
              <motion.div
                className="w-2 h-2 bg-primary rounded-full"
                animate={animated ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="text-center pt-2"
        initial={animated ? { opacity: 0, y: 10 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <p className="text-xs text-muted-foreground">
          Most clubs are up and running in under 3 minutes!
        </p>
      </motion.div>
    </div>
  );
}