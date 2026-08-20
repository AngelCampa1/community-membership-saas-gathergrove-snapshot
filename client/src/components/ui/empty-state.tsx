"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  CreditCard, 
  Search, 
  Plus,
  FileX,
  Database,
  Inbox,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'glass';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const EMPTY_STATE_ICONS = {
  members: Users,
  events: Calendar,
  messages: MessageSquare,
  payments: CreditCard,
  search: Search,
  generic: FileX,
  database: Database,
  inbox: Inbox,
  settings: Settings,
} as const;

export function EmptyState({
  icon: IconComponent = FileX,
  title,
  description,
  action,
  className,
  size = 'md',
  children
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12 px-6',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'h-20 w-20',
      title: 'text-2xl',
      description: 'text-lg',
    }
  };

  const sizes = sizeClasses[size];

  return (
    <Card className={cn(
      "glass-soft border-border/30 text-center hover:glass transition-all duration-300",
      sizes.container,
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        {/* Animated Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-full blur-lg animate-pulse" />
          <div className="relative glass-soft rounded-full p-4 border border-border/40">
            <IconComponent className={cn(
              sizes.icon, 
              "text-muted-foreground group-hover:text-primary transition-colors duration-300"
            )} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className={cn("font-semibold text-foreground", sizes.title)}>
            {title}
          </h3>
          
          {description && (
            <p className={cn("text-muted-foreground max-w-sm", sizes.description)}>
              {description}
            </p>
          )}
        </div>

        {/* Action Button */}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="hover-lift focus-ring mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            {action.text}
          </Button>
        )}

        {/* Children content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </Card>
  );
}

// Specialized empty state components
export function EmptyMembers({ onAddMember }: { onAddMember?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No members yet"
      description="Get started by adding your first club member. You can invite them via email or add them manually."
      action={onAddMember ? {
        text: "Add First Member",
        onClick: onAddMember,
        variant: "default"
      } : undefined}
    />
  );
}

export function EmptyEvents({ onCreateEvent }: { onCreateEvent?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No events scheduled"
      description="Create your first event to bring your club members together. Add details, set RSVP limits, and send invitations."
      action={onCreateEvent ? {
        text: "Create Event",
        onClick: onCreateEvent,
        variant: "default"
      } : undefined}
    />
  );
}

export function EmptyMessages({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No messages yet"
      description="Start a conversation with your club members. Share updates, discuss events, or just chat!"
      action={onStartChat ? {
        text: "Start Chatting",
        onClick: onStartChat,
        variant: "default"
      } : undefined}
      size="sm"
    />
  );
}

export function EmptySearch({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={query ? `No results found for "${query}". Try adjusting your search terms.` : "Try a different search term or check your spelling."}
      size="sm"
    />
  );
}

export function EmptyPayments({ onRecordPayment }: { onRecordPayment?: () => void }) {
  return (
    <EmptyState
      icon={CreditCard}
      title="No payments recorded"
      description="Keep track of member dues and payments. Record payments manually or set up automatic collection."
      action={onRecordPayment ? {
        text: "Record Payment",
        onClick: onRecordPayment,
        variant: "default"
      } : undefined}
    />
  );
}

// Generic empty state with custom content
export function EmptyGeneric({ 
  icon, 
  title, 
  description, 
  children 
}: { 
  icon?: keyof typeof EMPTY_STATE_ICONS;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const IconComponent = icon ? EMPTY_STATE_ICONS[icon] : FileX;
  
  return (
    <EmptyState
      icon={IconComponent}
      title={title}
      description={description}
      className="border-dashed border-2 border-border/50 bg-muted/10"
    >
      {children}
    </EmptyState>
  );
}