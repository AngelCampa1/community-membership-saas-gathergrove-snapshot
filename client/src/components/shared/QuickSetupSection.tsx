'use client';

import { motion } from"framer-motion";
import { SetupProgress } from"@/components/ui/setup-progress";
import { buttonVariants } from"@/components/ui/button";
import Link from"next/link";
import { cn } from"@/lib/utils";

export function QuickSetupSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease:"easeOut" as const,
      },
    },
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center space-y-4 mb-12" variants={itemVariants}>
            <h2 className="text-3xl lg:text-4xl font-bold">
              Your club is ready in just 5 minutes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No technical expertise required. Follow our simple setup process and start managing your club immediately.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={itemVariants}>
              <SetupProgress />
            </motion.div>

            <motion.div className="space-y-6" variants={itemVariants}>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Why clubs choose GatherGrove</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-success text-sm">✓</span>
                    </div>
                    <div>
                      <div className="font-medium">No learning curve</div>
                      <div className="text-sm text-muted-foreground">Intuitive interface that anyone can use</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-success text-sm">✓</span>
                    </div>
                    <div>
                      <div className="font-medium">Start with your data</div>
                      <div className="text-sm text-muted-foreground">Import members from spreadsheets in minutes</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-success text-sm">✓</span>
                    </div>
                    <div>
                      <div className="font-medium">Immediate value</div>
                      <div className="text-sm text-muted-foreground">Send your first announcement today</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-success text-sm">✓</span>
                    </div>
                    <div>
                      <div className="font-medium">Help when you need it</div>
                      <div className="text-sm text-muted-foreground">Personal onboarding support included</div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type:"spring", stiffness: 400, damping: 17 }}
              >
                <Link 
                  href="/register" 
                  className={cn(
                    buttonVariants({ size:"lg" }),"w-full text-lg py-6"
                  )}
                >
                  Start Free Trial
                </Link>
              </motion.div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Get your club set up and running in under 5 minutes
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}