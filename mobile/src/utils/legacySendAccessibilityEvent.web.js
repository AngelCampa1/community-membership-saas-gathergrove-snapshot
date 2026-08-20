/**
 * Web-compatible legacySendAccessibilityEvent implementation
 * This provides accessibility event handling for web browsers
 */

/* global document */

/**
 * Legacy accessibility event handler for web
 * On web, we can use standard DOM accessibility events
 */
function legacySendAccessibilityEvent(reactTag, eventType) {
  // On web, we can dispatch custom accessibility events
  // This is a simplified implementation for web compatibility
  if (typeof document !== 'undefined' && reactTag) {
    try {
      // Find the DOM element by react tag (if possible)
      // In a real implementation, you'd need to map React tags to DOM elements
      // For now, just create a generic accessibility event
      const event = new CustomEvent('accessibility', {
        detail: {
          reactTag,
          eventType,
        },
      });
      
      // Dispatch on document for global accessibility handling
      document.dispatchEvent(event);
    } catch (error) {
      // Silently fail on web - accessibility events are not critical for basic functionality
      console.warn('Could not send accessibility event:', error);
    }
  }
}

export default legacySendAccessibilityEvent;