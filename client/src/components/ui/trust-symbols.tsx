'use client';

import { motion } from"framer-motion";
import { Shield, CheckCircle, Clock, CreditCard } from"lucide-react";
import { cn } from"@/lib/utils";
import { formatStartingPriceShort } from"@/lib/pricing";

interface TrustSymbolsProps {
  className?: string;
  layout?:'horizontal' |'vertical';
  showIcons?: boolean;
}

export function TrustSymbols({ 
  className, 
  layout ='horizontal',
  showIcons = true 
}: TrustSymbolsProps) {
  const trustItems = [
    {
      icon: Shield,
      text:"No Risk",
      subtext:"Cancel anytime"
    },
    {
      icon: CreditCard,
      text:"Free Trial",
      subtext:"30 days, cancel anytime"
    },
    {
      icon: Clock,
      text:"5 Min Setup",
      subtext:"Start immediately"
    },
    {
      icon: CheckCircle,
      text:`From ${formatStartingPriceShort()}`,
      subtext:"Plans that scale with you"
    }
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease:"easeOut" as const,
      },
    },
  };

  return (
    <motion.div
      className={cn("grid gap-3 sm:gap-4",
        layout ==='horizontal' ?"grid-cols-2 sm:grid-cols-4" :"grid-cols-1 space-y-2",
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {trustItems.map((item, index) => (
        <motion.div
          key={item.text || `trust-${index}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-primary/5  border border-primary/20"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type:"spring", stiffness: 400, damping: 17 }}
        >
          {showIcons && (
            <motion.div
              className="flex-shrink-0"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
            >
              <item.icon className="w-5 h-5 text-primary" />
            </motion.div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm text-primary">
              {item.text}
            </div>
            <div className="text-xs text-primary/70  truncate">
              {item.subtext}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
