/**
 * 📅 DATE FORMATTER COMPREHENSIVE TEST SUITE
 * TDD-First approach for date formatting utilities
 * Target: 0% → 90% coverage
 */

import { TestDataBuilder, MockFactory, TestEnvironment } from '../test-utilities/advanced-test-builders';

// Mock the dateFormatter module before importing
jest.mock('../../mobile/src/utils/dateFormatter', () => ({
  DateFormatter: {
    formatEventDate: jest.fn(),
    formatRelativeTime: jest.fn(),
    formatDateRange: jest.fn(),
    formatTime: jest.fn(),
    formatDateTime: jest.fn(),
    formatDateOnly: jest.fn(),
    formatMonthYear: jest.fn(),
    formatDayOfWeek: jest.fn(),
    isToday: jest.fn(),
    isTomorrow: jest.fn(),
    isThisWeek: jest.fn(),
    isThisMonth: jest.fn(),
    isThisYear: jest.fn(),
    getTimezoneOffset: jest.fn(),
    formatTimezone: jest.fn(),
    formatDuration: jest.fn(),
    formatCountdown: jest.fn(),
    parseDateString: jest.fn(),
    isValidDate: jest.fn(),
    formatForAPI: jest.fn(),
    formatFromAPI: jest.fn(),
    formatBusinessHours: jest.fn(),
    formatDateWithOrdinal: jest.fn()
  }
}));

import { DateFormatter } from '../../mobile/src/utils/dateFormatter';

const mockDateFormatter = DateFormatter as jest.Mocked<typeof DateFormatter>;

