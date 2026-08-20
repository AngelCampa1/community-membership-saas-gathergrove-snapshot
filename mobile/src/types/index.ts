// Authentication types matching backend DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  fullName: string;
  email: string;
  clubId: number;
  role: string;
  clubTier: string;
  isOnboardingCompleted: boolean;
  message: string;
  token?: string; // Optional for mobile clients
}

export interface ApiErrorResponse {
  errorCode?: string;
  message: string;
  title?: string;
  status: number;
}

// Forgot Password types
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// User session state
export interface UserSession {
  token: string;
  user: {
    userId: number;
    fullName: string;
    email: string;
    role: string;
    clubId: number;
    clubTier: string;
    clubName?: string;
  };
  isAuthenticated: boolean;
}

// Member profile types for M-02 story
export interface MemberProfileResponse {
  id: number;
  clubId: number;
  membershipTypeId: number;
  membershipTypeName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  status: string;
  joinDate: string;
  duesPaidUntil?: string;
  hasSmsConsent: boolean;
  createdAt: string;
  updatedAt: string;
  customFields?: Array<{
    id: number;
    label: string;
    value: string;
  }>;
  // Dues-related properties from backend MemberResponse
  totalPaidCurrentPeriod: number;
  expectedDuesAmount: number;
  outstandingBalance?: number;
  hasPartialPayments: boolean;
  duesFrequency: string;
}

// Member profile update types for M-03 story
export interface UpdateMemberRequest {
  membershipTypeId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  hasSmsConsent: boolean;
  customFieldValues: MemberCustomFieldValueRequest[];
}

export interface MemberCustomFieldValueRequest {
  customFieldId: number;
  fieldValue: string;
}

// Event types for M-04 story
export interface EventResponse {
  id: number;
  clubId: number;
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  attendeeCount?: number;
  totalRsvpCount?: number;
}

// RSVP types for M-09 story
export interface EventRsvpResponse {
  id: number;
  eventId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  rsvpStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRsvpRequest {
  rsvpStatus: string;
}

// Directory settings types for M-10 story
export interface MemberDirectorySettingsResponse {
  /** Whether the club directory is enabled by the admin */
  clubDirectoryEnabled: boolean;
  /** Array of profile fields that the admin allows to be shared in the directory */
  adminAllowedSharableFields: string[];
  /** Whether this member is listed in the directory */
  isListed: boolean;
  /** Array of fields this member has chosen to make visible in the directory */
  visibleFields: string[];
}

export interface UpdateMemberDirectorySettingsRequest {
  /** Whether this member should be listed in the directory */
  isListed: boolean;
  /** Array of profile fields this member wants to make visible in the directory */
  visibleFields: string[];
}

// Available member profile fields that can be shared in directory
export const AVAILABLE_MEMBER_DIRECTORY_FIELDS = {
  email: {
    key: 'email',
    label: 'Email Address',
    description: 'Share your email address with other members'
  },
  phoneNumber: {
    key: 'phoneNumber',
    label: 'Phone Number', 
    description: 'Share your phone number with other members'
  }
} as const;

export type MemberDirectoryFieldKey = keyof typeof AVAILABLE_MEMBER_DIRECTORY_FIELDS;

// Chat types for M-12 story (based on Stories 32 & 33 APIs)
export interface ChatMessage {
  chatMessageId: number;
  clubId: number;
  senderUserId: number;
  senderName: string;
  messageContent: string;
  sentAt: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  totalCount: number;
}

export interface ChatAccessResponse {
  hasAccess: boolean;
  isChatEnabled: boolean;
}

export interface SendMessageRequest {
  messageContent: string;
}

// Directory viewing types for M-11 story (based on Story 30 API)
export interface DirectoryMember {
  id: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  membershipTypeName?: string;
  joinDate: string;
}

export interface PaginatedDirectoryMembersResponse {
  members: DirectoryMember[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Events: undefined;
  Directory: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  EditProfile: { profile: MemberProfileResponse };
  MembershipCard: undefined;
  PayDues: {
    membershipType: {
      id: number;
      name: string;
      duesAmount: number;
      duesFrequency: string;
    };
    duesPaidUntil?: string;
  };
  EventDetails: { eventId: number };
  DirectorySettings: undefined;
  ThemeSettings: undefined;
  ResetPassword: { token: string };
  EventSeries: { seriesId: string };
  QRCodeScanner: { eventId?: number };
}; 