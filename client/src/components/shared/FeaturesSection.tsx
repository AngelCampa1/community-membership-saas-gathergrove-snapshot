"use client";

import { Database, CreditCard, MessageCircle, Calendar, MessageSquare, Smartphone, CreditCard as CardIcon, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Database,
    title: "Centralized Member Database",
    description: "Keep all your member information organized in one secure, easy-to-access location. No more scattered spreadsheets or lost contact details.",
    href: "/features/membership-management"
  },
  {
    icon: CreditCard,
    title: "Automated Dues & Payments",
    description: "Streamline your finances with automated dues collection, payment tracking, and financial reporting. Say goodbye to manual bookkeeping.",
    href: "/features/dues-collection"
  },
  {
    icon: MessageCircle,
    title: "Member Communication",
    description: "Reach members by email, push notifications, and chat. Send updates to your whole club or a group.",
    href: "/features/member-communication"
  },
  {
    icon: Calendar,
    title: "Event Management with RSVPs",
    description: "Plan and organize events with built-in RSVP tracking. Send invitations, manage attendance, and keep your community engaged.",
    href: "/features/event-planning"
  },
  {
    icon: MessageSquare,
    title: "Community Chat",
    description: "Foster real-time conversations with built-in chat. Members can connect, share ideas, and build stronger relationships within your community. (Available in Grow plan and above)",
    badge: "Grow+",
    href: "/features/community-chat"
  },
  {
    icon: Smartphone,
    title: "Mobile App Access",
    description: "Give members on-the-go access with our iOS and Android apps. View events, chat, check membership cards, and stay connected anywhere. (Available in Grow plan and above)",
    badge: "Grow+",
    href: "/features/mobile-app"
  },
  {
    icon: CardIcon,
    title: "Digital Membership Cards",
    description: "Issue QR code-based membership cards that members can access from their phones. Track expiration dates and verify membership instantly. (Available in Grow plan and above)",
    badge: "Grow+",
    href: "/features/membership-management"
  },
  {
    icon: Shield,
    title: "Privacy Controls",
    description: "Members control their privacy settings and choose what information to share. Keep your community safe and comfortable.",
    href: "/features/member-directory"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  }
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/30"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 relative">
        <motion.div 
          className="text-center space-y-6 mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Everything You Need to Manage Your Organization
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            GatherGrove provides all the essential tools to manage members, automate finances, coordinate events, and improve communication. Replace multiple spreadsheets and tools with one integrated solution that saves time and keeps your community connected.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title || `feature-${index}`}
                variants={itemVariants}
                animate={{ y: 0 }}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.2 }
                }}
              >
                <Link
                  href={feature.href}
                  aria-label={feature.title}
                  className="block h-full rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="h-full p-6 text-center space-y-4 relative overflow-hidden group glass-soft hover:glass border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-md">
                    {/* Hover gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <CardContent className="p-0 relative z-10">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Icon className="w-8 h-8 text-primary-foreground" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                        {feature.badge && (
                          <span className="inline-block px-3 py-1 text-xs font-medium bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full shadow-sm">
                            {feature.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA after features */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white text-base font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 focus-ring"
          >
            Start Free Trial
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            or{" "}
            <Link href="/pricing" className="text-primary hover:text-primary/80 underline underline-offset-4 font-medium transition-colors">
              see pricing
            </Link>
          </p>
        </motion.div>

      </div>
    </section>
  );
}
