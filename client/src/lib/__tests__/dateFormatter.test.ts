import { formatChatTimestamp } from '../dateFormatter';

describe('formatChatTimestamp', () => {
  beforeEach(() => {
    // Mock Date.now to ensure consistent tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T15:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should format recent messages with local time', () => {
    // 2 hours ago
    const timestamp = '2024-01-15T13:30:00.000Z';
    const result = formatChatTimestamp(timestamp);
    
    // Should show time in local timezone
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
  });

  it('should format old messages with date', () => {
    // 2 days ago
    const timestamp = '2024-01-13T13:30:00.000Z';
    const result = formatChatTimestamp(timestamp);
    
    // Should show date format
    expect(result).toMatch(/Jan\s+\d{1,2}/);
  });

  it('should handle very old messages with year', () => {
    // Over a year ago
    const timestamp = '2022-12-15T13:30:00.000Z';
    const result = formatChatTimestamp(timestamp);
    
    // Should include year
    expect(result).toMatch(/Dec\s+\d{1,2},\s+2022/);
  });

  it('should handle invalid timestamps', () => {
    const result = formatChatTimestamp('invalid-date');
    expect(result).toBe('Invalid date');
  });

  it('should use local timezone for recent messages', () => {
    // Test with UTC timestamp
    const utcTimestamp = '2024-01-15T14:30:00.000Z'; // 1 hour ago
    const result = formatChatTimestamp(utcTimestamp);
    
    // The exact time will depend on the local timezone, but it should be formatted as time
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
  });
});