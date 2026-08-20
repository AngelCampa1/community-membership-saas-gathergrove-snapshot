'use client';

// Optimized animation configurations for 60fps performance
import { Variants, Transition } from 'framer-motion';

// High-performance transition configurations
export const performanceTransition: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.3,
};

export const springTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1,
};

export const smoothTransition: Transition = {
  type: "tween",
  ease: [0.25, 0.1, 0.25, 1], // Custom cubic-bezier for smooth motion
  duration: 0.4,
};

// Optimized animation variants that use transform and opacity only
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    transition: performanceTransition,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: performanceTransition,
  },
};

export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -30,
    transition: performanceTransition,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: performanceTransition,
  },
};

export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 30,
    transition: performanceTransition,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: performanceTransition,
  },
};

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    transition: performanceTransition,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springTransition,
  },
};

export const slideInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    transition: performanceTransition,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: smoothTransition,
  },
};

// Stagger container variants
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const fastStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

// Hover and interaction animations
export const hoverScale: Variants = {
  rest: { 
    scale: 1,
    transition: performanceTransition,
  },
  hover: { 
    scale: 1.05,
    transition: springTransition,
  },
  tap: { 
    scale: 0.95,
    transition: { ...springTransition, duration: 0.1 },
  },
};

export const hoverGlow: Variants = {
  rest: { 
    boxShadow: "0 0 0 rgba(59, 130, 246, 0)",
    transition: performanceTransition,
  },
  hover: { 
    boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
    transition: performanceTransition,
  },
};

// Reduced motion variants (accessibility)
export const reduceMotion = (variants: Variants): Variants => {
  const reduced: Variants = {};
  
  Object.keys(variants).forEach(key => {
    reduced[key] = {
      ...variants[key],
      transition: {
        duration: 0.01,
        type: "tween",
      },
    };
  });
  
  return reduced;
};

// Utility function to check for reduced motion preference
export const checkReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Animation helper that respects user preferences
export const getMotionVariants = (variants: Variants): Variants => {
  if (typeof window !== 'undefined' && checkReducedMotion()) {
    return reduceMotion(variants);
  }
  return variants;
};

// Performance-optimized motion configuration
export const motionConfig = {
  // Use hardware acceleration
  style: {
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden' as const,
    perspective: 1000,
  },
  // Optimize for performance
  layoutId: undefined,
  layout: false,
  layoutDependency: undefined,
};

// Custom easing functions for smooth animations
export const easing = {
  // Material Design easing
  standard: [0.25, 0.1, 0.25, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
  
  // Custom smooth easing
  smooth: [0.25, 0.46, 0.45, 0.94],
  bounce: [0.68, -0.55, 0.265, 1.55],
  
  // Performance-optimized easing
  fastOut: [0.4, 0, 0.2, 1],
  slowIn: [0, 0, 0.2, 1],
};

// Animation timing constants
export const timing = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
};

// Intersection observer variants for scroll-triggered animations
export const scrollAnimations = {
  fadeInOnScroll: {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: timing.normal,
        ease: easing.fastOut,
      },
    },
  },
  scaleInOnScroll: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: timing.normal,
        ease: easing.smooth,
      },
    },
  },
  slideInOnScroll: {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: timing.normal,
        ease: easing.fastOut,
      },
    },
  },
};