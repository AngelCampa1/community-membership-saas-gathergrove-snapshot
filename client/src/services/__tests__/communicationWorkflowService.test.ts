import { communicationWorkflowService } from '../communicationWorkflowService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('communicationWorkflowService', () => {
  const clubId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkflows', () => {
    it('should fetch workflows for a club', async () => {
      const mockWorkflows = [
        { id: 1, workflowName: 'Workflow 1', isActive: true },
        { id: 2, workflowName: 'Workflow 2', isActive: false },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: mockWorkflows,
      });

      const result = await communicationWorkflowService.getWorkflows(clubId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-workflows`),
        expect.objectContaining({
          withCredentials: true,
          params: { includeInactive: false },
        })
      );
      expect(result).toEqual(mockWorkflows);
    });

    it('should handle fetch errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(communicationWorkflowService.getWorkflows(clubId)).rejects.toThrow('Network error');
    });

    it('should fetch workflows with includeInactive true', async () => {
      const mockWorkflows = [
        { id: 1, workflowName: 'Active Workflow', isActive: true },
        { id: 2, workflowName: 'Inactive Workflow', isActive: false },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: mockWorkflows,
      });

      const result = await communicationWorkflowService.getWorkflows(clubId, true);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-workflows`),
        expect.objectContaining({
          withCredentials: true,
          params: { includeInactive: true },
        })
      );
      expect(result).toEqual(mockWorkflows);
      expect(result).toHaveLength(2);
    });
  });

  describe('getWorkflow', () => {
    it('should fetch a single workflow', async () => {
      const mockWorkflow = { id: 1, workflowName: 'Workflow 1', isActive: true };
      const workflowId = 1;

      mockedAxios.get.mockResolvedValueOnce({
        data: mockWorkflow,
      });

      const result = await communicationWorkflowService.getWorkflow(clubId, workflowId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-workflows/${workflowId}`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockWorkflow);
    });

    it('should handle get workflow errors', async () => {
      const workflowId = 1;

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(communicationWorkflowService.getWorkflow(clubId, workflowId)).rejects.toThrow('Network error');
    });
  });

  describe('createWorkflow', () => {
    it('should create a new workflow', async () => {
      const mockWorkflow = { id: 1, workflowName: 'New Workflow', isActive: false };
      const workflowData = {
        workflowName: 'New Workflow',
        description: 'Test workflow',
        triggerType: 'MemberJoined',
        workflowSteps: '[]',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: mockWorkflow,
      });

      const result = await communicationWorkflowService.createWorkflow(clubId, workflowData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-workflows`),
        workflowData,
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockWorkflow);
    });

    it('should handle create workflow errors', async () => {
      const workflowData = {
        workflowName: 'New Workflow',
        description: 'Test workflow',
        triggerType: 'MemberJoined',
        workflowSteps: '[]',
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(communicationWorkflowService.createWorkflow(clubId, workflowData)).rejects.toThrow('Network error');
    });
  });

  describe('updateWorkflow', () => {
    it('should update an existing workflow', async () => {
      const mockWorkflow = { id: 1, workflowName: 'Updated Workflow', isActive: false };
      const workflowId = 1;
      const workflowData = {
        workflowName: 'Updated Workflow',
        description: 'Updated description',
      };

      mockedAxios.put.mockResolvedValueOnce({
        data: mockWorkflow,
      });

      const result = await communicationWorkflowService.updateWorkflow(
        clubId,
        workflowId,
        workflowData
      );

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-workflows/${workflowId}`),
        workflowData,
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockWorkflow);
    });

    it('should handle update workflow errors', async () => {
      const workflowId = 1;
      const workflowData = {
        workflowName: 'Updated Workflow',
        description: 'Updated description',
      };

      mockedAxios.put.mockRejectedValueOnce(new Error('Network error'));

      await expect(communicationWorkflowService.updateWorkflow(clubId, workflowId, workflowData)).rejects.toThrow('Network error');
    });
  });

  describe('toggleWorkflow', () => {
    it('should toggle a workflow active state', async () => {
      const mockWorkflow = { id: 1, workflowName: 'Workflow', isActive: true };
      const workflowId = 1;

      mockedAxios.post.mockResolvedValueOnce({
        data: mockWorkflow,
      });

      const result = await communicationWorkflowService.toggleWorkflow(clubId, workflowId, true);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-workflows/${workflowId}/toggle`),
        true,
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockWorkflow);
    });

    it('should handle toggle workflow errors', async () => {
      const workflowId = 1;

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(communicationWorkflowService.toggleWorkflow(clubId, workflowId, true)).rejects.toThrow('Network error');
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete a workflow', async () => {
      const workflowId = 1;

      mockedAxios.delete.mockResolvedValueOnce({});

      await communicationWorkflowService.deleteWorkflow(clubId, workflowId);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-workflows/${workflowId}`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
    });

    it('should handle delete workflow errors', async () => {
      const workflowId = 1;

      mockedAxios.delete.mockRejectedValueOnce(new Error('Network error'));

      await expect(communicationWorkflowService.deleteWorkflow(clubId, workflowId)).rejects.toThrow('Network error');
    });
  });

  describe('getWorkflowStats', () => {
    it('should fetch workflow statistics', async () => {
      const mockStats = {
        workflowId: 1,
        totalExecutions: 10,
        successfulExecutions: 8,
        failedExecutions: 2,
        lastExecutedAt: '2025-01-15T10:00:00Z',
        averageExecutionTime: 1500,
      };
      const workflowId = 1;

      mockedAxios.get.mockResolvedValueOnce({
        data: mockStats,
      });

      const result = await communicationWorkflowService.getWorkflowStats(clubId, workflowId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-workflows/${workflowId}/stats`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockStats);
    });

    it('should handle get workflow stats errors', async () => {
      const workflowId = 1;

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(communicationWorkflowService.getWorkflowStats(clubId, workflowId)).rejects.toThrow('Network error');
    });
  });

  describe('executeWorkflow', () => {
    it('should execute a workflow', async () => {
      const workflowId = 1;
      const executionData = {
        memberId: 123,
        segmentId: 456,
      };

      mockedAxios.post.mockResolvedValueOnce({});

      await communicationWorkflowService.executeWorkflow(clubId, workflowId, executionData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/communication-workflows/${workflowId}/execute`),
        executionData,
        expect.objectContaining({
          withCredentials: true,
        })
      );
    });

    it('should handle execute workflow errors', async () => {
      const workflowId = 1;
      const executionData = {
        memberId: 123,
        segmentId: 456,
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(communicationWorkflowService.executeWorkflow(clubId, workflowId, executionData)).rejects.toThrow('Network error');
    });
  });
});