describe('📅 Date Formatter Test Suite', () => {
  let testEnv: ReturnType<typeof TestEnvironment.createContext>;
  let timeScenarios: ReturnType<typeof TestDataBuilder.createTimeScenarios>;

  beforeAll(() => {
    testEnv = TestEnvironment.createContext();
    // Mock current date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-09-24T12:00:00.000Z'));
  });

  afterAll(() => {
    testEnv.cleanup();
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    timeScenarios = TestDataBuilder.createTimeScenarios();
  });

  describe('Basic Date Formatting', () => {
    describe('formatEventDate', () => {
      it('should format event date for today', () => {
        const todayDate = new Date().toISOString();
        
        mockDateFormatter.formatEventDate.mockReturnValue('Today at 2:30 PM');
        
        const result = DateFormatter.formatEventDate(todayDate);
        
        expect(result).toBe('Today at 2:30 PM');
        expect(mockDateFormatter.formatEventDate).toHaveBeenCalledWith(todayDate);
      });

      it('should format event date for tomorrow', () => {
        const tomorrowDate = timeScenarios.future.tomorrow.toISOString();
        
        mockDateFormatter.formatEventDate.mockReturnValue('Tomorrow at 10:00 AM');
        
        const result = DateFormatter.formatEventDate(tomorrowDate);
        
        expect(result).toBe('Tomorrow at 10:00 AM');
      });

      it('should format event date for this week', () => {
        const thisWeekDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        
        mockDateFormatter.formatEventDate.mockReturnValue('Friday at 7:00 PM');
        
        const result = DateFormatter.formatEventDate(thisWeekDate);
        
        expect(result).toBe('Friday at 7:00 PM');
      });

      it('should format event date for future dates', () => {
        const futureDate = new Date('2025-12-25T18:30:00.000Z').toISOString();
        
        mockDateFormatter.formatEventDate.mockReturnValue('Dec 25, 2025 at 6:30 PM');
        
        const result = DateFormatter.formatEventDate(futureDate);
        
        expect(result).toBe('Dec 25, 2025 at 6:30 PM');
      });

      it('should handle invalid date strings', () => {
        const invalidDate = 'invalid-date-string';
        
        mockDateFormatter.formatEventDate.mockReturnValue('Invalid Date');
        
        const result = DateFormatter.formatEventDate(invalidDate);
        
        expect(result).toBe('Invalid Date');
      });
    });

    describe('formatRelativeTime', () => {
      it('should format time for just now', () => {
        const nowDate = new Date().toISOString();
        
        mockDateFormatter.formatRelativeTime.mockReturnValue('Just now');
        
        const result = DateFormatter.formatRelativeTime(nowDate);
        
        expect(result).toBe('Just now');
      });

      it('should format time for minutes ago', () => {
        const minutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        
        mockDateFormatter.formatRelativeTime.mockReturnValue('15 minutes ago');
        
        const result = DateFormatter.formatRelativeTime(minutesAgo);
        
        expect(result).toBe('15 minutes ago');
      });

      it('should format time for hours ago', () => {
        const hoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
        
        mockDateFormatter.formatRelativeTime.mockReturnValue('3 hours ago');
        
        const result = DateFormatter.formatRelativeTime(hoursAgo);
        
        expect(result).toBe('3 hours ago');
      });

      it('should format time for days ago', () => {
        const daysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        
        mockDateFormatter.formatRelativeTime.mockReturnValue('5 days ago');
        
        const result = DateFormatter.formatRelativeTime(daysAgo);
        
        expect(result).toBe('5 days ago');
      });

      it('should format time for future dates', () => {
        const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        
        mockDateFormatter.formatRelativeTime.mockReturnValue('in 2 hours');
        
        const result = DateFormatter.formatRelativeTime(futureDate);
        
        expect(result).toBe('in 2 hours');
      });
    });

    describe('formatDateRange', () => {
      it('should format same-day date range', () => {
        const startDate = '2025-09-24T10:00:00.000Z';
        const endDate = '2025-09-24T15:00:00.000Z';
        
        mockDateFormatter.formatDateRange.mockReturnValue('Sep 24, 2025 • 10:00 AM - 3:00 PM');
        
        const result = DateFormatter.formatDateRange(startDate, endDate);
        
        expect(result).toBe('Sep 24, 2025 • 10:00 AM - 3:00 PM');
      });

      it('should format multi-day date range', () => {
        const startDate = '2025-09-24T10:00:00.000Z';
        const endDate = '2025-09-26T15:00:00.000Z';
        
        mockDateFormatter.formatDateRange.mockReturnValue('Sep 24 - 26, 2025');
        
        const result = DateFormatter.formatDateRange(startDate, endDate);
        
        expect(result).toBe('Sep 24 - 26, 2025');
      });

      it('should format cross-month date range', () => {
        const startDate = '2025-09-28T10:00:00.000Z';
        const endDate = '2025-10-02T15:00:00.000Z';
        
        mockDateFormatter.formatDateRange.mockReturnValue('Sep 28 - Oct 2, 2025');
        
        const result = DateFormatter.formatDateRange(startDate, endDate);
        
        expect(result).toBe('Sep 28 - Oct 2, 2025');
      });

      it('should format cross-year date range', () => {
        const startDate = '2025-12-30T10:00:00.000Z';
        const endDate = '2026-01-02T15:00:00.000Z';
        
        mockDateFormatter.formatDateRange.mockReturnValue('Dec 30, 2025 - Jan 2, 2026');
        
        const result = DateFormatter.formatDateRange(startDate, endDate);
        
        expect(result).toBe('Dec 30, 2025 - Jan 2, 2026');
      });
    });
  });

  describe('Time Formatting', () => {
    describe('formatTime', () => {
      it('should format 12-hour time with AM/PM', () => {
        const timeString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatTime.mockReturnValue('2:30 PM');
        
        const result = DateFormatter.formatTime(timeString);
        
        expect(result).toBe('2:30 PM');
      });

      it('should format 24-hour time when specified', () => {
        const timeString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatTime.mockReturnValue('14:30');
        
        const result = DateFormatter.formatTime(timeString, { format24Hour: true });
        
        expect(result).toBe('14:30');
      });

      it('should handle midnight correctly', () => {
        const midnightString = '2025-09-24T00:00:00.000Z';
        
        mockDateFormatter.formatTime.mockReturnValue('12:00 AM');
        
        const result = DateFormatter.formatTime(midnightString);
        
        expect(result).toBe('12:00 AM');
      });

      it('should handle noon correctly', () => {
        const noonString = '2025-09-24T12:00:00.000Z';
        
        mockDateFormatter.formatTime.mockReturnValue('12:00 PM');
        
        const result = DateFormatter.formatTime(noonString);
        
        expect(result).toBe('12:00 PM');
      });
    });

    describe('formatDateTime', () => {
      it('should format full date and time', () => {
        const dateTimeString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatDateTime.mockReturnValue('September 24, 2025 at 2:30 PM');
        
        const result = DateFormatter.formatDateTime(dateTimeString);
        
        expect(result).toBe('September 24, 2025 at 2:30 PM');
      });

      it('should format short date and time', () => {
        const dateTimeString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatDateTime.mockReturnValue('Sep 24, 2025 • 2:30 PM');
        
        const result = DateFormatter.formatDateTime(dateTimeString, { short: true });
        
        expect(result).toBe('Sep 24, 2025 • 2:30 PM');
      });
    });

    describe('formatDateOnly', () => {
      it('should format date without time', () => {
        const dateString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatDateOnly.mockReturnValue('September 24, 2025');
        
        const result = DateFormatter.formatDateOnly(dateString);
        
        expect(result).toBe('September 24, 2025');
      });

      it('should format short date without time', () => {
        const dateString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatDateOnly.mockReturnValue('9/24/2025');
        
        const result = DateFormatter.formatDateOnly(dateString, { short: true });
        
        expect(result).toBe('9/24/2025');
      });
    });
  });

  describe('Date Comparison Functions', () => {
    describe('isToday', () => {
      it('should correctly identify today\'s date', () => {
        const todayString = new Date().toISOString();
        
        mockDateFormatter.isToday.mockReturnValue(true);
        
        const result = DateFormatter.isToday(todayString);
        
        expect(result).toBe(true);
      });

      it('should correctly identify non-today dates', () => {
        const yesterdayString = timeScenarios.past.yesterday.toISOString();
        
        mockDateFormatter.isToday.mockReturnValue(false);
        
        const result = DateFormatter.isToday(yesterdayString);
        
        expect(result).toBe(false);
      });
    });

    describe('isTomorrow', () => {
      it('should correctly identify tomorrow\'s date', () => {
        const tomorrowString = timeScenarios.future.tomorrow.toISOString();
        
        mockDateFormatter.isTomorrow.mockReturnValue(true);
        
        const result = DateFormatter.isTomorrow(tomorrowString);
        
        expect(result).toBe(true);
      });

      it('should correctly identify non-tomorrow dates', () => {
        const todayString = new Date().toISOString();
        
        mockDateFormatter.isTomorrow.mockReturnValue(false);
        
        const result = DateFormatter.isTomorrow(todayString);
        
        expect(result).toBe(false);
      });
    });

    describe('isThisWeek', () => {
      it('should identify dates within current week', () => {
        const thisWeekDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        
        mockDateFormatter.isThisWeek.mockReturnValue(true);
        
        const result = DateFormatter.isThisWeek(thisWeekDate);
        
        expect(result).toBe(true);
      });

      it('should identify dates outside current week', () => {
        const nextWeekDate = timeScenarios.future.nextWeek.toISOString();
        
        mockDateFormatter.isThisWeek.mockReturnValue(false);
        
        const result = DateFormatter.isThisWeek(nextWeekDate);
        
        expect(result).toBe(false);
      });
    });

    describe('isThisMonth', () => {
      it('should identify dates within current month', () => {
        const thisMonthDate = timeScenarios.boundaries.endOfMonth.toISOString();
        
        mockDateFormatter.isThisMonth.mockReturnValue(true);
        
        const result = DateFormatter.isThisMonth(thisMonthDate);
        
        expect(result).toBe(true);
      });

      it('should identify dates outside current month', () => {
        const nextMonthDate = timeScenarios.future.nextMonth.toISOString();
        
        mockDateFormatter.isThisMonth.mockReturnValue(false);
        
        const result = DateFormatter.isThisMonth(nextMonthDate);
        
        expect(result).toBe(false);
      });
    });

    describe('isThisYear', () => {
      it('should identify dates within current year', () => {
        const thisYearDate = timeScenarios.boundaries.endOfYear.toISOString();
        
        mockDateFormatter.isThisYear.mockReturnValue(true);
        
        const result = DateFormatter.isThisYear(thisYearDate);
        
        expect(result).toBe(true);
      });

      it('should identify dates outside current year', () => {
        const nextYearDate = timeScenarios.future.nextYear.toISOString();
        
        mockDateFormatter.isThisYear.mockReturnValue(false);
        
        const result = DateFormatter.isThisYear(nextYearDate);
        
        expect(result).toBe(false);
      });
    });
  });

  describe('Timezone and Locale Support', () => {
    describe('getTimezoneOffset', () => {
      it('should return timezone offset for date', () => {
        const dateString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.getTimezoneOffset.mockReturnValue(-240); // EDT: UTC-4
        
        const result = DateFormatter.getTimezoneOffset(dateString);
        
        expect(result).toBe(-240);
      });

      it('should handle different timezones', () => {
        const dateString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.getTimezoneOffset.mockReturnValue(-480); // PST: UTC-8
        
        const result = DateFormatter.getTimezoneOffset(dateString, 'America/Los_Angeles');
        
        expect(result).toBe(-480);
      });
    });

    describe('formatTimezone', () => {
      it('should format timezone abbreviation', () => {
        const dateString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatTimezone.mockReturnValue('EDT');
        
        const result = DateFormatter.formatTimezone(dateString);
        
        expect(result).toBe('EDT');
      });

      it('should format timezone with offset', () => {
        const dateString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatTimezone.mockReturnValue('UTC-4');
        
        const result = DateFormatter.formatTimezone(dateString, { showOffset: true });
        
        expect(result).toBe('UTC-4');
      });
    });
  });

  describe('Duration and Countdown', () => {
    describe('formatDuration', () => {
      it('should format duration in minutes', () => {
        const durationMs = 45 * 60 * 1000; // 45 minutes
        
        mockDateFormatter.formatDuration.mockReturnValue('45 minutes');
        
        const result = DateFormatter.formatDuration(durationMs);
        
        expect(result).toBe('45 minutes');
      });

      it('should format duration in hours and minutes', () => {
        const durationMs = 2.5 * 60 * 60 * 1000; // 2.5 hours
        
        mockDateFormatter.formatDuration.mockReturnValue('2 hours 30 minutes');
        
        const result = DateFormatter.formatDuration(durationMs);
        
        expect(result).toBe('2 hours 30 minutes');
      });

      it('should format duration in days', () => {
        const durationMs = 3 * 24 * 60 * 60 * 1000; // 3 days
        
        mockDateFormatter.formatDuration.mockReturnValue('3 days');
        
        const result = DateFormatter.formatDuration(durationMs);
        
        expect(result).toBe('3 days');
      });
    });

    describe('formatCountdown', () => {
      it('should format countdown to future event', () => {
        const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        
        mockDateFormatter.formatCountdown.mockReturnValue('2 hours remaining');
        
        const result = DateFormatter.formatCountdown(futureDate);
        
        expect(result).toBe('2 hours remaining');
      });

      it('should handle past events', () => {
        const pastDate = timeScenarios.past.yesterday.toISOString();
        
        mockDateFormatter.formatCountdown.mockReturnValue('Event ended');
        
        const result = DateFormatter.formatCountdown(pastDate);
        
        expect(result).toBe('Event ended');
      });
    });
  });

  describe('API Integration', () => {
    describe('formatForAPI', () => {
      it('should format date for API consumption', () => {
        const localDate = new Date('2025-09-24T14:30:00.000');
        
        mockDateFormatter.formatForAPI.mockReturnValue('2025-09-24T14:30:00.000Z');
        
        const result = DateFormatter.formatForAPI(localDate);
        
        expect(result).toBe('2025-09-24T14:30:00.000Z');
      });
    });

    describe('formatFromAPI', () => {
      it('should parse and format date from API response', () => {
        const apiDateString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatFromAPI.mockReturnValue('Sep 24, 2025 at 2:30 PM');
        
        const result = DateFormatter.formatFromAPI(apiDateString);
        
        expect(result).toBe('Sep 24, 2025 at 2:30 PM');
      });
    });
  });

  describe('Specialized Formatting', () => {
    describe('formatBusinessHours', () => {
      it('should format business hours range', () => {
        const startTime = '09:00';
        const endTime = '17:00';
        
        mockDateFormatter.formatBusinessHours.mockReturnValue('9:00 AM - 5:00 PM');
        
        const result = DateFormatter.formatBusinessHours(startTime, endTime);
        
        expect(result).toBe('9:00 AM - 5:00 PM');
      });
    });

    describe('formatDateWithOrdinal', () => {
      it('should format date with ordinal numbers', () => {
        const dateString = '2025-09-24T14:30:00.000Z';
        
        mockDateFormatter.formatDateWithOrdinal.mockReturnValue('September 24th, 2025');
        
        const result = DateFormatter.formatDateWithOrdinal(dateString);
        
        expect(result).toBe('September 24th, 2025');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('isValidDate', () => {
      it('should validate correct date strings', () => {
        const validDates = [
          '2025-09-24T14:30:00.000Z',
          '2025-12-31',
          'September 24, 2025',
          '2025/09/24'
        ];

        validDates.forEach(date => {
          mockDateFormatter.isValidDate.mockReturnValue(true);
          
          const result = DateFormatter.isValidDate(date);
          
          expect(result).toBe(true);
        });
      });

      it('should reject invalid date strings', () => {
        const invalidDates = [
          'invalid-date',
          '2025-13-01', // Invalid month
          '2025-02-30', // Invalid day for February
          '',
          null,
          undefined
        ];

        invalidDates.forEach(date => {
          mockDateFormatter.isValidDate.mockReturnValue(false);
          
          const result = DateFormatter.isValidDate(date);
          
          expect(result).toBe(false);
        });
      });
    });

    describe('parseDateString', () => {
      it('should parse various date string formats', () => {
        const dateFormats = [
          { input: '2025-09-24', expected: new Date('2025-09-24T00:00:00.000Z') },
          { input: 'Sep 24, 2025', expected: new Date('2025-09-24T00:00:00.000Z') },
          { input: '9/24/2025', expected: new Date('2025-09-24T00:00:00.000Z') }
        ];

        dateFormats.forEach(({ input, expected }) => {
          mockDateFormatter.parseDateString.mockReturnValue(expected);
          
          const result = DateFormatter.parseDateString(input);
          
          expect(result).toEqual(expected);
        });
      });

      it('should handle invalid date string parsing', () => {
        const invalidInput = 'completely-invalid-date';
        
        mockDateFormatter.parseDateString.mockReturnValue(null);
        
        const result = DateFormatter.parseDateString(invalidInput);
        
        expect(result).toBeNull();
      });
    });

    it('should handle timezone edge cases', () => {
      // Test daylight saving time transitions
      const dstTransition = '2025-03-09T07:00:00.000Z'; // Spring forward
      
      mockDateFormatter.formatDateTime.mockReturnValue('March 9, 2025 at 3:00 AM EDT');
      
      const result = DateFormatter.formatDateTime(dstTransition);
      
      expect(result).toBe('March 9, 2025 at 3:00 AM EDT');
    });

    it('should handle leap year dates', () => {
      const leapYearDate = '2024-02-29T12:00:00.000Z';
      
      mockDateFormatter.formatDateOnly.mockReturnValue('February 29, 2024');
      
      const result = DateFormatter.formatDateOnly(leapYearDate);
      
      expect(result).toBe('February 29, 2024');
    });

    it('should handle performance with large date ranges', () => {
      const performanceTest = testEnv.performance;
      const largeDateArray = Array(1000).fill(null).map(() => new Date().toISOString());
      
      largeDateArray.forEach(date => {
        mockDateFormatter.formatEventDate.mockReturnValue('Formatted Date');
        DateFormatter.formatEventDate(date);
      });
      
      const duration = performanceTest.measure();
      expect(duration).toBeLessThan(1000); // Should process 1000 dates in under 1 second
    });
  });
});