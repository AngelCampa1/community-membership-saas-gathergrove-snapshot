/**
 * @fileoverview Event Test Helpers
 * @description Helper functions for event operations in integration tests
 * @author Claude Code - Hive Mind Integration Specialist
 */

/**
 * Event Test Helpers for integration tests
 */
class EventTestHelpers {
  constructor() {
    this.mockEvents = new Map();
    this.mockRSVPs = new Map();
    this.mockAttendance = new Map();
  }

  /**
   * Create a test event
   */
  async createTestEvent(eventData) {
    const event = {
      id: eventData.id || this.generateId(),
      clubId: eventData.clubId || 1,
      title: eventData.title || 'Test Event',
      description: eventData.description || 'Test event description',
      startDate: eventData.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: eventData.endDate || new Date(Date.now() + 25 * 60 * 60 * 1000),
      location: eventData.location || 'Test Location',
      maxAttendees: eventData.maxAttendees || 50,
      createdAt: new Date(),
      ...eventData
    };

    this.mockEvents.set(event.id, event);
    return event;
  }

  /**
   * Update event dates
   */
  async updateEventDates(eventId, dates) {
    const event = this.mockEvents.get(eventId);
    if (event) {
      if (dates.startDate) event.startDate = dates.startDate;
      if (dates.endDate) event.endDate = dates.endDate;
      event.updatedAt = new Date();
    }
    return event;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId) {
    return this.mockEvents.get(eventId);
  }

  /**
   * Delete test event
   */
  async deleteTestEvent(eventId) {
    this.mockEvents.delete(eventId);
    return Promise.resolve();
  }

  /**
   * Create RSVP for event
   */
  async createRSVP(eventId, memberId, response = 'yes') {
    const rsvp = {
      id: this.generateId(),
      eventId,
      memberId,
      response,
      createdAt: new Date()
    };
    this.mockRSVPs.set(rsvp.id, rsvp);
    return rsvp;
  }

  /**
   * Record attendance
   */
  async recordAttendance(eventId, memberId, checkedIn = true) {
    const attendance = {
      id: this.generateId(),
      eventId,
      memberId,
      checkedIn,
      checkedInAt: checkedIn ? new Date() : null
    };
    this.mockAttendance.set(attendance.id, attendance);
    return attendance;
  }

  /**
   * Clean up test events
   */
  async cleanupTestEvents() {
    this.mockEvents.clear();
    this.mockRSVPs.clear();
    this.mockAttendance.clear();
    return Promise.resolve();
  }

  /**
   * Create an RSVP for an event
   */
  async createRSVP(rsvpData) {
    const rsvp = {
      id: rsvpData.id || this.generateId(),
      eventId: rsvpData.eventId,
      memberId: rsvpData.memberId,
      status: rsvpData.status || 'Yes',
      createdAt: rsvpData.createdAt || new Date(),
      notifyOrganizer: rsvpData.notifyOrganizer || false,
      ...rsvpData
    };

    const key = `${rsvp.eventId}-${rsvp.memberId}`;
    this.mockRSVPs.set(key, rsvp);
    return rsvp;
  }

  /**
   * Create attendance record
   */
  async createAttendance(attendanceData) {
    const attendance = {
      id: attendanceData.id || this.generateId(),
      eventId: attendanceData.eventId,
      memberId: attendanceData.memberId,
      checkedIn: attendanceData.checkedIn || true,
      checkedInAt: attendanceData.checkedInAt || new Date(),
      notes: attendanceData.notes || '',
      ...attendanceData
    };

    const key = `${attendance.eventId}-${attendance.memberId}`;
    this.mockAttendance.set(key, attendance);
    return attendance;
  }

  /**
   * Get event by ID
   */
  getEvent(eventId) {
    return this.mockEvents.get(eventId);
  }

  /**
   * Get RSVPs for an event
   */
  getRSVPsForEvent(eventId) {
    return Array.from(this.mockRSVPs.values())
      .filter(rsvp => rsvp.eventId === eventId);
  }

