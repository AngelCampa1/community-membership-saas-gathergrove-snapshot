import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Users, Zap, MessageCircle, BookOpen } from "lucide-react";

export default function SettingsPage() {
  const settingsSections = [
    {
      title: "Profile",
      description: "Update your personal information and contact details",
      icon: User,
      href: "/admin/settings/profile",
      available: true,
    },
    {
      title: "Club Admins",
      description: "Manage club administrators and send invitations (Grow tier)",
      icon: Users,
      href: "/admin/settings/admins",
      available: true,
    },
    {
      title: "Community Chat",
      description: "Enable or disable club group chat for member communication",
      icon: MessageCircle,
      href: "/admin/settings/chat",
      available: true,
    },
    {
      title: "Directory Settings",
      description: "Control member directory visibility and shareable contact information",
      icon: BookOpen,
      href: "/admin/settings/directory",
      available: true,
    },
    {
      title: "Integrations",
      description: "Connect external services like Stripe for payment processing",
      icon: Zap,
      href: "/admin/settings/integrations",
      available: true,
    },
    {
      title: "White-Label Branding",
      description: "Customize your club's visual identity with logos, colors, and themes (Expand tier)",
      icon: Zap,
      href: "/admin/settings/branding",
      available: true,
    },
    {
      title: "Billing & Subscription", 
      description: "Manage your subscription and billing information",
      icon: CreditCard,
      href: "/admin/billing",
      available: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto glass border border-border/50 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account, preferences, and club settings
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            
            return (
              <Card key={section.href} className="glass border-border/50 hover:glass-strong group hover:opacity-95 hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20 group-hover:shadow-lg transition-all duration-300">
                      <Icon className="h-5 w-5 text-primary group-hover:text-success transition-colors duration-300" />
                    </div>
                    <span className="group-hover:text-primary transition-colors duration-200">
                      {section.title}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-200">
                    {section.description}
                  </p>
                  {section.available ? (
                    <Link href={section.href}>
                      <Button className="w-full bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-95" size="sm">
                        Manage
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full glass-soft border-border/50 hover:glass transition-all duration-300" size="sm" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
