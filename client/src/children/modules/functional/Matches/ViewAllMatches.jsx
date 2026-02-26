import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { authFetch } from "../../../../api";
import "./Chat.css";

const WALKTHROUGH_MESSAGE = (
  <div className="walkthrough-message" style={{
    padding: "2rem",
    textAlign: "center",
    color: "#e0e0e0",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    borderRadius: "12px",
    margin: "1rem",
    border: "1px solid #333",
  }}>
    <h3 style={{ marginBottom: "0.5rem" }}>📚 Walkthrough Step</h3>
    <p style={{ margin: 0, fontSize: "0.95rem" }}>
      Import <strong>MatchCard</strong> and <strong>ChatPage</strong> in Chat.jsx, then pass them to ViewAllMatches to see the chat.
    </p>
    <code style={{ display: "block", marginTop: "1rem", fontSize: "0.85rem", opacity: 0.9 }}>
      ViewAllMatches MatchCard=&#123;MatchCard&#125; ChatPage=&#123;ChatPage&#125;
    </code>
  </div>
);

// eslint-disable-next-line no-unused-vars
export default function ViewAllMatches({ MatchCard, ChatPage: ChatPageComponent }) {
  if (!MatchCard || !ChatPageComponent) {
    return WALKTHROUGH_MESSAGE;
  }
  const [self, setSelf] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  const [dateSuggestions, setDateSuggestions] = useState([]);
  const [loadingDateSuggestions, setLoadingDateSuggestions] = useState(false);
  const [dateSuggestionsError, setDateSuggestionsError] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
    async function fetchSelf() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/profiles/me');
        if (!res.ok) throw new Error("Failed to fetch self");
        const data = await res.json();
        setSelf(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching self:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSelf();
  }, []);

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/matches');
        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  const location = useLocation();

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await authFetch('/conversations');
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(data);

        // if navigation provided an openConversationId, load messages
        const openId = location?.state?.openConversationId;
        if (openId) {
          await fetchConversationMessages(openId);
          // clear state so it doesn't reopen on future renders
          window.history.replaceState({}, document.title);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    }

    fetchConversations();
  }, [location]);

  useEffect(() => {
    if (matches.length > 0 || conversations.length > 0) {
      fetchImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, conversations]);

  const fetchConversationMessages = async (conversationId) => {
    try {
      const res = await authFetch(`/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data.messages || []);
      setSelectedConversation(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching messages:", err);
    }
  };

  const createOrOpenConversation = async (matchId, otherUserId, otherUserName) => {
    try {
      // Check if conversation already exists
      const existingConv = conversations.find((c) => c.match_id === matchId);

      if (existingConv) {
        await fetchConversationMessages(existingConv.id);
      } else {
        // Create new conversation
        const res = await authFetch('/conversations', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ match_id: matchId }),
        });

        if (!res.ok) throw new Error("Failed to create conversation");
        const data = await res.json();

        const newConversation = {
          id: data.conversation.id,
          match_id: matchId,
          other_user_id: otherUserId,
          other_user_name: otherUserName,
          last_message: null,
          last_message_at: null,
          created_at: data.conversation.created_at,
        };

        setConversations([...conversations, newConversation]);
        setSelectedConversation({
          id: data.conversation.id,
          match_id: matchId,
          other_user_id: otherUserId,
          created_at: data.conversation.created_at,
        });
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error creating/opening conversation:", err);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const res = await authFetch(
        `/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: messageInput }),
        }
      );

      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();

      setMessages([
        ...messages,
        {
          id: data.data.id,
          sender_id: data.data.sender_id,
          sender_name: data.data.sender_name,
          content: data.data.content,
          created_at: data.data.created_at,
        },
      ]);
      setMessageInput("");
    } catch (err) {
      setError(err.message);
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const fetchDateSuggestions = async () => {
    if (!selectedConversation) return;

    setLoadingDateSuggestions(true);
    setDateSuggestionsError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch(`/date-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: selectedConversation.match_id,
          suggestion_count: 5,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch date suggestions");
      const data = await res.json();
      setDateSuggestions(data.suggestions || []);
      setShowDateSuggestions(true);
    } catch (err) {
      setDateSuggestionsError(err.message);
      console.error("Error fetching date suggestions:", err);
    } finally {
      setLoadingDateSuggestions(false);
    }
  };

  const handleBackToMatches = () => {
    setSelectedConversation(null);
    setMessages([]);
    setMessageInput("");
    setShowDateSuggestions(false);
    setDateSuggestions([]);
    setShowGame(false);
  };

  const sendGameNotification = async (message) => {
    if (!selectedConversation) return;

    try {
      const res = await authFetch(
        `/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message }),
        }
      );

      if (!res.ok) throw new Error("Failed to send game notification");
      const data = await res.json();

      setMessages([
        ...messages,
        {
          id: data.data.id,
          sender_id: data.data.sender_id,
          sender_name: data.data.sender_name,
          content: data.data.content,
          created_at: data.data.created_at,
        },
      ]);
    } catch (err) {
      console.error("Error sending game notification:", err);
    }
  };

  const fetchImages = async () => {
    const token = localStorage.getItem("token");
    const newUrls = {};
    const userIdsToFetch = new Set();

    // Collect user IDs from matches
    matches.forEach((match) => {
      const otherUser = getOtherUser(match);
      if (otherUser && otherUser.id) {
        userIdsToFetch.add(otherUser.id);
      }
    });

    // Collect user IDs from conversations
    conversations.forEach((conv) => {
      if (conv.other_user_id) {
        userIdsToFetch.add(conv.other_user_id);
      }
    });

    // Fetch images for each user
    for (const userId of userIdsToFetch) {
      if (!imageUrls[userId]) {
        try {
          const res = await authFetch(`/profiles/${userId}/image`);

          if (res.ok) {
            const blob = await res.blob();
            newUrls[userId] = URL.createObjectURL(blob);
          } else {
            newUrls[userId] = "";
          }
        } catch {
          newUrls[userId] = "";
        }
      }
    }

    if (Object.keys(newUrls).length > 0) {
      setImageUrls((prev) => ({ ...prev, ...newUrls }));
    }
  };

  const getOtherUser = (match) => {
    // Get current user ID directly from localStorage
    if (!self) return null;
    let currentUserId = self.profile.user_id;

    if (!currentUserId) return null;

    if (match.user1.id === currentUserId) {
      return match.user2;
    } else if (match.user2.id === currentUserId) {
      return match.user1;
    }

    return null;
  };

  const getOtherUserFromConversation = () => {
    if (!selectedConversation || !matches.length) return null;
    const match = matches.find(m => m.id === selectedConversation.match_id);
    if (!match) return null;
    return getOtherUser(match);
  };

  const getMatchDate = () => {
    if (!selectedConversation || !matches.length) return null;
    const match = matches.find(m => m.id === selectedConversation.match_id);
    if (!match || !match.created_at) return null;
    return new Date(match.created_at).toLocaleDateString();
  };

  return (
    <ChatPageComponent
      selectedConversation={selectedConversation}
      messages={messages}
      messageInput={messageInput}
      onMessageInputChange={setMessageInput}
      onSendMessage={sendMessage}
      sendingMessage={sendingMessage}
      loading={loading}
      error={error}
      conversations={conversations}
      matches={matches}
      imageUrls={imageUrls}
      showDateSuggestions={showDateSuggestions}
      dateSuggestions={dateSuggestions}
      dateSuggestionsError={dateSuggestionsError}
      onBackToMatches={handleBackToMatches}
      onFetchDateSuggestions={fetchDateSuggestions}
      onCloseDateSuggestions={() => setShowDateSuggestions(false)}
      onOpenConversation={fetchConversationMessages}
      getOtherUser={getOtherUser}
      getOtherUserFromConversation={getOtherUserFromConversation}
      getMatchDate={getMatchDate}
      self={self}
      showGame={showGame}
      onGameClick={() => setShowGame(true)}
      onCloseGame={() => setShowGame(false)}
      conversationId={selectedConversation?.id}
      onSendGameNotification={sendGameNotification}
    />
  );
}
