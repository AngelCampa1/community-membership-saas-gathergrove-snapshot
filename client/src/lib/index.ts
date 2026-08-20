/**
 * Frontend Architecture Patterns - Central Export
 * 
 * This file provides centralized access to all architectural patterns,
 * utilities, and factories for consistent usage throughout the application.
 */

// ============================================================================
// ARCHITECTURAL PATTERNS
// ============================================================================

export * from './architectural-patterns';
export { default as ArchitecturalPatterns } from './architectural-patterns';

// ============================================================================
// SERVICE LAYER
// ============================================================================

export * from './service-factory';
export { default as ServiceFactory } from './service-factory';

// ============================================================================
// CONTEXT MANAGEMENT
// ============================================================================

export * from './context-factory';
export { default as ContextPatterns } from './context-factory';

// ============================================================================
// ERROR HANDLING
// ============================================================================

export * from './error-boundary-factory';
export { default as ErrorBoundaryUtils } from './error-boundary-factory';

// ============================================================================
// ASYNC STATE MANAGEMENT
// ============================================================================

export * from './async-state-manager';
export { default as AsyncStatePatterns } from './async-state-manager';

// ============================================================================
// COMPONENT COMPOSITION
// ============================================================================

export * from './component-factory';
export { default as ComponentFactory } from './component-factory';

// ============================================================================
// TYPE SAFETY
// ============================================================================

export { default as TypeSafetyPatterns } from './type-safety-patterns';

// ============================================================================
// INTEGRATED PATTERNS
// ============================================================================

// Export simplified architecture for production build
export default {};