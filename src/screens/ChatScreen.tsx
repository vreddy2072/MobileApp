import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { StyledCard } from "../components/styled/StyledCard";
import { StyledText } from "../components/styled/StyledText";
import { StyledIcon } from "../components/styled/StyledIcon";
import {
  spacing,
  typography,
  borderRadius,
  iconSizes,
} from "../constants/designSystem";
import { sendPrompt } from "../services/aiService";
import { useTokens } from "../hooks/useTokens";
import { getUserId } from "../utils/userId";
import { navigate } from "../services/NavigationService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function ChatScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles();
  const { balance, loading: tokensLoading, refresh } = useTokens();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const prompt = inputText.trim();
    if (!prompt || loading) return;

    // Check token balance before sending
    if (balance !== null && balance <= 0) {
      Alert.alert(
        "Buy Credits to Continue",
        "You don't have enough credits to send a message. Please purchase more credits.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Buy Credits",
            onPress: () => {
              navigate("TokenStore");
            },
          },
        ]
      );
      return;
    }

    // Get userId for sendPrompt
    const userId = await getUserId();
    if (!userId) {
      setError("User ID not available. Please try again.");
      return;
    }

    // Clear error
    setError(null);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const result = await sendPrompt(userId, prompt);

      if (!result.success) {
        // Handle error from sendPrompt
        const errorMessage = result.error?.message || "An error occurred";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Add assistant message with output
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.output || "No response received",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh token balance after successful AI reply
      await refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.backgroundStyle, localStyles.container]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={localStyles.messagesContainer}>
        {messages.length === 0 ? (
          <View style={localStyles.emptyContainer}>
            <StyledIcon
              name="chatbubble-outline"
              size={iconSizes.emptyState}
              color={theme.textSecondary}
            />
            <Text style={[localStyles.emptyText, { color: theme.text }]}>
              Start a conversation
            </Text>
            <Text
              style={[localStyles.emptySubtext, { color: theme.textSecondary }]}
            >
              Send a message to test the AI integration
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={localStyles.messagesList}
            contentContainerStyle={localStyles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  localStyles.messageWrapper,
                  message.role === "user"
                    ? localStyles.userMessageWrapper
                    : localStyles.assistantMessageWrapper,
                ]}
              >
                <StyledCard
                  backgroundColor={
                    message.role === "user" ? theme.primary : theme.card
                  }
                  style={localStyles.messageCard}
                >
                  <Text
                    style={[
                      localStyles.messageText,
                      {
                        color:
                          message.role === "user"
                            ? theme.background
                            : theme.text,
                      },
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text
                    style={[
                      localStyles.messageTime,
                      {
                        color:
                          message.role === "user"
                            ? theme.background
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {formatTimestamp(message.timestamp)}
                  </Text>
                </StyledCard>
              </View>
            ))}
            {loading && (
              <View style={localStyles.loadingWrapper}>
                <StyledCard backgroundColor={theme.card} style={localStyles.messageCard}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text
                    style={[
                      localStyles.loadingText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Thinking...
                  </Text>
                </StyledCard>
              </View>
            )}
          </ScrollView>
        )}

        {error && (
          <View style={localStyles.errorContainer}>
            <StyledCard backgroundColor={theme.error} style={localStyles.errorCard}>
              <StyledIcon
                name="alert-circle-outline"
                size={iconSizes.button}
                color={theme.background}
              />
              <Text
                style={[localStyles.errorText, { color: theme.background }]}
              >
                {error}
              </Text>
            </StyledCard>
          </View>
        )}
      </View>

      <View style={[localStyles.inputContainer, { backgroundColor: theme.card }]}>
        <TextInput
          style={[
            localStyles.input,
            {
              color: theme.text,
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}
          placeholder="Type your message..."
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          editable={!loading}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
          style={[
            localStyles.sendButton,
            styles.buttonStyle,
            (!inputText.trim() || loading) && localStyles.sendButtonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.background} />
          ) : (
            <StyledIcon
              name="send"
              size={iconSizes.button}
              color={theme.background}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    textAlign: "center",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.base,
    gap: spacing.base,
  },
  messageWrapper: {
    width: "100%",
  },
  userMessageWrapper: {
    alignItems: "flex-end",
  },
  assistantMessageWrapper: {
    alignItems: "flex-start",
  },
  messageCard: {
    maxWidth: "80%",
    padding: spacing.sm,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    marginBottom: spacing.xs / 2,
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    alignSelf: "flex-end",
  },
  loadingWrapper: {
    alignItems: "flex-start",
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
  },
  errorContainer: {
    padding: spacing.base,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.base,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

