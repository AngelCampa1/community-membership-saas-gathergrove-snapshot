export interface ChatMessageResponse {
  chatMessageId: number;
  clubId: number;
  senderUserId: number;
  senderName: string;
  messageContent: string;
  sentAt: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessageResponse[];
  hasMore: boolean;
  totalCount: number;
  oldestMessageTimestamp?: string;
}

export interface SendMessageRequest {
  messageContent: string;
}

export interface ChatAccessResponse {
  hasAccess: boolean;
  isChatEnabled: boolean;
} 