import { useEffect, useRef, useMemo } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function MessageList({ messages, onReply, isSending }) {
  const endRef = useRef(null);
  const prevLengthRef = useRef(messages.length); // theo dõi độ dài trước đó
  const isFirstRender = useRef(true);

  const latestMessage = messages[messages.length - 1];
  const activeButtonsId = latestMessage?.buttons?.length ? latestMessage.id : null;
  const disableAllButtons = Boolean(isSending);

  const buttonsDisabledMap = useMemo(() => {
    if (!activeButtonsId) return null;
    return new Set([activeButtonsId]);
  }, [activeButtonsId]);

  useEffect(() => {
    // Lần đầu render (vào trang): KHÔNG scroll
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevLengthRef.current = messages.length;
      return;
    }

    // Chỉ scroll khi có tin nhắn MỚI được thêm vào
    if (messages.length > prevLengthRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevLengthRef.current = messages.length;
  }, [messages]);

  return (
    <div className="chat-body">
      {messages.map((message) => {
        const isActive = buttonsDisabledMap
          ? buttonsDisabledMap.has(message.id)
          : false;
        const buttonsDisabled = disableAllButtons || !isActive;

        return (
          <MessageBubble
            key={message.id}
            message={message}
            onReply={onReply}
            buttonsDisabled={buttonsDisabled}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