  /**
   * Get attendance for an event
   */
  getAttendanceForEvent(eventId) {
    return Array.from(this.mockAttendance.values())
      .filter(attendance => attendance.eventId === eventId);
  }

  /**
   * Get RSVP by event and member
   */
  getRSVP(eventId, memberId) {
    const key = `${eventId}-${memberId}`;
    return this.mockRSVPs.get(key);
  }

  /**
   * Get attendance by event and member
   */
  getAttendance(eventId, memberId) {
    const key = `${eventId}-${memberId}`;
    return this.mockAttendance.get(key);
  }

  /**
   * Calculate engagement metrics for an event
   */
  calculateEventEngagement(eventId) {
    const rsvps = this.getRSVPsForEvent(eventId);
    const attendance = this.getAttendanceForEvent(eventId);
    
    const yesRSVPs = rsvps.filter(rsvp => rsvp.status === 'Yes');
    const actualAttendance = attendance.filter(att => att.checkedIn);

    const totalMembers = 5; // Assume 5 test members
    const rsvpCount = yesRSVPs.length;
    const attendanceCount = actualAttendance.length;
    const rsvpRate = totalMembers > 0 ? rsvpCount / totalMembers : 0;
    const attendanceRate = rsvpCount > 0 ? attendanceCount / rsvpCount : 0;
    
    // Simple engagement score calculation
    const engagementScore = Math.round((rsvpRate * 40 + attendanceRate * 60) * 100);

    return {
      eventId,
      totalMembers,
      rsvpCount,
      attendanceCount,
      rsvpRate,
      attendanceRate,
      engagementScore
    };
  }

  /**
   * Generate mock event trends data
   */
  generateEventTrends(eventIds, daysBack = 30) {
    const trends = eventIds.map((eventId, index) => {
      const date = new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)); // Weekly intervals
      const engagement = this.calculateEventEngagement(eventId);
      
      return {
        date: date.toISOString().split('T')[0],
        eventId,
        ...engagement
      };
    });

    const summary = {
      totalEvents: trends.length,
      averageRsvpRate: trends.reduce((sum, t) => sum + t.rsvpRate, 0) / trends.length,
      averageAttendanceRate: trends.reduce((sum, t) => sum + t.attendanceRate, 0) / trends.length,
      averageEngagementScore: trends.reduce((sum, t) => sum + t.engagementScore, 0) / trends.length
    };

    const overallImprovement = {
      rsvpImprovement: trends.length > 1 ? trends[0].rsvpRate - trends[trends.length - 1].rsvpRate : 0,
      attendanceImprovement: trends.length > 1 ? trends[0].attendanceRate - trends[trends.length - 1].attendanceRate : 0,
      engagementImprovement: trends.length > 1 ? trends[0].engagementScore - trends[trends.length - 1].engagementScore : 0
    };

    return {
      trends,
      summary,
      overallImprovement
    };
  }

  /**
   * Clean up test event data
   */
  async cleanupTestEvent(eventId) {
    this.mockEvents.delete(eventId);
    
    // Remove associated RSVPs and attendance
    const rsvpKeys = Array.from(this.mockRSVPs.keys()).filter(key => key.startsWith(`${eventId}-`));
    const attendanceKeys = Array.from(this.mockAttendance.keys()).filter(key => key.startsWith(`${eventId}-`));
    
    rsvpKeys.forEach(key => this.mockRSVPs.delete(key));
    attendanceKeys.forEach(key => this.mockAttendance.delete(key));
  }

  /**
   * Record test attendance for bulk operations
   */
  async recordTestAttendance(eventId, memberId) {
    return this.createAttendance({
      eventId,
      memberId,
      checkedIn: true,
      checkedInAt: new Date()
    });
  }

  /**
   * Generate a unique ID
   */
  generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      events: this.mockEvents.size,
      rsvps: this.mockRSVPs.size,
      attendance: this.mockAttendance.size
    };
  }

  /**
   * Clear all test data
   */
  clearAll() {
    this.mockEvents.clear();
    this.mockRSVPs.clear();
    this.mockAttendance.clear();
  }
}

module.exports = { EventTestHelpers };