/**
 * Types for member directory settings management (Story 29)
 */

/**
 * Response for member directory settings
 */
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

/**
 * Request for updating member directory settings
 */
export interface UpdateMemberDirectorySettingsRequest {
  /** Whether this member should be listed in the directory */
  isListed: boolean;
  /** Array of profile fields this member wants to make visible in the directory */
  visibleFields: string[];
}

/**
 * Available member profile fields that can be shared in directory
 */
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