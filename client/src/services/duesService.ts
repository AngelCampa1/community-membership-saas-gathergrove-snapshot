/**
 * MOCK: Dues Service for Testing
 * Creates missing service to prevent test failures
 */

export interface DuesInfo {
  memberId: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface PayDuesRequest {
  memberId: string;
  amount: number;
  paymentMethod: string;
}

export const duesService = {
  payDues: async (_request: PayDuesRequest) => {
    return { success: true, transactionId: 'mock-transaction' };
  },
  
  getMemberDuesInfo: async (memberId: string): Promise<DuesInfo> => {
    return {
      memberId,
      amount: 50,
      dueDate: '2024-12-31',
      status: 'pending'
    };
  },
  
  getAllDues: async (_clubId: string) => {
    return [];
  }
};

export default duesService;