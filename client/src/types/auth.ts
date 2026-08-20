// Types for admin invitation functionality

export interface InviteValidationResponse {
  isValid: boolean;
  email: string;
  clubName: string;
  hasExistingAccount: boolean;
  expiresAt: string;
  invitedByName: string;
  errorMessage?: string;
}

export interface AcceptAdminInviteRequest {
  token: string;
  password?: string;
  fullName?: string;
}

export interface AcceptAdminInviteResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    onboardingCompleted: boolean;
  };
  club: {
    id: number;
    name: string;
    tier: string;
  };
  isNewUser: boolean;
  message: string;
} 