'use client';

import { useEffect, useRef, useState, useCallback } from'react';
import { motion, useReducedMotion } from'framer-motion';
import { gsap } from'gsap';
import { ScrollTrigger } from'gsap/ScrollTrigger';
import { 
  FileSpreadsheet, 
  Mail, 
  CreditCard, 
  MessageCircle, 
  Calendar, 
  FileText,
  CheckCircle,
  Users,
  BarChart3,
  Zap
} from'lucide-react';
import { Button } from'@/components/ui/button';

if (typeof window !=='undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ToolIconProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  position: { x: number; y: number };
  rotation: number;
  scale: number;
}

const ToolIcon = ({ icon, label, color, position, rotation, scale }: ToolIconProps) => (
  <motion.div
    className={`absolute flex items-center gap-2 p-3 rounded-lg shadow-lg border-2 ${color} backdrop-blur-sm`}
    style={{
      left: `${position.x}%`,
      top: `${position.y}%`,
      transform: `rotate(${rotation}deg) scale(${scale})`,
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: scale }}
  >
    {icon}
    <span className="text-sm font-medium truncate max-w-[150px]" title={label}>{label}</span>
  </motion.div>
);

export function PainPointAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chaosRef = useRef<HTMLDivElement>(null);
  const organizedRef = useRef<HTMLDivElement>(null);
  const [animationState, setAnimationState] = useState<'chaos' |'transforming' |'organized'>('chaos');
  const [isManualTrigger, setIsManualTrigger] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const chaosTools = [
    {
      id:'chaos-excel',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      label:"Excel Chaos",
      color:"bg-muted border-muted-foreground/30 text-muted-foreground",
      position: { x: 10, y: 15 },
      rotation: -15,
      scale: 0.9
    },
    {
      id:'chaos-email',
      icon: <Mail className="w-5 h-5" />,
      label:"Email Overload",
      color:"bg-muted border-muted-foreground/30 text-muted-foreground",
      position: { x: 70, y: 20 },
      rotation: 12,
      scale: 1.1
    },
    {
      id:'chaos-payment',
      icon: <CreditCard className="w-5 h-5" />,
      label:"PayPal Mess",
      color:"bg-muted border-muted-foreground/30 text-muted-foreground",
      position: { x: 25, y: 60 },
      rotation: -8,
      scale: 0.8
    },
    {
      id:'chaos-messaging',
      icon: <MessageCircle className="w-5 h-5" />,
      label:"Group Chats",
      color:"bg-muted border-muted-foreground/30 text-muted-foreground",
      position: { x: 80, y: 65 },
      rotation: 20,
      scale: 1.0
    },
    {
      id:'chaos-calendar',
      icon: <Calendar className="w-5 h-5" />,
      label:"Calendar Conflicts",
      color:"bg-muted border-muted-foreground/30 text-muted-foreground",
      position: { x: 15, y: 35 },
      rotation: -25,
      scale: 0.95
    },
    {
      id:'chaos-forms',
      icon: <FileText className="w-5 h-5" />,
      label:"Paper Forms",
      color:"bg-muted border-muted-foreground/30 text-muted-foreground",
      position: { x: 60, y: 45 },
      rotation: 15,
      scale: 0.85
    }
  ];

  const organizedFeatures = [
    {
      id:'feature-members',
      icon: <Users className="w-6 h-6" />,
      label:"Member Management",
      color:"bg-primary/10 border-primary/30 text-primary"
    },
    {
      id:'feature-payments',
      icon: <CreditCard className="w-6 h-6" />,
      label:"Payment Processing",
      color:"bg-primary/15 border-primary/35 text-primary"
    },
    {
      id:'feature-events',
      icon: <Calendar className="w-6 h-6" />,
      label:"Event Planning",
      color:"bg-primary/20 border-primary/40 text-primary"
    },
    {
      id:'feature-analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      label:"Analytics Dashboard",
      color:"bg-primary/25 border-primary/45 text-primary"
    }
  ];

  const triggerTransformation = useCallback(() => {
    if (prefersReducedMotion) {
      setAnimationState('organized');
      return;
    }

    setAnimationState('transforming');

    const chaosElements = chaosRef.current?.querySelectorAll('[data-chaos-element]');
    const organizedElements = organizedRef.current?.querySelectorAll('[data-organized-element]');

    if (chaosElements && organizedElements) {
      // Fade out chaos elements
      gsap.to(chaosElements, {
        opacity: 0,
        scale: 0.5,
        rotation:'+=360',
        duration: 1.5,
        stagger: 0.1,
        ease:"power2.inOut"
      });

      // Transform background (removed jarring color animation)
      // gsap.to(containerRef.current, {
      //   background:"...",
      //   duration: 2,
      //   ease:"power2.inOut"
      // });

      // Fade in organized elements
      gsap.fromTo(organizedElements, 
        { opacity: 0, scale: 0.5, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.5,
          stagger: 0.2,
          delay: 1,
          ease:"back.out(1.7)",
          onComplete: () => setAnimationState('organized')
        }
      );
    }
  }, [prefersReducedMotion]);

  const resetToChaos = useCallback(() => {
    if (prefersReducedMotion) {
      setAnimationState('chaos');
      return;
    }

    setAnimationState('chaos');

    const chaosElements = chaosRef.current?.querySelectorAll('[data-chaos-element]');
    const organizedElements = organizedRef.current?.querySelectorAll('[data-organized-element]');

    if (chaosElements && organizedElements) {
      gsap.to(organizedElements, { opacity: 0, duration: 0.5 });
      gsap.to(chaosElements, { opacity: 1, scale: 1, duration: 0.5 });
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Chaos state continuous animation
      const chaosElements = chaosRef.current?.querySelectorAll('[data-chaos-element]');
      if (chaosElements) {
        gsap.set(chaosElements, { opacity: 1 });
        
        chaosElements.forEach((element, index) => {
          gsap.to(element, {
            x: `+=${Math.random() * 40 - 20}`,
            y: `+=${Math.random() * 40 - 20}`,
            rotation: `+=${Math.random() * 30 - 15}`,
            duration: 2 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease:"sine.inOut",
            delay: index * 0.1
          });
        });
      }

      // ScrollTrigger for automatic animation
      if (!isManualTrigger) {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start:"top 70%",
          onEnter: () => triggerTransformation(),
          onLeaveBack: () => resetToChaos(),
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isManualTrigger, prefersReducedMotion, triggerTransformation, resetToChaos]);


  const handleManualTrigger = () => {
    setIsManualTrigger(true);
    if (animationState ==='chaos') {
      triggerTransformation();
    } else {
      resetToChaos();
    }
  };

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden" ref={containerRef}>
      {/* Background gradient that changes during animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/40"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center space-y-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-3xl lg:text-5xl font-bold">
              Stop the
              <span className="text-destructive animate-pulse"> chaos</span>
              . Start organizing.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Sound familiar? You&apos;re not alone. We understand the daily struggle of managing a club with scattered tools.
            </p>
          </motion.div>

          {/* Animation Container */}
          <div className="relative h-96 lg:h-[500px] mx-auto max-w-6xl">
            {/* Chaos State */}
            <div 
              ref={chaosRef}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                animationState ==='organized' ?'opacity-0' :'opacity-100'
              }`}
            >
              {chaosTools.map((tool) => (
                <div key={tool.id} data-chaos-element>
                  <ToolIcon {...tool} />
                </div>
              ))}

              {/* Stressed admin character */}
              <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl"
                animate={prefersReducedMotion ? {} : { 
                  rotate: [0, -5, 5, 0],
                  scale: [1, 0.95, 1.05, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease:"easeInOut"
                }}
              >
                😰
              </motion.div>

              {/* Chaos indicators */}
              <motion.div
                className="absolute top-4 left-4 text-destructive text-2xl"
                animate={prefersReducedMotion ? {} : {
                  scale: [1, 1.3, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⚠️
              </motion.div>
              <motion.div
                className="absolute top-4 right-4 text-destructive text-2xl"
                animate={prefersReducedMotion ? {} : {
                  scale: [1, 1.3, 1],
                  rotate: [0, -180, -360]
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                ❌
              </motion.div>
            </div>

            {/* Organized State */}
            <div 
              ref={organizedRef}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                animationState ==='organized' ?'opacity-100' :'opacity-0'
              }`}
            >
              {/* GatherGrove Dashboard Preview */}
              <motion.div
                className="absolute inset-8 bg-card rounded-xl shadow-2xl border border-border p-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={animationState ==='organized' ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">GatherGrove Dashboard</h3>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-success  rounded-full"></div>
                    <div className="w-3 h-3 bg-warning  rounded-full"></div>
                    <div className="w-3 h-3 bg-destructive  rounded-full"></div>
                  </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {organizedFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.id}
                      data-organized-element
                      className={`p-4 rounded-lg border-2 ${feature.color} flex items-center gap-3`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={animationState ==='organized' ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    >
                      {feature.icon}
                      <span className="font-medium">{feature.label}</span>
                      <CheckCircle className="w-4 h-4 text-success ml-auto" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Happy admin character */}
              <motion.div
                className="absolute left-1/2 bottom-8 transform -translate-x-1/2 text-4xl"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={animationState ==='organized' ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                😌
              </motion.div>

              {/* Success indicators */}
              <motion.div
                className="absolute top-4 left-4 text-success text-2xl"
                initial={{ opacity: 0, scale: 0 }}
                animate={animationState ==='organized' ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                ✅
              </motion.div>
              <motion.div
                className="absolute top-4 right-4 text-success text-2xl"
                initial={{ opacity: 0, scale: 0 }}
                animate={animationState ==='organized' ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                🎉
              </motion.div>
            </div>

            {/* Manual Trigger Button */}
            <motion.div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button
                variant="outline"
                onClick={handleManualTrigger}
                className="bg-white/90 hover:bg-white   backdrop-blur-sm"
              >
                {animationState ==='chaos' ?'See the Solution' :'Show the Problem'}
              </Button>
            </motion.div>
          </div>

          {/* Bottom messaging */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-2xl lg:text-3xl font-bold">
              {animationState ==='organized' 
                ?'One simple, powerful platform'
                :'Sound exhausting? It doesn&apos;t have to be.'
              }
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {animationState ==='organized'
                ?'Everything your club needs, beautifully organized in one place. No more juggling tools, no more missed communications.'
                :'Join club admins who&apos;ve made the switch to a simpler way of managing their communities.'
              }
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
