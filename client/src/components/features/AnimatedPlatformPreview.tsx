'use client';

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Users, DollarSign, Calendar, MessageCircle, TrendingUp, CheckCircle } from "lucide-react";

interface NotificationProps {
  id: number;
  message: string;
  type: 'member' | 'payment' | 'event' | 'chat';
  visible: boolean;
}

const notifications: Omit<NotificationProps, 'id' | 'visible'>[] = [
  { message: "New member joined: Sarah Johnson", type: 'member' },
  { message: "Payment received: $25 from Mike Chen", type: 'payment' },
  { message: "Event RSVP: Book Club Meeting - 15 attending", type: 'event' },
  { message: "New message in General Chat", type: 'chat' },
  { message: "Monthly revenue goal reached!", type: 'payment' },
  { message: "New member joined: Alex Rodriguez", type: 'member' },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'member': return <Users className="w-4 h-4" />;
    case 'payment': return <DollarSign className="w-4 h-4" />;
    case 'event': return <Calendar className="w-4 h-4" />;
    case 'chat': return <MessageCircle className="w-4 h-4" />;
    default: return <CheckCircle className="w-4 h-4" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'member': return 'bg-primary';
    case 'payment': return 'bg-success';
    case 'event': return 'bg-warning';
    case 'chat': return 'bg-primary';
    default: return 'bg-muted-foreground';
  }
};

