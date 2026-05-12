import { useEffect, useMemo, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function MessageList({ messages, onReply, isSending }) {
  const endRef = useRef(null);
  const latestMessage = messages[messages.length - 1];
  const activeButtonsId = latestMessage?.buttons?.length ? latestMessage.id : null;
  const disableAllButtons = Boolean(isSending);

  const buttonsDisabledMap = useMemo(() => {
    if (!activeButtonsId) {
      return null;
    }

    return new Set([activeButtonsId]);
  }, [activeButtonsId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
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
