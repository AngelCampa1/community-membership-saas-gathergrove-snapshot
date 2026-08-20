import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1';

export enum MemberTransferStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Cancelled = 3,
  Completed = 4,
}

export interface CreateMemberTransferRequest {
  toLocationId: number;
  transferReason: string;
}

export interface ApproveTransferRequest {
  approvalNotes?: string;
}

export interface DenyTransferRequest {
  denialReason: string;
}

export interface MemberTransferResponse {
  id: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  fromLocationId: number;
  fromLocationName: string;
  toLocationId: number;
  toLocationName: string;
  transferReason: string;
  status: MemberTransferStatus;
  statusName: string;
  requestedAt: string;
  requestedBy: number;
  requestedByName: string;
  approvedAt?: string;
  approvedBy?: number;
  approvedByName?: string;
  approvalNotes?: string;
}

class MemberTransferService {
  /**
   * Creates a transfer request for a member
   */
  async requestTransfer(
    memberId: number,
    data: CreateMemberTransferRequest
  ): Promise<MemberTransferResponse> {
    const response = await axios.post<MemberTransferResponse>(
      `${API_BASE_URL}/members/${memberId}/transfers`,
      data,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  /**
   * Gets all pending transfers for a location
   */
  async getPendingTransfers(locationId: number): Promise<MemberTransferResponse[]> {
    const response = await axios.get<MemberTransferResponse[]>(
      `${API_BASE_URL}/locations/${locationId}/transfers/pending`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  /**
   * Approves a transfer request
   */
  async approveTransfer(
    transferId: number,
    data: ApproveTransferRequest
  ): Promise<MemberTransferResponse> {
    const response = await axios.post<MemberTransferResponse>(
      `${API_BASE_URL}/transfers/${transferId}/approve`,
      data,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  /**
   * Denies a transfer request
   */
  async denyTransfer(
    transferId: number,
    data: DenyTransferRequest
  ): Promise<MemberTransferResponse> {
    const response = await axios.post<MemberTransferResponse>(
      `${API_BASE_URL}/transfers/${transferId}/deny`,
      data,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  /**
   * Gets transfer history for a member
   */
  async getTransferHistory(memberId: number): Promise<MemberTransferResponse[]> {
    const response = await axios.get<MemberTransferResponse[]>(
      `${API_BASE_URL}/members/${memberId}/transfer-history`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
}

export const memberTransferService = new MemberTransferService();

