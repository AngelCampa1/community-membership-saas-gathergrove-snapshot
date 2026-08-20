/**
 * Database Test Helpers - Mock Implementation for Offline Testing
 */

class DatabaseTestHelpers {
  constructor() {
    this.mockData = {
      clubs: new Map(),
      users: new Map(),
      members: new Map(),
      events: new Map(),
      rsvps: new Map(),
      attendance: new Map()
    };
    this.nextId = 1;
    
    // Initialize with some default test data
    this.initializeDefaultData();
  }

  initializeDefaultData() {
    // Create default test club
    const defaultClub = {
      id: 1,
      name: 'Test Club',
      description: 'Default test club',
      tier: 'Grow',
      memberCount: 5
    };
    this.mockData.clubs.set(1, defaultClub);

    // Create default test user/admin
    const defaultUser = {
      id: 1,
      email: 'test.admin@example.com',
      fullName: 'Test Admin User',
      role: 'Admin',
      clubId: 1
    };
    this.mockData.users.set(1, defaultUser);
  }

  async setupTestDatabase() {
    console.log('🔧 Setting up mock test database');
    return Promise.resolve();
  }

  async seedTestData() {
    console.log('🌱 Seeding mock test data');
    return Promise.resolve();
  }

  async cleanupTestDatabase() {
    console.log('🧹 Cleaning up mock test database');
    this.mockData = {
      clubs: new Map(),
      users: new Map(),
      members: new Map(),
      events: new Map(),
      rsvps: new Map(),
      attendance: new Map()
    };
    return Promise.resolve();
  }

  async clearTestData() {
    this.mockData.clubs.clear();
    this.mockData.users.clear();
    this.mockData.members.clear();
    this.mockData.events.clear();
    this.mockData.rsvps.clear();
    this.mockData.attendance.clear();
    return Promise.resolve();
  }

  // Add missing helper functions that tests are looking for
  async createTestMember(memberData) {
    const member = {
      id: this.nextId++,
      email: `member${this.nextId}@test.com`,
      fullName: `Test Member ${this.nextId}`,
      clubId: 1,
      status: 'Active',
      ...memberData
    };
    this.mockData.members.set(member.id, member);
    return member;
  }

  async cleanupTestMember(memberId) {
    this.mockData.members.delete(memberId);
    return Promise.resolve();
  }

  async createTestEvent(eventData) {
    const event = {
      id: this.nextId++,
      name: eventData.name || 'Test Event',
      date: eventData.date || new Date(),
      clubId: eventData.clubId || 1,
      location: 'Test Location',
      maxAttendees: 50,
      ...eventData
    };
    this.mockData.events.set(event.id, event);
    return event;
  }

  async createTestClub(clubData) {
    const club = {
      id: this.nextId++,
      name: clubData?.name || 'Test Club',
      description: 'Test club description',
      tier: 'Grow',
      memberCount: 0,
      ...clubData
    };
    this.mockData.clubs.set(club.id, club);
    return club;
  }

  async createTestUser(userData) {
    const user = {
      id: this.nextId++,
      email: userData?.email || `user${this.nextId}@test.com`,
      fullName: userData?.fullName || `Test User ${this.nextId}`,
      role: 'Member',
      clubId: 1,
      ...userData
    };
    this.mockData.users.set(user.id, user);
    return user;
  }

  async createTestClub(clubData) {
    const club = {
      id: this.nextId++,
      name: clubData.name || 'Test Club',
      tier: clubData.tier || 'Grow',
      settings: clubData.settings || {},
      createdAt: new Date()
    };
    this.mockData.clubs.set(club.id, club);
    return club;
  }

  async createTestUser(userData) {
    const user = {
      id: this.nextId++,
      email: userData.email,
      role: userData.role || 'Member',
      clubId: userData.clubId,
      isVerified: userData.isVerified || false,
      fullName: userData.fullName || userData.email.split('@')[0],
      createdAt: new Date()
    };
    this.mockData.users.set(user.id, user);
    return user;
  }

  async createTestMember(memberData) {
    const member = {
      id: this.nextId++,
      clubId: memberData.clubId,
      fullName: memberData.fullName,
      email: memberData.email,
      status: memberData.status || 'Active',
      createdAt: new Date()
    };
    this.mockData.members.set(member.id, member);
    return member;
  }

  async createTestMembersBatch(membersData) {
    return Promise.all(membersData.map(memberData => this.createTestMember(memberData)));
  }

  async executeBatch(promises, batchSize = 100) {
    const results = [];
    for (let i = 0; i < promises.length; i += batchSize) {
      const batch = promises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    return results;
  }

  async simulateConnectionFailure() {
    console.log('🔥 Simulating database connection failure');
    this.connectionFailed = true;
  }

  async restoreConnection() {
    console.log('✅ Restoring database connection');
    this.connectionFailed = false;
  }
}

module.exports = { DatabaseTestHelpers };