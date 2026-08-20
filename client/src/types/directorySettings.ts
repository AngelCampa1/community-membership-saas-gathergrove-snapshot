/**
 * Types for club directory settings management
 */

/**
 * Response for directory settings
 */
export interface DirectorySettingsResponse {
  /** Whether the member directory is enabled for this club */
  isEnabled: boolean;
  /** Array of member profile fields that can be optionally shared in the directory */
  allowedSharableFields: string[];
}

/**
 * Request for updating directory settings
 */
export interface UpdateDirectorySettingsRequest {
  /** Whether the member directory should be enabled for this club */
  isEnabled: boolean;
  /** Array of member profile fields that can be optionally shared in the directory */
  allowedSharableFields: string[];
}

/**
 * Available member profile fields that can be shared in directory
 */
export const AVAILABLE_DIRECTORY_FIELDS = {
  email: {
    key: 'email',
    label: 'Email Address',
    description: 'Members can share their email address'
  },
  phoneNumber: {
    key: 'phoneNumber', 
    label: 'Phone Number',
    description: 'Members can share their phone number'
  }
} as const;

export type DirectoryFieldKey = keyof typeof AVAILABLE_DIRECTORY_FIELDS; 