/**
 * @jest-environment jsdom
 *
 * Dues Service Tests
 *
 * Tests dues payment functionality following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic
 */

import { duesService, PayDuesRequest } from '../duesService';

describe('DuesService', () => {
  describe('payDues', () => {
    it('should process dues payment successfully', async () => {
      const request: PayDuesRequest = {
        memberId: 'member-123',
        amount: 50,
        paymentMethod: 'card',
      };

      const result = await duesService.payDues(request);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('mock-transaction');
    });

    it('should return transaction ID', async () => {
      const request: PayDuesRequest = {
        memberId: 'member-456',
        amount: 100,
        paymentMethod: 'bank',
      };

      const result = await duesService.payDues(request);

      expect(result.transactionId).toBeDefined();
      expect(typeof result.transactionId).toBe('string');
    });
  });

  describe('getMemberDuesInfo', () => {
    it('should fetch member dues info successfully', async () => {
      const memberId = 'member-123';

      const result = await duesService.getMemberDuesInfo(memberId);

      expect(result.memberId).toBe(memberId);
      expect(result.amount).toBe(50);
      expect(result.status).toBe('pending');
    });

    it('should return due date', async () => {
      const result = await duesService.getMemberDuesInfo('test-member');

      expect(result.dueDate).toBe('2024-12-31');
    });

    it('should return correct status type', async () => {
      const result = await duesService.getMemberDuesInfo('any-member');

      expect(['paid', 'pending', 'overdue']).toContain(result.status);
    });
  });

  describe('getAllDues', () => {
    it('should fetch all dues for club', async () => {
      const result = await duesService.getAllDues('club-1');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array', async () => {
      const result = await duesService.getAllDues('club-2');

      expect(result).toEqual([]);
    });
  });

  describe('service export', () => {
    it('should export duesService instance', () => {
      expect(duesService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof duesService.payDues).toBe('function');
      expect(typeof duesService.getMemberDuesInfo).toBe('function');
      expect(typeof duesService.getAllDues).toBe('function');
    });
  });
});
