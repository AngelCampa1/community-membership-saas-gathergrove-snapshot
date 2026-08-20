'use client';

import { motion, useReducedMotion, AnimatePresence } from"framer-motion";
import { useState, useEffect, useMemo } from"react";
import { 
  ChevronLeft, 
  ChevronRight,
  Users, 
  Calendar, 
  CreditCard, 
  MessageCircle,
  Bell,
  Settings,
  User,
  ArrowLeft,
  MapPin,
  Clock,
  QrCode,
  Smartphone
} from"lucide-react";

// Mock data based on actual mobile app
const mockMemberData = {
  fullName:"Sarah Johnson",
  membershipType:"Premium Member",
  status:"Active",
  expiryDate:"December 31, 2024",
  memberId:"M-2024-0147"
};

const mockEvents = [
  {
    id: 1,
    name:"Book Club Meeting",
    date:"Dec 15, 2024",
    time:"7:00 PM",
    location:"Community Center",
    attendees: 15
  },
  {
    id: 2,
    name:"Holiday Party",
    date:"Dec 22, 2024", 
    time:"6:30 PM",
    location:"Main Hall",
    attendees: 23
  },
  {
    id: 3,
    name:"Monthly Board Meeting",
    date:"Jan 5, 2025", 
    time:"2:00 PM",
    location:"Conference Room A",
    attendees: 8
  },
  {
    id: 4,
    name:"New Member Orientation",
    date:"Jan 12, 2025", 
    time:"10:00 AM",
    location:"Welcome Center",
    attendees: 12
  }
];


// Screen types for mobile showcase
type MobileScreen = 
  |'dashboard'
  |'membershipCard'
  |'events'
  |'chat'
  |'directory';

interface DeviceMockupProps {
  deviceType:'iphone' |'android';
  children: React.ReactNode;
  className?: string;
}

// iPhone 15 Pro mockup component
function IPhoneMockup({ children, className ="" }: Omit<DeviceMockupProps,'deviceType'>) {
  return (
    <div className={`relative ${className}`}>
      {/* iPhone frame */}
      <div className="relative bg-muted-foreground rounded-[2.5rem] p-2 shadow-2xl">
        <div className="bg-black rounded-[2.25rem] p-1">
          {/* Screen */}
          <div className="bg-background rounded-[2rem] overflow-hidden" style={{ aspectRatio:'393/852' }}>
            {/* Status bar */}
            <div className="bg-black text-white px-4 py-1 flex justify-between items-center text-xs font-medium">
              <span>9:41</span>
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-muted rounded-full"></div>
                </div>
                <div className="w-4 h-2 border border-white rounded-sm">
                  <div className="w-3 h-1 bg-white rounded-sm"></div>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 bg-muted min-h-0">
              {children}
            </div>
          </div>
        </div>
        
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-muted-foreground rounded-full"></div>
      </div>
    </div>
  );
}


