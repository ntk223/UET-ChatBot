import { useCallback, useEffect, useState } from "react";
import { checkHealth, fetchChatHistory, sendWebhookMessage } from "../api/chatApi.js";
import { initialMessages } from "../data/initialMessages.js";
import { createMessage } from "../utils/messages.js";
import {
  createSenderId,
  getPersistedHistorySenderId,
  getPersistedSenderId,
  persistHistorySenderId,
  persistSenderId,
} from "../utils/storage.js";

const STATUS = {
  online: "online",
  offline: "offline",
  unknown: "unknown",
};

export function useChat() {
  const [senderId, setSenderId] = useState(() => createSenderId());
  const [historySenderId, setHistorySenderId] = useState(() =>
    getPersistedHistorySenderId()
  );
  const [messages, setMessages] = useState(() => initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState(STATUS.unknown);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const replaceMessages = useCallback((nextMessages) => {
    setMessages(nextMessages);
  }, []);

  const toHistoryMessages = useCallback((entries) => {
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries.map((entry) =>
      createMessage({
        from: entry?.sender === "USER" ? "user" : "bot",
        text: entry?.message_text || "",
        buttons: entry?.buttons,
        timestamp: entry?.timestamp,
      })
    );
  }, []);

  const persistActiveSenderId = useCallback(() => {
    persistSenderId(senderId);
  }, [senderId]);

  useEffect(() => {
    const previousActiveId = getPersistedSenderId();

    if (previousActiveId && previousActiveId !== historySenderId) {
      persistHistorySenderId(previousActiveId);
      setHistorySenderId(previousActiveId);
    }

    persistSenderId(senderId);
  }, [historySenderId, senderId]);

  useEffect(() => {
    let isActive = true;

    checkHealth()
      .then(() => {
        if (isActive) {
          setApiStatus(STATUS.online);
        }
      })
      .catch(() => {
        if (isActive) {
          setApiStatus(STATUS.offline);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const loadHistory = useCallback(async () => {
    if (!historySenderId || isHistoryLoading) {
      return;
    }

    setIsHistoryLoading(true);
    setError("");
    try {
      const historyData = await fetchChatHistory({ senderId: historySenderId });
      const historyMessages = toHistoryMessages(historyData?.history);
      replaceMessages(historyMessages);
      setSenderId(historySenderId);
      persistSenderId(historySenderId);
    } catch (historyError) {
      setError("Unable to load chat history. Please try again.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [historySenderId, isHistoryLoading, replaceMessages, toHistoryMessages]);

  const newChat = useCallback(() => {
    setMessages(initialMessages);
    setError("");
    if (senderId) {
      persistHistorySenderId(senderId);
      setHistorySenderId(senderId);
    }

    const nextSenderId = createSenderId();
    setSenderId(nextSenderId);
    persistSenderId(nextSenderId);
  }, [senderId]);

  const startChat = useCallback(async () => {
    if (isSending) {
      return;
    }

    setIsSending(true);
    setError("");
    persistActiveSenderId();

    try {
      const data = await sendWebhookMessage({
        senderId,
        messageText: "",
        payloadValue: "/greet",
        newSession: true,
      });

      const botText = data?.bot_says || "Ready.";
      appendMessage(
        createMessage({
          from: "bot",
          text: botText,
          buttons: data?.buttons,
        })
      );
    } catch (err) {
      setError("Unable to start a new chat. Please try again.");
      appendMessage(
        createMessage({
          from: "bot",
          text: "Sorry, I could not reach the server. Please try again.",
        })
      );
      setApiStatus(STATUS.offline);
    } finally {
      setIsSending(false);
    }
  }, [appendMessage, isSending, persistActiveSenderId, senderId]);

  const sendMessage = useCallback(
    async ({ text, payloadValue }) => {
      const trimmed = (text || "").trim();

      if (!trimmed || isSending) {
        return;
      }

      setIsSending(true);
      setError("");
      persistActiveSenderId();
      appendMessage(createMessage({ from: "user", text: trimmed }));

      try {
        const data = await sendWebhookMessage({
          senderId,
          messageText: trimmed,
          payloadValue,
        });

        const botText = data?.bot_says || "Thanks. How else can I help?";
        appendMessage(
          createMessage({
            from: "bot",
            text: botText,
            buttons: data?.buttons,
          })
        );
      } catch (err) {
        setError("Unable to reach the server. Please try again.");
        appendMessage(
          createMessage({
            from: "bot",
            text: "Sorry, I could not reach the server. Please try again.",
          })
        );
        setApiStatus(STATUS.offline);
      } finally {
        setIsSending(false);
      }
    },
    [appendMessage, isSending, persistActiveSenderId, senderId]
  );

  const sendText = useCallback((text) => sendMessage({ text, payloadValue: null }), [
    sendMessage,
  ]);

  const sendPayload = useCallback(
    (button) => {
      if (!button) {
        return;
      }

      sendMessage({
        text: button.title || "Select",
        payloadValue: button.payload || null,
      });
    },
    [sendMessage]
  );

  return {
    messages,
    isSending,
    apiStatus,
    error,
    loadHistory,
    canLoadHistory: Boolean(historySenderId),
    isHistoryLoading,
    newChat,
    startChat,
    sendText,
    sendPayload,
  };
}
