/**
 * Utility functions for formatting timestamps and dates
 */

/**
 * Formats a timestamp string for display in chat messages
 * Ensures proper local time conversion from UTC
 * @param timestamp - ISO string timestamp (usually in UTC)
 * @returns Formatted timestamp string (time for recent messages, date for older ones)
 */
export const formatChatTimestamp = (timestamp: string): string => {
  // Parse the timestamp and explicitly convert to local time
  const date = new Date(timestamp);
  const now = new Date();
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Calculate time difference
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  // For messages within 24 hours, show time in local timezone
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true // Explicitly use 12-hour format for better readability
    });
  } else {
    // For older messages, show date
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: diffInHours > 8760 ? 'numeric' : undefined // Show year if older than 365 days
    });
  }
};

/**
 * Formats a timestamp for detailed display (e.g., in message details)
 * @param timestamp - ISO string timestamp
 * @returns Full date and time string in local timezone
 */
export const formatDetailedTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Gets relative time description (e.g., "2 hours ago", "Yesterday")
 * @param timestamp - ISO string timestamp
 * @returns Relative time string
 */
export const getRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const diffInMs = now.getTime() - date.getTime();

  // DATE-01 fix: Handle future timestamps
  if (diffInMs < 0) {
    // Future timestamp
    const futureDiffInMs = Math.abs(diffInMs);
    const futureDiffInMinutes = Math.floor(futureDiffInMs / (1000 * 60));
    const futureDiffInHours = Math.floor((futureDiffInMs + 1000) / (1000 * 60 * 60));
    const futureDiffInDays = Math.max(1, Math.floor((futureDiffInMs + 1000) / (1000 * 60 * 60 * 24)));

    if (futureDiffInMinutes < 1) {
      return 'In a moment';
    } else if (futureDiffInMinutes < 60) {
      return `In ${futureDiffInMinutes} minute${futureDiffInMinutes === 1 ? '' : 's'}`;
    } else if (futureDiffInMs < 1000 * 60 * 60 * 24) {
      return `In ${futureDiffInHours} hour${futureDiffInHours === 1 ? '' : 's'}`;
    } else if (futureDiffInDays === 1) {
      return 'Tomorrow';
    } else if (futureDiffInDays < 7) {
      return `In ${futureDiffInDays} days`;
    } else {
      return formatChatTimestamp(timestamp);
    }
  }

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return formatChatTimestamp(timestamp);
  }
};