export function AnimatedPlatformPreview() {
  const [memberCount, setMemberCount] = useState(147);
  const [revenue, setRevenue] = useState(3240);
  const [upcomingEvents, setUpcomingEvents] = useState(3);
  const [activeNotifications, setActiveNotifications] = useState<NotificationProps[]>([]);
  const [notificationIndex, setNotificationIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  // BUG FIX: Track pending timeouts for cleanup to prevent memory leaks
  const pendingTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  useEffect(() => {
    // Don't animate if user prefers reduced motion
    if (shouldReduceMotion) return;

    // Animate member count increment
    const memberInterval = setInterval(() => {
      setMemberCount(prev => prev + Math.floor(Math.random() * 3));
    }, 8000);

    // Animate revenue increment
    const revenueInterval = setInterval(() => {
      setRevenue(prev => prev + Math.floor(Math.random() * 50) + 25);
    }, 12000);

    // Animate upcoming events
    const eventInterval = setInterval(() => {
      setUpcomingEvents(prev => Math.min(prev + 1, 8));
    }, 15000);

    return () => {
      clearInterval(memberInterval);
      clearInterval(revenueInterval);
      clearInterval(eventInterval);
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    // Don't show notifications if user prefers reduced motion
    if (shouldReduceMotion) return;

    // Manage floating notifications
    const notificationInterval = setInterval(() => {
      const notification = notifications[notificationIndex];
      const newNotification: NotificationProps = {
        id: Date.now(),
        ...notification,
        visible: true,
      };

      setActiveNotifications(prev => [...prev, newNotification]);
      setNotificationIndex(prev => (prev + 1) % notifications.length);

      // BUG FIX: Track timeout IDs for cleanup on unmount
      // Remove notification after 3 seconds
      const hideTimeout = setTimeout(() => {
        pendingTimeouts.current.delete(hideTimeout);
        setActiveNotifications(prev =>
          prev.map(n => n.id === newNotification.id ? { ...n, visible: false } : n)
        );

        // Clean up invisible notifications after animation
        const cleanupTimeout = setTimeout(() => {
          pendingTimeouts.current.delete(cleanupTimeout);
          setActiveNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 500);
        pendingTimeouts.current.add(cleanupTimeout);
      }, 3000);
      pendingTimeouts.current.add(hideTimeout);
    }, 4000);

    return () => {
      clearInterval(notificationInterval);
      // BUG FIX: Clear all pending timeouts on unmount
      pendingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      pendingTimeouts.current.clear();
    };
  }, [notificationIndex, shouldReduceMotion]);

  const memberLimit = 50;
  const memberUsagePercentage = Math.min(
    Math.round((memberCount / memberLimit) * 100),
    100
  );


  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-card rounded-2xl overflow-hidden shadow-2xl border border-border" style={{ minHeight: '400px' }}>
      {/* Dashboard Header */}
      <motion.div 
        className="bg-card/95 backdrop-blur border-b border-border p-3 sm:p-4 relative z-30"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
          <div className="flex items-center justify-between text-foreground">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-sm sm:text-lg font-semibold">
              GatherGrove Admin
            </h2>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm opacity-90">Live</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-6 relative z-20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Total Members Card */}
        <motion.div 
          className="bg-card rounded-lg p-2 sm:p-4 shadow-sm border border-border"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Members</p>
              <motion.p 
                className="text-lg sm:text-2xl font-bold text-foreground"
                key={memberCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {memberCount}
              </motion.p>
            </div>
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full self-end sm:self-auto">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            </div>
          </div>
        </motion.div>

        {/* Dues Collected (YTD) Card */}
        <motion.div 
          className="bg-card rounded-lg p-2 sm:p-4 shadow-sm border border-border"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Dues Collected YTD</p>
              <motion.p 
                className="text-lg sm:text-2xl font-bold text-foreground"
                key={revenue}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                ${revenue.toLocaleString()}
              </motion.p>
            </div>
            <div className="p-1.5 sm:p-2 bg-success/10 rounded-full self-end sm:self-auto">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
            </div>
          </div>
        </motion.div>

        {/* Upcoming Events Card */}
        <motion.div 
          className="bg-card rounded-lg p-2 sm:p-4 shadow-sm border border-border"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Upcoming Events</p>
              <motion.p 
                className="text-lg sm:text-2xl font-bold text-foreground"
                key={upcomingEvents}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {upcomingEvents}
              </motion.p>
            </div>
            <div className="p-1.5 sm:p-2 bg-warning/10 rounded-full self-end sm:self-auto">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-warning" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Progress Bars */}
       <motion.div 
        className="px-3 sm:px-6 space-y-2 sm:space-y-4 relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="bg-card rounded-lg p-2 sm:p-4 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm font-semibold text-foreground">Member Usage</span>
            <span className="text-xs sm:text-sm font-semibold text-foreground">{memberUsagePercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
            <motion.div
              className="bg-gradient-to-r from-primary to-secondary h-1.5 sm:h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${memberUsagePercentage}%` }}
              transition={{ duration: 1.5, delay: 0.6 }}
            />
          </div>
        </div>

        <div className="bg-card rounded-lg p-2 sm:p-4 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm font-semibold text-foreground">Dues Collection Goal</span>
            <span className="text-xs sm:text-sm font-semibold text-foreground">94%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
            <motion.div
              className="bg-gradient-to-r from-success to-success h-1.5 sm:h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "94%" }}
              transition={{ duration: 1.5, delay: 0.8 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Floating Notifications - positioned within header area to avoid covering stats */}
      <div className="pointer-events-none absolute top-6 sm:top-8 md:top-10 right-2 sm:right-4 space-y-1.5 sm:space-y-2 w-48 sm:w-64 hidden sm:block z-40">
        {activeNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            className="bg-card rounded-lg p-2 sm:p-3 shadow-lg border border-border"
            initial={{ x: 300, opacity: 0 }}
            animate={{ 
              x: notification.visible ? 0 : 300, 
              opacity: notification.visible ? 1 : 0 
            }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`p-1.5 sm:p-2 ${getNotificationColor(notification.type)} rounded-full text-white`}>
                {getNotificationIcon(notification.type)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                {notification.message}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Activity Feed */}
      <motion.div 
        className="absolute bottom-2 sm:bottom-4 left-3 sm:left-6 right-3 sm:right-6 z-30"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <div className="bg-card rounded-lg p-2 sm:p-4 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Recent Activity</h3>
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
          </div>
          <div className="space-y-1 sm:space-y-2">
            <motion.div
              className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-success rounded-full"></div>
              <span>3 new payments processed</span>
            </motion.div>
            <motion.div
              className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
              <span>12 members active in chat</span>
            </motion.div>
            <motion.div
              className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-warning rounded-full"></div>
              <span>Next event in 3 days</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}