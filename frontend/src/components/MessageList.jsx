import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function MessageList({ messages, onReply }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-body">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onReply={onReply} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
