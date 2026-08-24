import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SHADOWS,
  ENQUIRY_STATUS_LABELS,
} from "../../constants";
import { Enquiry, Message, User } from "../../types";
import {
  getEnquiry,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  uploadChatImage,
} from "../../services/firestore";
import { uploadFile } from "../../services/storage";
import * as ImagePicker from "expo-image-picker";

interface RouteParams {
  enquiryId: string;
}

export function ChatDetailScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [enquiry, setEnquiry] = React.useState<Enquiry | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const [lastDoc, setLastDoc] = React.useState<any>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  const scrollViewRef = React.useRef<ScrollView>(null);
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    loadEnquiry();
    loadMessages();

    // Mark messages as read when screen opens
    if (route.params?.enquiryId && user) {
      markMessagesAsRead(route.params.enquiryId, user.uid);
    }
  }, [route.params?.enquiryId]);

  const loadEnquiry = async () => {
    if (!route.params?.enquiryId) return;
    try {
      const data = await getEnquiry(route.params.enquiryId);
      setEnquiry(data);
    } catch (error) {
      console.error("Error loading enquiry:", error);
    }
  };

  const loadMessages = async (reset = false) => {
    if (!route.params?.enquiryId) return;

    try {
      const result = await getMessages(
        route.params.enquiryId,
        50,
        reset ? undefined : lastDoc,
      );
      setMessages((prev) =>
        reset ? result.messages : [...result.messages, ...prev],
      );
      setLastDoc(result.lastDoc);
      setHasMore(!!result.lastDoc);

      // Scroll to bottom on initial load
      if (reset) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !enquiry) return;

    const text = messageText;
    setMessageText("");
    setSending(true);

    try {
      await sendMessage({
        enquiryId: enquiry.id,
        senderId: user.uid,
        senderRole: user.role,
        text,
        type: "text",
        read: false,
      });

      // Optimistically add message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        enquiryId: enquiry.id,
        senderId: user.uid,
        senderRole: user.role,
        text,
        type: "text",
        read: false,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      scrollToBottom();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send message");
      setMessageText(text); // Restore text on error
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async () => {
    if (!user || !enquiry) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploadingImage(true);
      const asset = result.assets[0];

      // Upload to Firebase Storage
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const imageUrl = await uploadFile(
        `chat/images/${enquiry.id}/${Date.now()}.jpg`,
        blob,
        "image/jpeg",
      );

      // Send image message
      await sendMessage({
        enquiryId: enquiry.id,
        senderId: user.uid,
        senderRole: user.role,
        text: imageUrl,
        type: "image",
        read: false,
      });

      scrollToBottom();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send image");
    } finally {
      setUploadingImage(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.uid;
    const isSystem = item.type === "system";

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessage}>{item.text}</Text>
        </View>
      );
    }

    const messageContent =
      item.type === "image" ? (
        <Image
          source={{ uri: item.text }}
          style={styles.imageMessage}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {item.text}
        </Text>
      );

    return (
      <View
        style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}
      >
        <View style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}>
          {messageContent}
          <View style={styles.messageMeta}>
            <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
              {formatTime(item.createdAt)}
            </Text>
            {isOwn && item.read && <Text style={styles.readReceipt}>✓✓</Text>}
          </View>
        </View>
      </View>
    );
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { [date: string]: Message[] } = {};
    messages.forEach((msg) => {
      const date = formatDate(msg.createdAt);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  }, [messages]);

  const sectionHeaders = Object.keys(groupedMessages);

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {enquiry
              ? user?.role === "girl"
                ? "PG Owner"
                : "Enquiry"
              : "Chat"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {enquiry
              ? ENQUIRY_STATUS_LABELS[enquiry.status] || enquiry.status
              : "Loading..."}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => Alert.alert("Call", "Call feature coming soon")}
        >
          <Text style={styles.callButtonText}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={sectionHeaders}
        keyExtractor={(item) => item}
        renderSectionHeader={({ section }) => (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{section}</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <View key={index}>
            {groupedMessages[item].map((msg, i) => (
              <React.Fragment key={`${index}-${i}`}>
                {renderMessage({ item: msg })}
              </React.Fragment>
            ))}
          </View>
        )}
        ListFooterComponent={
          hasMore && (
            <TouchableOpacity
              style={styles.loadMore}
              onPress={() => loadMessages(false)}
            >
              <Text style={styles.loadMoreText}>Load earlier messages</Text>
            </TouchableOpacity>
          )
        }
        onContentSizeChange={scrollToBottom}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.messagesContent}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleSendImage}
            disabled={sending || uploadingImage}
          >
            <Text style={styles.attachButtonText}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            placeholderTextColor={COLORS.textDisabled}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            <Text style={styles.sendButtonText}>{sending ? "⏳" : "➤"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  callButton: {
    padding: SPACING.sm,
  },
  callButtonText: {
    fontSize: FONT_SIZES.lg,
  },
  messagesContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: SPACING.md,
  },
  dateSeparatorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  messageContainer: {
    marginBottom: SPACING.sm,
    alignItems: "flex-start",
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: SPACING.xs,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  ownMessageText: {
    color: COLORS.surface,
  },
  imageMessage: {
    width: 200,
    height: 150,
    borderRadius: BORDER_RADIUS.md,
  },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDisabled,
  },
  ownMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  readReceipt: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondary,
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: SPACING.sm,
  },
  systemMessage: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDisabled,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  attachButton: {
    padding: SPACING.sm,
  },
  attachButtonText: {
    fontSize: FONT_SIZES.lg,
  },
  messageInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    maxHeight: 120,
    paddingVertical: SPACING.xs,
  },
  sendButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.textDisabled,
  },
  sendButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
  },
  loadMore: {
    padding: SPACING.md,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: "500",
  },
});
