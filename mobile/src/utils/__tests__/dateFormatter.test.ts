/**
 * DateFormatter Utility Tests
 * Tests for timestamp formatting functions
 *
 * Functions tested:
 * - formatChatTimestamp: Formats timestamps for chat messages
 * - formatDetailedTimestamp: Formats timestamps with full details
 * - getRelativeTime: Returns relative time descriptions
 */

import {
  formatChatTimestamp,
  formatDetailedTimestamp,
  getRelativeTime,
} from '../dateFormatter';

describe('dateFormatter', () => {
  describe('formatChatTimestamp', () => {
    it('should format recent messages with time only', () => {
      // Create a timestamp 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatChatTimestamp(twoHoursAgo.toISOString());

      // Should contain time format (locale-specific, but should have colons and digits)
      expect(result).toMatch(/\d{1,2}:\d{2}/);
      expect(result).not.toBe('Invalid date');
    });

    it('should format old messages with date', () => {
      // Create a timestamp 2 days ago
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const result = formatChatTimestamp(twoDaysAgo.toISOString());

      // Should contain a day number (locale-specific format)
      expect(result).toMatch(/\d{1,2}/);
      expect(result).not.toBe('Invalid date');
      expect(result).not.toMatch(/:\d{2}/); // Should NOT have time
    });

    it('should format very old messages with year', () => {
      // Create a timestamp 2 years ago
      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
      const result = formatChatTimestamp(twoYearsAgo.toISOString());

      // Should contain year
      expect(result).toMatch(/\d{4}/);
    });

    it('should handle invalid date strings', () => {
      const result = formatChatTimestamp('invalid-date');
      expect(result).toBe('Invalid date');
    });

    it('should handle empty string', () => {
      const result = formatChatTimestamp('');
      expect(result).toBe('Invalid date');
    });

    it('should handle messages exactly 24 hours old', () => {
      // Exactly 24 hours ago
      const exactlyOneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = formatChatTimestamp(exactlyOneDayAgo.toISOString());

      // Should show date (not time) since it's >= 24 hours
      expect(result).toMatch(/\d{1,2}/);
      expect(result).not.toBe('Invalid date');
      expect(result).not.toMatch(/:\d{2}/); // Should NOT have time
    });

    it('should handle messages just under 24 hours old', () => {
      // 23.5 hours ago
      const almostOneDayAgo = new Date(Date.now() - 23.5 * 60 * 60 * 1000);
      const result = formatChatTimestamp(almostOneDayAgo.toISOString());

      // Should show time since it's < 24 hours
      expect(result).toMatch(/\d{1,2}:\d{2}/);
      expect(result).not.toBe('Invalid date');
    });

    it('should handle current timestamp', () => {
      const now = new Date();
      const result = formatChatTimestamp(now.toISOString());

      // Should show time for current timestamp
      expect(result).toMatch(/\d{1,2}:\d{2}/);
      expect(result).not.toBe('Invalid date');
    });
  });

  describe('formatDetailedTimestamp', () => {
    it('should format timestamp with full details', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      const result = formatDetailedTimestamp(testDate.toISOString());

      // Should contain year and time (locale-specific format)
      expect(result).toMatch(/2024/); // Year
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Time
      expect(result).not.toBe('Invalid date');
    });

    it('should handle invalid date strings', () => {
      const result = formatDetailedTimestamp('invalid-date');
      expect(result).toBe('Invalid date');
    });

    it('should handle empty string', () => {
      const result = formatDetailedTimestamp('');
      expect(result).toBe('Invalid date');
    });

    it('should format current timestamp with full details', () => {
      const now = new Date();
      const result = formatDetailedTimestamp(now.toISOString());

      // Should contain year
      expect(result).toMatch(/\d{4}/);
      // Should contain time
      expect(result).toMatch(/\d{1,2}:\d{2}/);
      expect(result).not.toBe('Invalid date');
    });

    it('should format past timestamp correctly', () => {
      const pastDate = new Date('2020-06-15T14:30:00Z');
      const result = formatDetailedTimestamp(pastDate.toISOString());

      expect(result).toContain('2020');
      expect(result).toMatch(/\w{3}/); // Month abbreviation
    });

    it('should format future timestamp correctly', () => {
      const futureDate = new Date('2030-12-25T18:00:00Z');
      const result = formatDetailedTimestamp(futureDate.toISOString());

      expect(result).toContain('2030');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
      expect(result).not.toBe('Invalid date');
    });
  });

  describe('getRelativeTime', () => {
    it('should return "Just now" for very recent messages', () => {
      const justNow = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      const result = getRelativeTime(justNow.toISOString());

      expect(result).toBe('Just now');
    });

    it('should return minutes for recent messages', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = getRelativeTime(fiveMinutesAgo.toISOString());

      expect(result).toBe('5 minutes ago');
    });

    it('should handle singular minute', () => {
      const oneMinuteAgo = new Date(Date.now() - 61 * 1000); // 61 seconds
      const result = getRelativeTime(oneMinuteAgo.toISOString());

      expect(result).toBe('1 minute ago');
    });

    it('should return hours for messages within a day', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const result = getRelativeTime(threeHoursAgo.toISOString());

      expect(result).toBe('3 hours ago');
    });

    it('should handle singular hour', () => {
      const oneHourAgo = new Date(Date.now() - 61 * 60 * 1000); // 61 minutes
      const result = getRelativeTime(oneHourAgo.toISOString());

      expect(result).toBe('1 hour ago');
    });

    it('should return "Yesterday" for messages exactly 1 day ago', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = getRelativeTime(oneDayAgo.toISOString());

      expect(result).toBe('Yesterday');
    });

    it('should return days for messages within a week', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(threeDaysAgo.toISOString());

      expect(result).toBe('3 days ago');
    });

    it('should use formatChatTimestamp for messages older than a week', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(tenDaysAgo.toISOString());

      // Should contain date format (day number at minimum)
      expect(result).toMatch(/\d{1,2}/);
      expect(result).not.toBe('Invalid date');
      expect(result).not.toMatch(/ago$/); // Should NOT end with "ago"
    });

    it('should handle invalid date strings', () => {
      const result = getRelativeTime('invalid-date');
      expect(result).toBe('Invalid date');
    });

    it('should handle empty string', () => {
      const result = getRelativeTime('');
      expect(result).toBe('Invalid date');
    });

    it('should handle messages exactly at the minute boundary', () => {
      const exactlyOneMinute = new Date(Date.now() - 60 * 1000);
      const result = getRelativeTime(exactlyOneMinute.toISOString());

      expect(result).toBe('1 minute ago');
    });

    it('should handle messages at the hour boundary', () => {
      const exactlyOneHour = new Date(Date.now() - 60 * 60 * 1000);
      const result = getRelativeTime(exactlyOneHour.toISOString());

      expect(result).toBe('1 hour ago');
    });

    it('should handle messages at the day boundary', () => {
      const exactlyTwoDays = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(exactlyTwoDays.toISOString());

      expect(result).toBe('2 days ago');
    });

    it('should handle current timestamp', () => {
      const now = new Date();
      const result = getRelativeTime(now.toISOString());

      expect(result).toBe('Just now');
    });

    it('should handle 59 seconds ago', () => {
      const fiftyNineSecondsAgo = new Date(Date.now() - 59 * 1000);
      const result = getRelativeTime(fiftyNineSecondsAgo.toISOString());

      expect(result).toBe('Just now');
    });

    it('should handle 59 minutes ago', () => {
      const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60 * 1000);
      const result = getRelativeTime(fiftyNineMinutesAgo.toISOString());

      expect(result).toBe('59 minutes ago');
    });

    it('should handle 23 hours ago', () => {
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000);
      const result = getRelativeTime(twentyThreeHoursAgo.toISOString());

      expect(result).toBe('23 hours ago');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed ISO strings', () => {
      expect(formatChatTimestamp('2024-13-45T99:99:99Z')).toBe('Invalid date');
      expect(formatDetailedTimestamp('not-a-date')).toBe('Invalid date');
      expect(getRelativeTime('abc123')).toBe('Invalid date');
    });

    it('should handle null-like strings', () => {
      expect(formatChatTimestamp('null')).toBe('Invalid date');
      expect(formatDetailedTimestamp('undefined')).toBe('Invalid date');
      expect(getRelativeTime('NaN')).toBe('Invalid date');
    });

    it('should handle very old dates', () => {
      const veryOld = new Date('1900-01-01T12:00:00Z'); // Use noon UTC to avoid timezone issues

      const chatResult = formatChatTimestamp(veryOld.toISOString());
      expect(chatResult).toMatch(/\d{4}/); // Should include year
      expect(chatResult).not.toBe('Invalid date');

      const detailedResult = formatDetailedTimestamp(veryOld.toISOString());
      expect(detailedResult).toMatch(/19\d{2}/); // Should include a 19xx year
      expect(detailedResult).not.toBe('Invalid date');

      const relativeResult = getRelativeTime(veryOld.toISOString());
      expect(relativeResult).toMatch(/\d{1,2}/); // Should fall back to date format
      expect(relativeResult).not.toBe('Invalid date');
      expect(relativeResult).not.toMatch(/ago$/); // Should NOT end with "ago"
    });

    it('should handle far future dates', () => {
      const farFuture = new Date('2100-12-31T23:59:59Z');

      // Functions should still work even for future dates
      expect(formatChatTimestamp(farFuture.toISOString())).toBeDefined();
      expect(formatDetailedTimestamp(farFuture.toISOString())).toContain('2100');
      expect(getRelativeTime(farFuture.toISOString())).toBeDefined();
    });
  });

  describe('Future Timestamps', () => {
    it('should return "In a moment" for timestamps less than 1 minute in future', () => {
      const inMoment = new Date(Date.now() + 30 * 1000); // 30 seconds in future
      const result = getRelativeTime(inMoment.toISOString());

      expect(result).toBe('In a moment');
    });

    it('should return minutes for future timestamps within an hour', () => {
      const inFiveMinutes = new Date(Date.now() + 5 * 60 * 1000);
      const result = getRelativeTime(inFiveMinutes.toISOString());

      expect(result).toBe('In 5 minutes');
    });

    it('should handle singular minute for future timestamps', () => {
      const inOneMinute = new Date(Date.now() + 61 * 1000); // 61 seconds
      const result = getRelativeTime(inOneMinute.toISOString());

      expect(result).toBe('In 1 minute');
    });

    it('should return hours for future timestamps within a day', () => {
      const inThreeHours = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const result = getRelativeTime(inThreeHours.toISOString());

      expect(result).toBe('In 3 hours');
    });

    it('should handle singular hour for future timestamps', () => {
      const inOneHour = new Date(Date.now() + 61 * 60 * 1000); // 61 minutes
      const result = getRelativeTime(inOneHour.toISOString());

      expect(result).toBe('In 1 hour');
    });

    it('should not return zero days for timestamps just under a day in future', () => {
      const almostTomorrow = new Date(Date.now() + (24 * 60 * 60 * 1000) - 1000);
      const result = getRelativeTime(almostTomorrow.toISOString());

      expect(result).toBe('In 24 hours');
    });

    it('should return "Tomorrow" for timestamps exactly 1 day in future', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = getRelativeTime(tomorrow.toISOString());

      expect(result).toBe('Tomorrow');
    });

    it('should return days for future timestamps within a week', () => {
      // Add a 1-hour buffer to avoid edge case at day boundaries
      const inThreeDays = new Date(Date.now() + (3 * 24 + 1) * 60 * 60 * 1000);
      const result = getRelativeTime(inThreeDays.toISOString());

      expect(result).toBe('In 3 days');
    });

    it('should use formatChatTimestamp for future timestamps beyond a week', () => {
      const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(inTenDays.toISOString());

      // Should contain date format (day number at minimum)
      expect(result).toMatch(/\d{1,2}/);
      expect(result).not.toBe('Invalid date');
      expect(result).not.toMatch(/^In /); // Should NOT start with "In "
    });
  });

  describe('Timezone Handling', () => {
    it('should handle UTC timestamps correctly', () => {
      const utcDate = new Date('2024-01-15T12:00:00Z');

      const chatResult = formatChatTimestamp(utcDate.toISOString());
      expect(chatResult).toBeDefined();
      expect(chatResult).not.toBe('Invalid date');
    });

    it('should handle timestamps with timezone offsets', () => {
      const timestampWithOffset = '2024-01-15T12:00:00-05:00';

      const chatResult = formatChatTimestamp(timestampWithOffset);
      expect(chatResult).toBeDefined();
      expect(chatResult).not.toBe('Invalid date');
    });

    it('should handle timestamps without timezone info', () => {
      const noTimezone = '2024-01-15T12:00:00';

      const chatResult = formatChatTimestamp(noTimezone);
      expect(chatResult).toBeDefined();
      expect(chatResult).not.toBe('Invalid date');
    });
  });
});