// Mobile Dashboard Screen
function DashboardScreen() {
  return (
    <div className="w-full h-full bg-muted flex flex-col">
      {/* Header */}
      <div className="bg-card px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-medium text-muted-foreground">Welcome back!</h1>
            <h2 className="text-lg font-bold text-foreground">{mockMemberData.fullName}</h2>
          </div>
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <Settings className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Member of Book Club</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-lg p-3 border border-border shadow-sm">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <h4 className="text-sm font-medium text-foreground">Events</h4>
            <p className="text-xs text-muted-foreground">View upcoming events</p>
          </div>

          <div className="bg-card rounded-lg p-3 border border-border shadow-sm">
            <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-success" />
            </div>
            <h4 className="text-sm font-medium text-foreground">Directory</h4>
            <p className="text-xs text-muted-foreground">Connect with members</p>
          </div>

          <div className="bg-card rounded-lg p-3 border border-border shadow-sm">
            <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
              <MessageCircle className="w-4 h-4 text-secondary" />
            </div>
            <h4 className="text-sm font-medium text-foreground">Chat</h4>
            <p className="text-xs text-muted-foreground">Community discussions</p>
          </div>

          <div className="bg-card rounded-lg p-3 border border-border shadow-sm">
            <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center mb-2">
              <User className="w-4 h-4 text-warning" />
            </div>
            <h4 className="text-sm font-medium text-foreground">My Profile</h4>
            <p className="text-xs text-muted-foreground">Update your info</p>
          </div>
        </div>

        {/* Status Card */}
        <div>
          <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-3">Membership Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm font-medium text-foreground">Active</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium text-foreground">{mockMemberData.membershipType}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity Section to fill space */}
        <div className="mt-6">
          <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-3">Recent Activity</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                <span>Payment received</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                <span>RSVP confirmed for Book Club</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                <span>3 new messages in chat</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="mt-auto bg-card border-t border-border px-4 py-2">
        <div className="flex justify-around">
          <div className="flex flex-col items-center py-1">
            <User className="w-5 h-5 text-primary" />
            <span className="text-xs text-primary mt-1">Dashboard</span>
          </div>
          <div className="flex flex-col items-center py-1">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Events</span>
          </div>
          <div className="flex flex-col items-center py-1">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Directory</span>
          </div>
          <div className="flex flex-col items-center py-1">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Membership Card Screen
function MembershipCardScreen() {
  return (
    <div className="w-full h-full bg-muted flex flex-col">
      {/* Header */}
      <div className="bg-card px-4 py-3 border-b border-border">
        <div className="flex items-center">
          <ArrowLeft className="w-5 h-5 text-primary mr-3" />
          <h1 className="text-lg font-semibold text-foreground">Digital Membership Card</h1>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-center">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
          {/* Member Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-1">{mockMemberData.fullName}</h2>
            <p className="text-lg text-primary font-medium mb-3">{mockMemberData.membershipType}</p>

            {/* Status */}
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-sm font-medium text-success">{mockMemberData.status}</span>
            </div>

            <p className="text-sm text-muted-foreground">Valid until: {mockMemberData.expiryDate}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-muted border-2 border-border rounded-lg flex items-center justify-center">
              <QrCode className="w-16 h-16 text-muted-foreground" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center italic">
            Show this QR code for membership verification
          </p>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-primary/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-primary mb-2">How to Use</h3>
          <div className="space-y-1">
            <p className="text-xs text-primary/80">• Present this card at events for easy check-in</p>
            <p className="text-xs text-primary/80">• Show the QR code to receive member discounts</p>
            <p className="text-xs text-primary/80">• Screenshot this card for offline access</p>
            <p className="text-xs text-primary/80">• Card data is automatically updated when you open the app</p>
          </div>
        </div>

        {/* Membership Benefits Section */}
        <div className="mt-6 bg-success/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-success mb-2">Member Benefits</h3>
          <div className="space-y-1">
            <p className="text-xs text-success/80">✓ Access to all club events</p>
            <p className="text-xs text-success/80">✓ Member-only discounts</p>
            <p className="text-xs text-success/80">✓ Community chat access</p>
            <p className="text-xs text-success/80">✓ Digital newsletter</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Events Screen
function EventsScreen() {
  return (
    <div className="w-full h-full bg-muted flex flex-col">
      {/* Header */}
      <div className="bg-card px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Events</h1>
      </div>

      {/* Events List */}
      <div className="flex-1 px-4 pt-4 pb-8 overflow-y-auto">
        <div className="space-y-3">
          {mockEvents.map((event) => (
            <div key={event.id} className="bg-card rounded-lg p-4 border border-border shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-foreground flex-1 mr-3">{event.name}</h3>
                <div className="flex items-center bg-success/10 px-2 py-1 rounded-full">
                  <Users className="w-3 h-3 text-success mr-1" />
                  <span className="text-xs text-success font-medium">{event.attendees}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-card border-t border-border px-4 py-2">
        <div className="flex justify-around">
          <div className="flex flex-col items-center py-1">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Dashboard</span>
          </div>
          <div className="flex flex-col items-center py-1">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-xs text-primary mt-1">Events</span>
          </div>
          <div className="flex flex-col items-center py-1">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Directory</span>
          </div>
          <div className="flex flex-col items-center py-1">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Chat Screen
function ChatScreen() {
  const messages = [
    { id: 1, sender:"Sarah J", message:"Looking forward to tonight's book discussion!", time:"2:34 PM", isOwn: false },
    { id: 2, sender:"You", message:"Same here! I just finished the last chapter", time:"2:35 PM", isOwn: true },
    { id: 3, sender:"Mike C", message:"Should we bring snacks?", time:"2:37 PM", isOwn: false },
    { id: 4, sender:"You", message:"Great idea! I'll bring some cookies 🍪", time:"2:38 PM", isOwn: true },
    { id: 5, sender:"Alex R", message:"I can bring drinks! What time should we arrive?", time:"2:39 PM", isOwn: false },
    { id: 6, sender:"Sarah J", message:"Meeting starts at 7 PM, but come early to chat!", time:"2:40 PM", isOwn: false },
    { id: 7, sender:"You", message:"Perfect! See you all there 👍", time:"2:41 PM", isOwn: true },
  ];

  return (
    <div className="w-full h-full bg-muted flex flex-col">
      {/* Header */}
      <div className="bg-card px-4 py-3 border-b border-border">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center mr-3">
            <MessageCircle className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">General Chat</h1>
            <p className="text-xs text-muted-foreground">12 members online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 pt-4 pb-8 space-y-3 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isOwn ?'justify-end' :'justify-start'}`}>
            <div className={`max-w-xs rounded-lg p-3 ${
              message.isOwn
                ?'bg-primary text-primary-foreground'
                :'bg-card text-foreground border border-border'
            }`}>
              {!message.isOwn && (
                <p className="text-xs font-medium text-primary mb-1">{message.sender}</p>
              )}
              <p className="text-sm">{message.message}</p>
              <p className={`text-xs mt-1 ${message.isOwn ?'text-primary-foreground/80' :'text-muted-foreground'}`}>
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-muted rounded-full px-4 py-2">
            <p className="text-sm text-muted-foreground">Type a message...</p>
          </div>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-card border-t border-border px-4 py-2">
        <div className="flex justify-around">
          <div className="flex flex-col items-center py-1">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Dashboard</span>
          </div>
          <div className="flex flex-col items-center py-1">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Events</span>
          </div>
          <div className="flex flex-col items-center py-1">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Directory</span>
          </div>
          <div className="flex flex-col items-center py-1">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="text-xs text-primary mt-1">Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Mobile Showcase Component
export function MobileShowcase() {
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('dashboard');
  const [autoPlay, setAutoPlay] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const screens = useMemo(() => [
    { key:'dashboard' as const, name:'Dashboard', component: <DashboardScreen /> },
    { key:'membershipCard' as const, name:'Membership Card', component: <MembershipCardScreen /> },
    { key:'events' as const, name:'Events', component: <EventsScreen /> },
    { key:'chat' as const, name:'Chat', component: <ChatScreen /> },
  ], []);

  // Auto-advance screens
  useEffect(() => {
    if (!autoPlay || shouldReduceMotion) return;

    const interval = setInterval(() => {
      setCurrentScreen(current => {
        const currentIndex = screens.findIndex(screen => screen.key === current);
        const nextIndex = (currentIndex + 1) % screens.length;
        return screens[nextIndex].key;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, shouldReduceMotion, screens]);

  const currentIndex = screens.findIndex(screen => screen.key === currentScreen);
  const currentScreenData = screens[currentIndex];

  const nextScreen = () => {
    const nextIndex = (currentIndex + 1) % screens.length;
    setCurrentScreen(screens[nextIndex].key);
    setAutoPlay(false);
  };

  const prevScreen = () => {
    const prevIndex = currentIndex === 0 ? screens.length - 1 : currentIndex - 1;
    setCurrentScreen(screens[prevIndex].key);
    setAutoPlay(false);
  };

  return (
    <div className="w-full bg-gradient-to-br from-success/5 to-success/3   py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Beautiful Mobile Experience
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Your members will love our native mobile app. Professional design, 
              intuitive navigation, and all the features they need in their pocket.
            </p>
          </motion.div>
        </div>

        {/* Mobile Device Display */}
        <div className="flex justify-center">
          {/* Primary Device - iPhone */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <IPhoneMockup className="w-72 sm:w-80 lg:w-96">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {currentScreenData.component}
                </motion.div>
              </AnimatePresence>
            </IPhoneMockup>
            
            {/* Platform Labels */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-3">
              <div className="bg-card px-3 py-1 rounded-full border border-border shadow-sm">
                <span className="text-xs font-medium text-muted-foreground">📱 iOS</span>
              </div>
              <div className="bg-card px-3 py-1 rounded-full border border-border shadow-sm">
                <span className="text-xs font-medium text-muted-foreground">🤖 Android</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center mt-16 space-y-6">
          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={prevScreen}
              className="group p-3 bg-card rounded-full shadow-lg border border-border hover:shadow-xl hover:bg-primary/10 hover:border-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Previous screen"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {currentScreenData.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentIndex + 1} of {screens.length}
              </p>
            </div>

            <button
              onClick={nextScreen}
              className="group p-3 bg-card rounded-full shadow-lg border border-border hover:shadow-xl hover:bg-primary/10 hover:border-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Next screen"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="flex space-x-2">
            {screens.map((screen, index) => (
              <button
                key={screen.key}
                onClick={() => {
                  setCurrentScreen(screen.key);
                  setAutoPlay(false);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ?'bg-primary'
                    :'bg-muted-foreground hover:bg-primary/60 hover:scale-110'
                }`}
                aria-current={index === currentIndex ?'true' :'false'}
                aria-label={`View ${screen.name} screen`}
              />
            ))}
          </div>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Smartphone className="w-4 h-4" />
              <span>Native Mobile Apps</span>
            </div>
            <div className="flex items-center space-x-1">
              <CreditCard className="w-4 h-4" />
              <span>Digital Membership Cards</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>Real-time Chat</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Event Management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}