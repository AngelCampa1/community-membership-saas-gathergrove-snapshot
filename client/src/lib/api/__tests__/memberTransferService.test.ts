/**
 * MemberTransferService Tests - Full Coverage
 */

import { memberTransferService, MemberTransferStatus, CreateMemberTransferRequest, ApproveTransferRequest, DenyTransferRequest, MemberTransferResponse } from '../memberTransferService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MemberTransferService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const memberId = 5;
  const locationId = 10;
  const transferId = 100;

  const mockTransferResponse: MemberTransferResponse = {
    id: 100,
    memberId: 5,
    memberName: 'John Doe',
    memberEmail: 'john@example.com',
    fromLocationId: 1,
    fromLocationName: 'Location A',
    toLocationId: 2,
    toLocationName: 'Location B',
    transferReason: 'Moving to new city',
    status: MemberTransferStatus.Pending,
    statusName: 'Pending',
    requestedAt: '2024-01-01T00:00:00Z',
    requestedBy: 5,
    requestedByName: 'John Doe',
  };

  describe('requestTransfer', () => {
    const createRequest: CreateMemberTransferRequest = {
      toLocationId: 2,
      transferReason: 'Relocating for work',
    };

    it('should create transfer request successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockTransferResponse });

      const result = await memberTransferService.requestTransfer(memberId, createRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/members/${memberId}/transfers`),
        createRequest,
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockTransferResponse);
    });

    it('should create transfer with Pending status', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockTransferResponse });

      const result = await memberTransferService.requestTransfer(memberId, createRequest);

      expect(result.status).toBe(MemberTransferStatus.Pending);
      expect(result.statusName).toBe('Pending');
    });

    it('should create transfer with complete member information', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockTransferResponse });

      const result = await memberTransferService.requestTransfer(memberId, createRequest);

      expect(result.memberId).toBe(5);
      expect(result.memberName).toBe('John Doe');
      expect(result.memberEmail).toBe('john@example.com');
    });

    it('should create transfer with location details', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockTransferResponse });

      const result = await memberTransferService.requestTransfer(memberId, createRequest);

      expect(result.fromLocationId).toBe(1);
      expect(result.fromLocationName).toBe('Location A');
      expect(result.toLocationId).toBe(2);
      expect(result.toLocationName).toBe('Location B');
    });

    it('should handle different member IDs', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockTransferResponse });

      await memberTransferService.requestTransfer(999, createRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/members/999/transfers'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle different transfer reasons', async () => {
      const differentRequest: CreateMemberTransferRequest = {
        toLocationId: 3,
        transferReason: 'Personal preference',
      };

      mockedAxios.post.mockResolvedValue({ data: mockTransferResponse });

      await memberTransferService.requestTransfer(memberId, differentRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        differentRequest,
        expect.any(Object)
      );
    });

    it('should handle validation errors', async () => {
      const error = { response: { status: 400, data: { message: 'Invalid location' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        memberTransferService.requestTransfer(memberId, createRequest)
      ).rejects.toEqual(error);
    });

    it('should handle conflict errors', async () => {
      const error = { response: { status: 409, data: { message: 'Transfer already exists' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        memberTransferService.requestTransfer(memberId, createRequest)
      ).rejects.toEqual(error);
    });

    it('should include credentials in request', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockTransferResponse });

      await memberTransferService.requestTransfer(memberId, createRequest);

      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('withCredentials', true);
    });
  });

  describe('getPendingTransfers', () => {
    const mockPendingTransfers: MemberTransferResponse[] = [
      mockTransferResponse,
      {
        ...mockTransferResponse,
        id: 101,
        memberId: 6,
        memberName: 'Jane Smith',
        memberEmail: 'jane@example.com',
      },
    ];

    it('should get pending transfers successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockPendingTransfers });

      const result = await memberTransferService.getPendingTransfers(locationId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/locations/${locationId}/transfers/pending`),
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockPendingTransfers);
      expect(result).toHaveLength(2);
    });

    it('should return all transfers with Pending status', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockPendingTransfers });

      const result = await memberTransferService.getPendingTransfers(locationId);

      result.forEach(transfer => {
        expect(transfer.status).toBe(MemberTransferStatus.Pending);
      });
    });

    it('should return empty array when no pending transfers exist', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await memberTransferService.getPendingTransfers(locationId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle different location IDs', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockPendingTransfers });

      await memberTransferService.getPendingTransfers(456);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/locations/456/transfers/pending'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Location not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        memberTransferService.getPendingTransfers(999)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network timeout');
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        memberTransferService.getPendingTransfers(locationId)
      ).rejects.toThrow('Network timeout');
    });

    it('should include credentials in request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockPendingTransfers });

      await memberTransferService.getPendingTransfers(locationId);

      const callArgs = mockedAxios.get.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });
  });

  describe('approveTransfer', () => {
    const approveRequest: ApproveTransferRequest = {
      approvalNotes: 'Transfer approved for business needs',
    };

    const approvedResponse: MemberTransferResponse = {
      ...mockTransferResponse,
      status: MemberTransferStatus.Approved,
      statusName: 'Approved',
      approvedAt: '2024-01-05T00:00:00Z',
      approvedBy: 10,
      approvedByName: 'Admin User',
      approvalNotes: 'Transfer approved for business needs',
    };

    it('should approve transfer successfully with notes', async () => {
      mockedAxios.post.mockResolvedValue({ data: approvedResponse });

      const result = await memberTransferService.approveTransfer(transferId, approveRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/transfers/${transferId}/approve`),
        approveRequest,
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(approvedResponse);
    });

    it('should approve transfer without notes', async () => {
      const emptyRequest: ApproveTransferRequest = {};
      const responseWithoutNotes = { ...approvedResponse };
      delete responseWithoutNotes.approvalNotes;

      mockedAxios.post.mockResolvedValue({ data: responseWithoutNotes });

      const result = await memberTransferService.approveTransfer(transferId, emptyRequest);

      expect(result.approvalNotes).toBeUndefined();
    });

    it('should update status to Approved', async () => {
      mockedAxios.post.mockResolvedValue({ data: approvedResponse });

      const result = await memberTransferService.approveTransfer(transferId, approveRequest);

      expect(result.status).toBe(MemberTransferStatus.Approved);
      expect(result.statusName).toBe('Approved');
    });

    it('should include approval metadata', async () => {
      mockedAxios.post.mockResolvedValue({ data: approvedResponse });

      const result = await memberTransferService.approveTransfer(transferId, approveRequest);

      expect(result.approvedAt).toBe('2024-01-05T00:00:00Z');
      expect(result.approvedBy).toBe(10);
      expect(result.approvedByName).toBe('Admin User');
    });

    it('should handle different transfer IDs', async () => {
      mockedAxios.post.mockResolvedValue({ data: approvedResponse });

      await memberTransferService.approveTransfer(789, approveRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/transfers/789/approve'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle validation errors', async () => {
      const error = { response: { status: 400, data: { message: 'Transfer already processed' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        memberTransferService.approveTransfer(transferId, approveRequest)
      ).rejects.toEqual(error);
    });

    it('should handle unauthorized errors', async () => {
      const error = { response: { status: 403, data: { message: 'Forbidden' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        memberTransferService.approveTransfer(transferId, approveRequest)
      ).rejects.toEqual(error);
    });

    it('should include credentials in request', async () => {
      mockedAxios.post.mockResolvedValue({ data: approvedResponse });

      await memberTransferService.approveTransfer(transferId, approveRequest);

      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('withCredentials', true);
    });
  });

  describe('denyTransfer', () => {
    const denyRequest: DenyTransferRequest = {
      denialReason: 'Insufficient documentation',
    };

    const deniedResponse: MemberTransferResponse = {
      ...mockTransferResponse,
      status: MemberTransferStatus.Rejected,
      statusName: 'Rejected',
      approvedAt: '2024-01-05T00:00:00Z',
      approvedBy: 10,
      approvedByName: 'Admin User',
      approvalNotes: 'Insufficient documentation',
    };

    it('should deny transfer successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: deniedResponse });

      const result = await memberTransferService.denyTransfer(transferId, denyRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/transfers/${transferId}/deny`),
        denyRequest,
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(deniedResponse);
    });

    it('should update status to Rejected', async () => {
      mockedAxios.post.mockResolvedValue({ data: deniedResponse });

      const result = await memberTransferService.denyTransfer(transferId, denyRequest);

      expect(result.status).toBe(MemberTransferStatus.Rejected);
      expect(result.statusName).toBe('Rejected');
    });

    it('should include denial reason in notes', async () => {
      mockedAxios.post.mockResolvedValue({ data: deniedResponse });

      const result = await memberTransferService.denyTransfer(transferId, denyRequest);

      expect(result.approvalNotes).toBe('Insufficient documentation');
    });

    it('should handle different denial reasons', async () => {
      const differentReason: DenyTransferRequest = {
        denialReason: 'Member does not meet eligibility criteria',
      };

      mockedAxios.post.mockResolvedValue({ data: deniedResponse });

      await memberTransferService.denyTransfer(transferId, differentReason);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        differentReason,
        expect.any(Object)
      );
    });

    it('should handle different transfer IDs', async () => {
      mockedAxios.post.mockResolvedValue({ data: deniedResponse });

      await memberTransferService.denyTransfer(321, denyRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/transfers/321/deny'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle validation errors', async () => {
      const error = { response: { status: 400, data: { message: 'Transfer already processed' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        memberTransferService.denyTransfer(transferId, denyRequest)
      ).rejects.toEqual(error);
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Transfer not found' } } };
      mockedAxios.post.mockRejectedValue(error);

      await expect(
        memberTransferService.denyTransfer(999, denyRequest)
      ).rejects.toEqual(error);
    });

    it('should include credentials in request', async () => {
      mockedAxios.post.mockResolvedValue({ data: deniedResponse });

      await memberTransferService.denyTransfer(transferId, denyRequest);

      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('withCredentials', true);
    });
  });

  describe('getTransferHistory', () => {
    const mockHistory: MemberTransferResponse[] = [
      {
        ...mockTransferResponse,
        status: MemberTransferStatus.Completed,
        statusName: 'Completed',
        approvedAt: '2024-01-05T00:00:00Z',
        approvedBy: 10,
        approvedByName: 'Admin User',
      },
      {
        ...mockTransferResponse,
        id: 99,
        status: MemberTransferStatus.Rejected,
        statusName: 'Rejected',
        transferReason: 'Different reason',
        requestedAt: '2023-12-01T00:00:00Z',
      },
      {
        ...mockTransferResponse,
        id: 98,
        status: MemberTransferStatus.Cancelled,
        statusName: 'Cancelled',
        requestedAt: '2023-11-01T00:00:00Z',
      },
    ];

    it('should get transfer history successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockHistory });

      const result = await memberTransferService.getTransferHistory(memberId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/members/${memberId}/transfer-history`),
        expect.objectContaining({ withCredentials: true })
      );
      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(3);
    });

    it('should return transfers with different statuses', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockHistory });

      const result = await memberTransferService.getTransferHistory(memberId);

      expect(result[0].status).toBe(MemberTransferStatus.Completed);
      expect(result[1].status).toBe(MemberTransferStatus.Rejected);
      expect(result[2].status).toBe(MemberTransferStatus.Cancelled);
    });

    it('should return empty array when no history exists', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await memberTransferService.getTransferHistory(memberId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return history ordered by date', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockHistory });

      const result = await memberTransferService.getTransferHistory(memberId);

      expect(result[0].requestedAt).toBe('2024-01-01T00:00:00Z');
      expect(result[1].requestedAt).toBe('2023-12-01T00:00:00Z');
      expect(result[2].requestedAt).toBe('2023-11-01T00:00:00Z');
    });

    it('should handle different member IDs', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockHistory });

      await memberTransferService.getTransferHistory(654);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/members/654/transfer-history'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors', async () => {
      const error = { response: { status: 404, data: { message: 'Member not found' } } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        memberTransferService.getTransferHistory(999)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Connection failed');
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        memberTransferService.getTransferHistory(memberId)
      ).rejects.toThrow('Connection failed');
    });

    it('should include credentials in request', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockHistory });

      await memberTransferService.getTransferHistory(memberId);

      const callArgs = mockedAxios.get.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('withCredentials', true);
    });

    it('should handle single transfer in history', async () => {
      const singleTransfer = [mockHistory[0]];
      mockedAxios.get.mockResolvedValue({ data: singleTransfer });

      const result = await memberTransferService.getTransferHistory(memberId);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(MemberTransferStatus.Completed);
    });
  });
});
