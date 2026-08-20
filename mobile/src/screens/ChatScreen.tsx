import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ListRenderItem,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ChatService } from '@/services/chatService';
import { SignalRService } from '@/services/signalRService';
import { ChatMessage, ChatAccessResponse } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeColors, ChatColors } from '../contexts/ThemeContext';
import { formatChatTimestamp } from '@/utils/dateFormatter';

// Icon component props type
interface IconProps {
  name: string;
  size: number;
  color: string;
}

// Fix TypeScript Icon component typing for tests
const IconComponent = Icon as unknown as React.ComponentType<IconProps>;

export const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const { colors, chatColors } = useTheme();
  const styles = createStyles(colors, chatColors);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatAccess, setChatAccess] = useState<ChatAccessResponse | null>(null);
  const [signalRConnected, setSignalRConnected] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const isMountedRef = useRef(true);

  const loadChatData = useCallback(
    async (isRefresh = false) => {
      if (!user?.user?.clubId || !isMountedRef.current) {
        if (isMountedRef.current && !user?.user?.clubId) {
          setError('User club information not available');
          setLoading(false);
        }
        return;
      }

      try {
        if (!isRefresh && isMountedRef.current) {
          setLoading(true);
          setError(null);
        }

        if (isRefresh && isMountedRef.current) {
          setRefreshing(true);
          setError(null); // Clear any previous errors
        }

        // Check chat access first
        const access = await ChatService.checkChatAccess(user.user.clubId);
        if (!isMountedRef.current) return;
        
        setChatAccess(access);

        if (!access.hasAccess) {
          if (isMountedRef.current) {
            setMessages([]);
            setHasMore(false);
            if (!access.isChatEnabled) {
              setError('Chat is currently disabled by your club admin');
            } else if (!access.hasAccess) {
              setError('You do not have access to community chat');
            }
          }
          return;
        }

        // Load chat history with proper parameters
        const response = await ChatService.getChatHistory(user.user.clubId, {
          limit: 20,
        });
        if (!isMountedRef.current) return;

        setMessages(response.messages);
        setHasMore(response.hasMore || false);

        // Auto-scroll to bottom for new loads (but not for refreshes)
        if (!isRefresh) {
          setTimeout(() => {
            if (isMountedRef.current) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }, 100);
        }
      } catch (err) {
        if (isMountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load chat';
          
          // During refresh with existing messages, show Alert instead of setting error state
          if (isRefresh && messages.length > 0) {
            Alert.alert('Error', errorMessage);
          } else {
            setError(errorMessage);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [user?.user?.clubId, messages.length]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!user?.user?.clubId || !hasMore || loadingMore || !isMountedRef.current) {
      return;
    }

    try {
      if (isMountedRef.current) {
        setLoadingMore(true);
      }
      
      const oldestMessage = messages[0];
      if (!oldestMessage) return;

      const response = await ChatService.getChatHistory(user.user.clubId, {
        before: oldestMessage.sentAt,
        limit: 20,
      });

      if (!isMountedRef.current) return;

      setMessages(prev => [...response.messages, ...prev]);
      setHasMore(response.hasMore || false);
    } catch (err) {
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to load more messages');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [user?.user?.clubId, hasMore, loadingMore, messages]);

  const sendMessage = useCallback(async () => {
    if (!user?.user?.clubId || !messageText.trim() || sending) {
      return;
    }

    const content = messageText.trim();
    
    try {
      if (isMountedRef.current) {
        setSending(true);
      }

      const newMessage = await ChatService.sendMessage(user.user.clubId, {
        messageContent: content,
      });

      if (!isMountedRef.current) return;

      // Clear input immediately
      setMessageText('');
      
      // Don't add the message to local state - SignalR will handle it
      // This prevents duplicate messages for the sender
      if (!signalRConnected) {
        // Only add locally if SignalR is not connected (fallback)
        setMessages(prev => {
          const updatedMessages = [...prev, newMessage];
          return updatedMessages;
        });
        
        // Scroll to bottom
        setTimeout(() => {
          if (isMountedRef.current) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }, 100);
      }

    } catch (err) {
      if (isMountedRef.current) {
        setMessageText(content); // Restore message text on error
        Alert.alert(
          'Error',
          err instanceof Error ? err.message : 'Failed to send message. Please try again.'
        );
      }
    } finally {
      if (isMountedRef.current) {
        setSending(false);
      }
    }
  }, [user?.user?.clubId, messageText, sending, signalRConnected]);

  const MessageItem = React.memo<{ message: ChatMessage; currentUserId?: number }>(({ message, currentUserId }) => {
    const isOwnMessage = message.senderUserId === currentUserId;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{message.senderName}</Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.messageContent}
          </Text>
          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {formatChatTimestamp(message.sentAt)}
          </Text>
        </View>
      </View>
    );
  });
  
  MessageItem.displayName = 'MessageItem';

  const renderMessage: ListRenderItem<ChatMessage> = useCallback(({ item }) => {
    return <MessageItem message={item} currentUserId={user?.user?.userId} />;
  }, [user?.user?.userId, MessageItem]);

  const renderHeader = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.interactive.primary} />
          <Text style={styles.loadingMoreText}>Loading more messages...</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    
    if (error) {
      // Check if this is a chat disabled by admin scenario
      const isChatDisabled = chatAccess && !chatAccess.isChatEnabled;
      
      return (
        <View style={styles.emptyContainer}>
          <IconComponent 
            name={isChatDisabled ? "speaker-notes-off" : "error-outline"} 
            size={48} 
            color={isChatDisabled ? colors.text.tertiary : colors.text.secondary} 
          />
          <Text style={styles.emptyTitle}>
            {isChatDisabled ? "Chat Disabled" : "Chat Unavailable"}
          </Text>
          <Text style={styles.emptyDescription}>
            {isChatDisabled 
              ? "Community chat has been disabled by your club administrator. Contact your admin if you have questions."
              : error
            }
          </Text>
          {/* Only show Try Again button for connection errors, not when disabled by admin */}
          {!isChatDisabled && (
            <TouchableOpacity style={styles.retryButton} onPress={() => loadChatData()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (chatAccess?.hasAccess && messages.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <IconComponent name="chat-bubble-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>Start the conversation!</Text>
          <Text style={styles.emptyDescription}>
            Be the first to send a message to the community.
          </Text>
        </View>
      );
    }

    return null;
  };

  // SignalR connection and real-time message handling
  useEffect(() => {
    const handleNewMessage = (message: ChatMessage) => {
      if (!isMountedRef.current) return;
      
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some(m => m.chatMessageId === message.chatMessageId);
        if (exists) return prev;
        
        // Add new message and sort by timestamp to maintain order
        const updatedMessages = [...prev, message].sort((a, b) => 
          new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
        
        // Auto-scroll to bottom for new messages
        setTimeout(() => {
          if (isMountedRef.current) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }, 100);
        
        return updatedMessages;
      });
    };

    const setupSignalR = async () => {
      if (!user?.user?.clubId) return;
      
      try {
        await SignalRService.connect();
        SignalRService.addMessageHandler(handleNewMessage);
        await SignalRService.joinClubChat(user.user.clubId);
        setSignalRConnected(true);
      } catch (error) {
        // CHAT-05 fix: Show user-friendly error when SignalR connection fails
        setSignalRConnected(false);
        if (isMountedRef.current) {
          setError('Unable to connect to real-time chat. Messages will not update automatically.');
        }
        if (__DEV__) {
          console.warn('[ChatScreen] SignalR connection failed:', error);
        }
      }
    };

    setupSignalR();

    return () => {
      // Wrap cleanup in try-catch to prevent crashes during unmount
      try {
        SignalRService.removeMessageHandler(handleNewMessage);
        if (user?.user?.clubId) {
          SignalRService.leaveClubChat(user.user.clubId);
        }
        SignalRService.disconnect();
      } catch (error) {
        // Log error but don't crash - cleanup should be defensive
        if (__DEV__) {
          console.warn('[ChatScreen] SignalR cleanup error:', error);
        }
      }
      setSignalRConnected(false);
    };
  }, [user?.user?.clubId]);

  // Cleanup function to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadChatData();
  }, [loadChatData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.interactive.primary} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        testID="chat-container"
      >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.chatMessageId}-${item.sentAt}-${index}`}
        testID="chat-messages-list"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadChatData(true)}
            colors={[colors.interactive.primary]}
            tintColor={colors.interactive.primary}
            testID="chat-refresh-control"
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContainer,
          messages.length === 0 && styles.emptyMessagesContainer
        ]}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
      />
      
      {chatAccess?.hasAccess && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={chatColors.placeholder}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
            testID="send-button"
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <IconComponent name="send" size={20} color={colors.text.inverse} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, chatColors: ChatColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: chatColors.ownMessage,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: chatColors.otherMessage,
    borderBottomLeftRadius: 4,
    ...colors.shadow.small,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: chatColors.senderName,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: chatColors.ownMessageText,
  },
  otherMessageText: {
    color: chatColors.otherMessageText,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTimestamp: {
    color: chatColors.ownTimestamp,
    textAlign: 'right',
  },
  otherTimestamp: {
    color: chatColors.otherTimestamp,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: chatColors.inputBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: chatColors.inputBackground,
    color: chatColors.inputText,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: chatColors.sendButton,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: chatColors.sendButtonDisabled,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});