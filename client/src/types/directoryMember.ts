/**
 * Types for member directory (Story 30)
 */

/**
 * Member entry in the directory
 * Only includes fields that the member has chosen to share and admin allows
 */
export interface DirectoryMember {
  /** Member ID */
  id: number;
  /** Full name of the member (always visible) */
  fullName: string;
  /** Email address (only visible if member chose to share and admin allows) */
  email?: string;
  /** Phone number (only visible if member chose to share and admin allows) */
  phoneNumber?: string;
  /** Address (only visible if member chose to share and admin allows) */
  address?: string;
  /** Membership type name (only visible if member chose to share and admin allows) */
  membershipTypeName?: string;
  /** Join date (only visible if member chose to share and admin allows) */
  joinDate?: string;
}

/**
 * Response for paginated member directory
 */
export interface PaginatedDirectoryMembersResponse {
  /** List of directory members for the current page */
  members: DirectoryMember[];
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of members in the directory */
  totalMembers: number;
  /** Number of members per page */
  pageSize: number;
  /** Whether there are more pages after the current one */
  hasNextPage: boolean;
  /** Whether there are pages before the current one */
  hasPreviousPage: boolean;
} 