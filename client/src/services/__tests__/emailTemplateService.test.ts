import { emailTemplateService } from '../emailTemplateService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('emailTemplateService', () => {
  const clubId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemplates', () => {
    it('should fetch templates for a club', async () => {
      const mockTemplates = [
        { id: 1, templateName: 'Template 1', clubId: 1 },
        { id: 2, templateName: 'Template 2', clubId: 1 },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: mockTemplates,
      });

      const result = await emailTemplateService.getTemplates(clubId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/email-templates`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockTemplates);
    });

    it('should handle fetch errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailTemplateService.getTemplates(clubId)).rejects.toThrow('Network error');
    });
  });

  describe('getTemplate', () => {
    it('should fetch a single template', async () => {
      const mockTemplate = { id: 1, templateName: 'Template 1', clubId: 1 };
      const templateId = 1;

      mockedAxios.get.mockResolvedValueOnce({
        data: mockTemplate,
      });

      const result = await emailTemplateService.getTemplate(clubId, templateId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/email-templates/${templateId}`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockTemplate);
    });

    it('should handle get template errors', async () => {
      const templateId = 1;

      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailTemplateService.getTemplate(clubId, templateId)).rejects.toThrow('Network error');
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const mockTemplate = { id: 1, templateName: 'New Template', clubId: 1 };
      const templateData = {
        templateName: 'New Template',
        templateHtml: '<html></html>',
        templateJson: '{}',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: mockTemplate,
      });

      const result = await emailTemplateService.createTemplate(clubId, templateData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/email-templates`),
        templateData,
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockTemplate);
    });

    it('should handle create template errors', async () => {
      const templateData = {
        templateName: 'New Template',
        templateHtml: '<html></html>',
        templateJson: '{}',
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailTemplateService.createTemplate(clubId, templateData)).rejects.toThrow('Network error');
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      const mockTemplate = { id: 1, templateName: 'Updated Template', clubId: 1 };
      const templateId = 1;
      const templateData = {
        templateName: 'Updated Template',
        templateHtml: '<html></html>',
      };

      mockedAxios.put.mockResolvedValueOnce({
        data: mockTemplate,
      });

      const result = await emailTemplateService.updateTemplate(clubId, templateId, templateData);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/email-templates/${templateId}`),
        templateData,
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockTemplate);
    });

    it('should handle update template errors', async () => {
      const templateId = 1;
      const templateData = {
        templateName: 'Updated Template',
        templateHtml: '<html></html>',
      };

      mockedAxios.put.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailTemplateService.updateTemplate(clubId, templateId, templateData)).rejects.toThrow('Network error');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      const templateId = 1;

      mockedAxios.delete.mockResolvedValueOnce({});

      await emailTemplateService.deleteTemplate(clubId, templateId);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/email-templates/${templateId}`),
        expect.objectContaining({
          withCredentials: true,
        })
      );
    });

    it('should handle delete template errors', async () => {
      const templateId = 1;

      mockedAxios.delete.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailTemplateService.deleteTemplate(clubId, templateId)).rejects.toThrow('Network error');
    });
  });

  describe('duplicateTemplate', () => {
    it('should duplicate a template', async () => {
      const mockTemplate = { id: 2, templateName: 'Copy of Template', clubId: 1 };
      const templateId = 1;

      mockedAxios.post.mockResolvedValueOnce({
        data: mockTemplate,
      });

      const result = await emailTemplateService.duplicateTemplate(clubId, templateId);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/email-templates/${templateId}/duplicate`),
        {},
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockTemplate);
    });

    it('should handle duplicate template errors', async () => {
      const templateId = 1;

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailTemplateService.duplicateTemplate(clubId, templateId)).rejects.toThrow('Network error');
    });
  });

  describe('previewTemplate', () => {
    it('should preview a template successfully', async () => {
      const mockPreviewResponse = { previewHtml: '<html><body>Preview</body></html>' };
      const templateId = 1;
      const previewRequest = {
        templateHtml: '<html><body>Test</body></html>',
        memberId: 123,
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: mockPreviewResponse,
      });

      const result = await emailTemplateService.previewTemplate(clubId, templateId, previewRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/clubs/${clubId}/email-templates/${templateId}/preview`),
        previewRequest,
        expect.objectContaining({
          withCredentials: true,
        })
      );
      expect(result).toEqual(mockPreviewResponse);
    });

    it('should handle preview template errors', async () => {
      const templateId = 1;
      const previewRequest = {
        templateHtml: '<html><body>Test</body></html>',
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(emailTemplateService.previewTemplate(clubId, templateId, previewRequest)).rejects.toThrow('Network error');
    });
  });
});

