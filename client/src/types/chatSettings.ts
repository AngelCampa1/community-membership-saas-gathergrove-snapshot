/**
 * Types for club chat settings management
 */

/**
 * Response for chat settings
 */
export interface ChatSettingsResponse {
  /** Whether the club chat feature is enabled */
  isChatEnabled: boolean;
}

/**
 * Request for updating chat settings
 */
export interface UpdateChatSettingsRequest {
  /** Whether the club chat feature should be enabled */
  isChatEnabled: boolean;
} 