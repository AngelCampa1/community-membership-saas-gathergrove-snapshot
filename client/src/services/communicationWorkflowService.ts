import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';

export interface WorkflowResponse {
  id: number;
  clubId: number;
  workflowName: string;
  description?: string;
  triggerType: string;
  workflowSteps: string;
  isActive: boolean;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowRequest {
  workflowName: string;
  description?: string;
  triggerType: string;
  workflowSteps: string;
}

export interface UpdateWorkflowRequest {
  workflowName?: string;
  description?: string;
  triggerType?: string;
  workflowSteps?: string;
  isActive?: boolean;
}

export interface WorkflowStatsResponse {
  workflowId: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutedAt?: string;
  averageExecutionTime: number;
}

export interface ExecuteWorkflowRequest {
  memberId?: number;
  segmentId?: number;
}

class CommunicationWorkflowService {
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      credentials: 'include' as const,
    };
  }

  async getWorkflows(clubId: number, includeInactive = false): Promise<WorkflowResponse[]> {
    const response = await axios.get<WorkflowResponse[]>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-workflows`,
      {
        ...this.getAuthHeaders(),
        withCredentials: true,
        params: { includeInactive },
      }
    );
    return response.data;
  }

  async getWorkflow(clubId: number, workflowId: number): Promise<WorkflowResponse> {
    const response = await axios.get<WorkflowResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-workflows/${workflowId}`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async createWorkflow(clubId: number, request: CreateWorkflowRequest): Promise<WorkflowResponse> {
    const response = await axios.post<WorkflowResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-workflows`,
      request,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async updateWorkflow(
    clubId: number,
    workflowId: number,
    request: UpdateWorkflowRequest
  ): Promise<WorkflowResponse> {
    const response = await axios.put<WorkflowResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-workflows/${workflowId}`,
      request,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async deleteWorkflow(clubId: number, workflowId: number): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-workflows/${workflowId}`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
  }

  async toggleWorkflow(clubId: number, workflowId: number, isActive: boolean): Promise<WorkflowResponse> {
    const response = await axios.post<WorkflowResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-workflows/${workflowId}/toggle`,
      isActive,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async getWorkflowStats(clubId: number, workflowId: number): Promise<WorkflowStatsResponse> {
    const response = await axios.get<WorkflowStatsResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-workflows/${workflowId}/stats`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async executeWorkflow(
    clubId: number,
    workflowId: number,
    request: ExecuteWorkflowRequest
  ): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/communication-workflows/${workflowId}/execute`,
      request,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
  }
}

export const communicationWorkflowService = new CommunicationWorkflowService();

