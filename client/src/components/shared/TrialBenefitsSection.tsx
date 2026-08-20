"use client";

import { Zap, Calendar, MessageSquare, Smartphone, Users, Download } from "lucide-react";
import { motion } from "framer-motion";

const trialBenefits = [
  { icon: Zap, title: "Full Feature Access", description: "Try the tools in your plan." },
  { icon: Calendar, title: "Unlimited Events", description: "Create as many events as your club needs." },
  { icon: MessageSquare, title: "Email And Chat", description: "Send email updates and use club chat." },
  { icon: Smartphone, title: "Mobile App Access", description: "Your members get full iOS and Android app access from day one" },
  { icon: Users, title: "Community Chat", description: "Real-time group messaging to keep your community connected" },
  { icon: Download, title: "Export Your Data", description: "Export your data when you need it." },
];

export function TrialBenefitsSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Your 30-Day Free Trial
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Try your plan before you pay.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {trialBenefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-start gap-4 p-6 rounded-xl bg-background border border-border/40 hover:border-border/60 transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
