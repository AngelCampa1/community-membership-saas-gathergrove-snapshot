"use client";

import React from"react";
import { useState, useEffect, useRef, useCallback } from"react";
import { useAuth } from"@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { ScrollArea } from"@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from"@/components/ui/avatar";
import { Loader2, Send, AlertCircle, MessageSquare, Wifi, WifiOff, RefreshCw } from"lucide-react";
import { toast } from"sonner";
import { ErrorHandler } from"@/lib/errorHandler";
import { logger } from"@/lib/logger";
import { chatService } from"@/services/chatService";
import { signalRService } from"@/services/signalrService";
import { ChatMessageResponse } from"@/types/chat";
import { formatChatTimestamp } from"@/lib/dateFormatter";

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const clubId = user?.clubId;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  };

  // Handle new messages from SignalR
  const handleNewMessage = useCallback((message: ChatMessageResponse) => {
    setMessages(prev => {
      // Check if message already exists to avoid duplicates
      const exists = prev.some(m => m.chatMessageId === message.chatMessageId);
      if (exists) return prev;
      
      // Add new message and sort by timestamp to maintain order
      const newMessages = [...prev, message].sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
      
      return newMessages;
    });
    
    // Scroll to bottom when receiving new messages
    setTimeout(scrollToBottom, 100);
  }, []);

  // Initialize SignalR connection and chat
  const initializeChat = useCallback(async () => {
      if (!clubId) return;

      try {
        setLoading(true);
        setConnectionError(null);
        setIsConnected(false); // Reset connection state

        // Check access first
        const accessResult = await chatService.checkChatAccess(clubId);
        setHasAccess(accessResult.hasAccess);
        setIsChatEnabled(accessResult.isChatEnabled);

        // If user has access and chat is enabled, initialize real-time chat
        if (accessResult.hasAccess && accessResult.isChatEnabled) {
          // Load initial message history
          const chatHistory = await chatService.getChatHistory(clubId);
          setMessages(chatHistory.messages);
          setHasMore(chatHistory.hasMore);

          // Initialize SignalR connection
          try {
            await signalRService.startConnection();
            
            // Check if we're actually connected after starting
            if (signalRService.isConnected()) {
              setIsConnected(true);
              setConnectionError(null); // Clear any previous connection errors

              // Join the club chat room
              await signalRService.joinClubChat(clubId);

              // Set up real-time message handler
              signalRService.onNewMessage(handleNewMessage);

              // Set up connection status handlers
              signalRService.onConnectionStatus(
                undefined, // onConnected - not needed since we start connected
                () => {
                  setIsConnected(false);
                  toast.error("Lost connection to chat. Attempting to reconnect...");
                },
                () => {
                  setIsConnected(false);
                  toast.info("Reconnecting to chat...");
                },
                () => {
                  // Verify we're actually connected before setting state
                  if (signalRService.isConnected()) {
                    setIsConnected(true);
                    setConnectionError(null); // Clear connection errors on successful reconnection
                    toast.success("Reconnected to chat!");
                    // Rejoin the chat room after reconnection
                    signalRService.joinClubChat(clubId).catch((error) => {
                      logger.error('chat','Failed to rejoin chat room after reconnection', { error, clubId });
                    });
                  }
                }
              );

              // Scroll to bottom after loading messages
              setTimeout(scrollToBottom, 100);
            } else {
              // Connection started but not actually connected
              throw new Error("SignalR connection failed to establish");
            }
          } catch (signalRError) {
            logger.error('chat','SignalR connection error', { error: signalRError, clubId });
            // Check if it's an authorization error (401/403) which means club needs Grow tier
            if (signalRError instanceof Error && (signalRError.message.includes('401') || signalRError.message.includes('403'))) {
              setConnectionError("Real-time chat requires a Grow subscription. You can still send messages, but won't receive real-time updates.");
            } else {
              setConnectionError("Failed to connect to real-time chat. You can still send messages, but won't receive real-time updates.");
            }
            setIsConnected(false);
          }
        }
      } catch (error) {
        logger.error('chat','Error loading chat', { error, clubId });

        // Don't show error toasts for expected scenarios (unauthorized, forbidden, etc.)
        // These are handled by the UI state (hasAccess, isChatEnabled)
        const apiError = ErrorHandler.handleApiError(error, { context:'loading chat' });
        
        // Only show error toasts for unexpected errors (network issues, server errors, etc.)
        // Don't show errors for expected scenarios (chat disabled, unauthorized, forbidden, etc.)
        if (apiError.status && apiError.status >= 500) {
          // Server errors - these are unexpected
          ErrorHandler.showErrorToast(apiError);
        } else if (!apiError.status) {
          // Network or other unexpected errors without a status code
          ErrorHandler.showErrorToast(apiError);
        }
        // Don't show toasts for 4xx errors as these are expected when chat is unavailable/disabled
        
        // Set user-friendly connection error messages based on error type
        if (apiError.status === 401 || apiError.status === 403) {
          setConnectionError("Chat access requires a Grow subscription. Please upgrade to access chat features.");
        } else if (apiError.status === 404) {
          setConnectionError("Chat is not available for this club.");
        } else if (apiError.status === 423) {
          setConnectionError("Chat has been temporarily disabled by administrators.");
        } else if (apiError.status && apiError.status < 500) {
          // Other 4xx errors - don't show detailed error, just generic message
          setConnectionError("Chat is currently unavailable.");
        } else {
          setConnectionError("Failed to load chat data.");
        }
      } finally {
        setLoading(false);
      }
  }, [clubId, handleNewMessage]);

  useEffect(() => {
    initializeChat();

    // Cleanup function
    return () => {
      if (clubId && signalRService.isConnected()) {
        signalRService.leaveClubChat?.(clubId)?.catch?.((error: Error) => {
          logger.error('chat','Failed to leave chat room on cleanup', { error, clubId });
        });
        signalRService.offNewMessage?.();
      }
    };
  }, [clubId, initializeChat]);

  // No need to stop the global SignalR connection on unmount
  // The connection is managed as a singleton and should persist across page navigations

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !clubId || sending) return;

    try {
      setSending(true);
      const sentMessage = await chatService.sendMessage(clubId, {
        messageContent: newMessage.trim()
      });

      // Clear the input immediately for better UX
      setNewMessage("");

      // If SignalR is not connected, add the message locally
      // (when connected, it will be added via the real-time handler)
      if (!isConnected) {
        setMessages(prev => [...prev, sentMessage]);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      logger.error('chat','Error sending message', { error, clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'sending message' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setSending(false);
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!clubId || !hasMore || loading) return;

    try {
      setLoading(true);
      const oldestMessage = messages[0];
      const before = oldestMessage ? oldestMessage.sentAt : undefined;
      
      const chatHistory = await chatService.getChatHistory(clubId, before);
      
      // Prepend older messages
      setMessages(prev => [...chatHistory.messages, ...prev]);
      setHasMore(chatHistory.hasMore);
    } catch (error) {
      logger.error('chat','Error loading more messages', { error, clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'loading more messages' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setLoading(false);
    }
  };


  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20   rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-background to-muted/20 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              </div>
              <span className="text-foreground font-medium">Loading chat...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isChatEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto p-6">
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <div className="p-4 rounded-lg bg-gradient-to-br from-muted/40 to-muted/20 mb-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Community Chat Not Available</h2>
              <p className="text-muted-foreground text-center">
                Community chat is currently disabled. Please contact your club administrator to enable this feature.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto p-6">
          <Card className="glass border-border/50 hover:glass-strong transition-all duration-300 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <div className="p-4 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10 mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground text-center">
                You do not have access to this club&apos;s chat. Please contact your club administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6 h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">
        <Card className="h-full flex flex-col overflow-hidden glass border-border/50 shadow-xl backdrop-blur-xl">
          <CardHeader className="border-b border-border/50 flex-shrink-0 glass-soft">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Community Chat</span>
              </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center text-success">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span className="text-xs">Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-destructive">
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span className="text-xs">Offline</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="ml-2 h-6 text-xs"
                    data-testid="refresh-chat-button"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
          {connectionError && !isConnected && (
            <div className="mt-2 p-2 bg-warning/5 border border-warning/20 rounded text-xs text-warning">
              {connectionError}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadMoreMessages}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : ("Load more messages"
                  )}
                </Button>
              </div>
            )}

            {/* Messages List */}
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.chatMessageId}
                  data-testid={`message-${message.chatMessageId}`}
                  className={`flex items-start space-x-3 ${
                                         message.senderUserId === user?.userId ?'flex-row-reverse space-x-reverse' :''
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex flex-col ${
                     message.senderUserId === user?.userId ?'items-end' :'items-start'
                   }`}>
                     <div className="flex items-center space-x-2 mb-1">
                       {message.senderUserId !== user?.userId && (
                        <span className="text-sm font-medium">{message.senderName}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatChatTimestamp(message.sentAt)}
                      </span>
                    </div>
                    
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                       message.senderUserId === user?.userId
                         ?'bg-primary text-primary-foreground'
                         :'bg-muted'
                     }`}>
                      <p className="text-sm">{message.messageContent}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t flex-shrink-0">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1"
                maxLength={1000}
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || sending}
                size="icon"
                data-testid="send-message-button"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
} 