/**
 * @fileoverview WebSocket Test Helpers
 * @description Helper functions for WebSocket operations in integration tests
 * @author Claude Code - Hive Mind Integration Specialist
 */

const EventEmitter = require('events');

/**
 * Mock WebSocket Client for testing
 */
class MockWebSocketClient extends EventEmitter {
  constructor(userId, token) {
    super();
    this.userId = userId;
    this.token = token;
    this.readyState = 1; // OPEN
    this.subscriptions = new Set();
    this.connected = true;
  }

  emit(event, data) {
    // Simulate async WebSocket events
    setTimeout(() => {
      super.emit(event, data);
    }, 10);
  }

  close() {
    this.readyState = 3; // CLOSED
    this.connected = false;
    this.emit('close');
  }

  get OPEN() {
    return 1;
  }

  subscribe(channel) {
    this.subscriptions.add(channel);
  }

  unsubscribe(channel) {
    this.subscriptions.delete(channel);
  }
}

/**
 * WebSocket Test Helpers for integration tests
 */
class WebSocketTestHelpers {
  constructor() {
    this.clients = new Map();
    this.activeConnections = new Set();
    this.messageHistory = [];
  }

  /**
   * Connect a user to the WebSocket server
   */
  async connectAsUser(userId, token) {
    const client = new MockWebSocketClient(userId, token);
    const clientId = `${userId}-${Date.now()}`;
    
    this.clients.set(clientId, client);
    this.activeConnections.add(clientId);

    // Simulate connection establishment
    await new Promise(resolve => setTimeout(resolve, 50));

    // Set up event logging
    client.on('engagement-update', (data) => {
      this.messageHistory.push({
        type: 'engagement-update',
        userId,
        timestamp: new Date(),
        data
      });
    });

    return client;
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(event, data) {
    this.activeConnections.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.connected) {
        client.emit(event, data);
      }
    });
  }

  /**
   * Broadcast to clients subscribed to a specific event
   */
  broadcastToSubscribers(eventId, eventType, data) {
    this.activeConnections.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.connected && client.subscriptions.has(`event-${eventId}`)) {
        client.emit('engagement-update', {
          eventId,
          type: eventType,
          ...data
        });
      }
    });
  }

  /**
   * Simulate real-time engagement update
   */
  simulateEngagementUpdate(eventId, updateType, data = {}) {
    const updateData = {
      eventId,
      type: updateType,
      timestamp: new Date(),
      ...data
    };

    // Simulate processing delay
    setTimeout(() => {
      this.broadcastToSubscribers(eventId, updateType, updateData);
    }, 50);
  }

  /**
   * Close specific client connection
   */
  disconnectClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.close();
      this.activeConnections.delete(clientId);
    }
  }

  /**
   * Close all WebSocket connections
   */
  async closeConnections() {
    const closePromises = Array.from(this.activeConnections).map(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.connected) {
        return new Promise(resolve => {
          client.on('close', resolve);
          client.close();
        });
      }
      return Promise.resolve();
    });

    await Promise.all(closePromises);
    
    this.clients.clear();
    this.activeConnections.clear();
    this.messageHistory = [];
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      totalClients: this.clients.size,
      activeConnections: this.activeConnections.size,
      messageHistory: this.messageHistory.length
    };
  }

  /**
   * Get message history for testing
   */
  getMessageHistory(userId = null, eventType = null) {
    let history = this.messageHistory;
    
    if (userId) {
      history = history.filter(msg => msg.userId === userId);
    }
    
    if (eventType) {
      history = history.filter(msg => msg.type === eventType);
    }
    
    return history;
  }

  /**
   * Clear message history
   */
  clearHistory() {
    this.messageHistory = [];
  }

  /**
   * Simulate WebSocket latency and connection issues
   */
  simulateConnectionIssues(clientId, issueType = 'disconnect') {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (issueType) {
      case 'disconnect':
        client.connected = false;
        client.emit('disconnect');
        break;
      
      case 'reconnect':
        client.connected = true;
        client.emit('connect');
        break;
      
      case 'latency':
        // Increase artificial delay for this client
        const originalEmit = client.emit;
        client.emit = function(event, data) {
          setTimeout(() => originalEmit.call(this, event, data), 500);
        };
        break;
    }
  }

  /**
   * Test WebSocket performance under load
   */
  async performanceTest(clientCount = 50, messageCount = 100) {
    const clients = [];
    const startTime = Date.now();

    // Create multiple clients
    for (let i = 0; i < clientCount; i++) {
      const client = await this.connectAsUser(i, `token-${i}`);
      clients.push(client);
    }

    // Send messages to all clients
    for (let i = 0; i < messageCount; i++) {
      this.broadcast('test-message', { messageId: i, timestamp: Date.now() });
    }

    // Wait for all messages to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Cleanup
    await Promise.all(clients.map(client => 
      new Promise(resolve => {
        client.on('close', resolve);
        client.close();
      })
    ));

    return {
      clientCount,
      messageCount,
      totalTime,
      averageTimePerMessage: totalTime / messageCount,
      messagesPerSecond: (messageCount * clientCount) / (totalTime / 1000)
    };
  }

  /**
   * Mock subscription to event engagement updates
   */
  subscribeToEventEngagement(client, eventId) {
    if (client instanceof MockWebSocketClient) {
      client.subscribe(`event-${eventId}`);
      client.emit('subscribe-event-engagement', { eventId });
    }
  }

  /**
   * Mock unsubscribe from event engagement updates
   */
  unsubscribeFromEventEngagement(client, eventId) {
    if (client instanceof MockWebSocketClient) {
      client.unsubscribe(`event-${eventId}`);
      client.emit('unsubscribe-event-engagement', { eventId });
    }
  }

  /**
   * Validate WebSocket message format
   */
  validateMessageFormat(message) {
    const requiredFields = ['type', 'timestamp'];
    return requiredFields.every(field => message.hasOwnProperty(field));
  }

  /**
   * Get statistics about WebSocket usage
   */
  getUsageStats() {
    const now = Date.now();
    const recentMessages = this.messageHistory.filter(
      msg => now - msg.timestamp.getTime() < 60000 // Last minute
    );

    return {
      totalConnections: this.clients.size,
      activeConnections: this.activeConnections.size,
      totalMessages: this.messageHistory.length,
      recentMessages: recentMessages.length,
      messageTypes: [...new Set(this.messageHistory.map(msg => msg.type))],
      averageConnectionTime: this.calculateAverageConnectionTime()
    };
  }

  /**
   * Calculate average connection time (mock implementation)
   */
  calculateAverageConnectionTime() {
    // Simplified calculation for testing
    return this.activeConnections.size > 0 ? 300000 : 0; // 5 minutes average
  }

  /**
   * Cleanup method for test teardown
   */
  async cleanup() {
    await this.closeConnections();
    this.messageHistory = [];
  }
}

module.exports = { WebSocketTestHelpers };