/* global window */
/**
 * Web-compatible RCTAlertManager implementation
 * This provides alert functionality for web browsers using native browser APIs
 */

const RCTAlertManager = {
  /**
   * Show an alert dialog
   * On web, we use the native browser alert() function
   */
  alertWithArgs: (args, callback) => {
    const { title, message, buttons } = args;
    
    if (buttons && buttons.length > 1) {
      // For multiple buttons, use confirm() for now
      // In a real implementation, you'd create a custom modal
      const result = window.confirm(`${title}\n\n${message}`);
      if (callback) {
        callback(result ? 0 : 1); // 0 for first button, 1 for second
      }
    } else {
      // Single button or no buttons - use alert()
      window.alert(`${title}\n\n${message}`);
      if (callback) {
        callback(0);
      }
    }
  },

  /**
   * Legacy alert method
   */
  alert: (title, message, callback) => {
    window.alert(`${title}\n\n${message}`);
    if (callback) {
      callback();
    }
  },

  /**
   * Show alert with buttons
   */
  alertWithButtons: (title, message, buttons, callback) => {
    // For web compatibility, we'll use native browser dialogs
    // In a production app, you'd want to implement custom modals
    if (buttons && buttons.length > 1) {
      const result = window.confirm(`${title}\n\n${message}`);
      if (callback) {
        callback(result ? 0 : 1);
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      if (callback) {
        callback(0);
      }
    }
  }
};

export default RCTAlertManager;