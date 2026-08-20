import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050';

export interface EmailTemplateResponse {
  id: number;
  clubId: number;
  templateName: string;
  description?: string;
  templateHtml: string;
  templateJson?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateEmailTemplateRequest {
  templateName: string;
  description?: string;
  templateHtml: string;
  templateJson?: string;
}

export interface UpdateEmailTemplateRequest {
  templateName?: string;
  description?: string;
  templateHtml?: string;
  templateJson?: string;
  isActive?: boolean;
}

export interface PreviewEmailTemplateRequest {
  templateHtml: string;
  memberId?: number;
}

export interface PreviewEmailTemplateResponse {
  previewHtml: string;
}

class EmailTemplateService {
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      credentials: 'include' as const,
    };
  }

  async getTemplates(clubId: number): Promise<EmailTemplateResponse[]> {
    const response = await axios.get<EmailTemplateResponse[]>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/email-templates`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async getTemplate(clubId: number, templateId: number): Promise<EmailTemplateResponse> {
    const response = await axios.get<EmailTemplateResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/email-templates/${templateId}`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async createTemplate(clubId: number, request: CreateEmailTemplateRequest): Promise<EmailTemplateResponse> {
    const response = await axios.post<EmailTemplateResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/email-templates`,
      request,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async updateTemplate(
    clubId: number,
    templateId: number,
    request: UpdateEmailTemplateRequest
  ): Promise<EmailTemplateResponse> {
    const response = await axios.put<EmailTemplateResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/email-templates/${templateId}`,
      request,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async deleteTemplate(clubId: number, templateId: number): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/email-templates/${templateId}`,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
  }

  async duplicateTemplate(clubId: number, templateId: number): Promise<EmailTemplateResponse> {
    const response = await axios.post<EmailTemplateResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/email-templates/${templateId}/duplicate`,
      {},
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }

  async previewTemplate(
    clubId: number,
    templateId: number,
    request: PreviewEmailTemplateRequest
  ): Promise<PreviewEmailTemplateResponse> {
    const response = await axios.post<PreviewEmailTemplateResponse>(
      `${API_BASE_URL}/api/v1/clubs/${clubId}/email-templates/${templateId}/preview`,
      request,
      { ...this.getAuthHeaders(), withCredentials: true }
    );
    return response.data;
  }
}

export const emailTemplateService = new EmailTemplateService();
