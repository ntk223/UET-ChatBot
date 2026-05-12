import ReplyButtons from "./ReplyButtons.jsx";

export default function MessageBubble({ message, onReply, buttonsDisabled }) {
  const bubbleClass = message.from === "user" ? "message user" : "message bot";

  return (
    <div className={bubbleClass}>
      <p>{message.text}</p>
      <ReplyButtons
        buttons={message.buttons}
        onReply={onReply}
        disabled={buttonsDisabled}
      />
    </div>
  );
}
