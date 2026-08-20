/* global window */
/**
 * Web-compatible BackHandler implementation
 * This provides back button handling for web browsers
 */

const BackHandler = {
  /**
   * Add event listener for hardware back button
   * On web, this is handled differently (browser back button)
   */
  addEventListener: (eventType, handler) => {
    if (eventType === 'hardwareBackPress') {
      // For web, we can listen to popstate events
      const webHandler = (event) => {
        const result = handler();
        if (!result) {
          // If handler returns false, prevent default browser back
          event.preventDefault();
          window.history.pushState(null, '', window.location.href);
        }
      };
      
      window.addEventListener('popstate', webHandler);
      return webHandler;
    }
    return () => {};
  },

  /**
   * Remove event listener
   */
  removeEventListener: (eventType, handler) => {
    if (eventType === 'hardwareBackPress' && handler) {
      window.removeEventListener('popstate', handler);
    }
  },

  /**
   * Exit app - no-op on web
   */
  exitApp: () => {
    // On web, we can't exit the app, but we can close the tab/window
    // However, browsers prevent this for security reasons
    console.warn('BackHandler.exitApp() is not supported on web');
  },
};

export default BackHandler;