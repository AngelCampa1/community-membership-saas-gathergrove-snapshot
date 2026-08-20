/**
 * Web-compatible RCTNetworking implementation
 * This provides network functionality for web browsers
 */

const RCTNetworking = {
  /**
   * Send network request - web implementation using fetch
   */
  sendRequest: (method, url, headers, data, callback) => {
    const fetchOptions = {
      method: method,
      headers: headers || {},
    };

    if (data && method !== 'GET') {
      fetchOptions.body = data;
    }

    fetch(url, fetchOptions)
      .then(response => {
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return response.text().then(text => {
          if (callback) {
            callback(null, {
              status: response.status,
              statusText: response.statusText,
              headers: responseHeaders,
              body: text,
            });
          }
        });
      })
      .catch(error => {
        if (callback) {
          callback(error.message);
        }
      });
  },

  /**
   * Cancel network request
   */
  cancelRequest: () => {
    // Web implementation would use AbortController
    // For now, this is a no-op
    console.warn('Request cancellation not implemented in web stub');
  },

  /**
   * Add request listener
   */
  addListener: () => {
    // Web implementation would use EventTarget
    // For now, this is a no-op
    console.warn('Network listeners not implemented in web stub');
  },

  /**
   * Remove listeners
   */
  removeListeners: () => {
    // No-op for web compatibility
  },
};

export default RCTNetworking;