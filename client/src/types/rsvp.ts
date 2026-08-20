/**
 * Response type for RSVP via email link submission
 */
export interface RsvpViaLinkResponse {
  /** Whether the RSVP was processed successfully */
  success: boolean;
  /** Success or error message to display to the user */
  message: string;
  /** The member's name who made the RSVP */
  memberName: string;
  /** The event name the RSVP was for */
  eventName: string;
  /** The RSVP status that was recorded (e.g., "Attending", "NotAttending") */
  rsvpStatus: string;
} 