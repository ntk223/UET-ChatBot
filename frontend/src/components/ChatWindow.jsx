import Composer from "./Composer.jsx";
import MessageList from "./MessageList.jsx";

export default function ChatWindow({
  messages,
  onSend,
  onSendPayload,
  onLoadHistory,
  onNewChat,
  onStart,
  canLoadHistory,
  isHistoryLoading,
  isSending,
  error,
}) {
  const isEmpty = messages.length === 0;

  return (
    <section className="chat-card">
      <div className="chat-header">
        <div>
          <h3>Live preview</h3>
          <p className="muted">Responses are powered by the backend webhook.</p>
        </div>
        <div className="header-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={onNewChat}
            disabled={isSending}
          >
            New chat
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={onLoadHistory}
            disabled={!canLoadHistory || isHistoryLoading || isSending}
          >
            {isHistoryLoading ? "Loading..." : "Load history"}
          </button>
          <span className="badge">{isSending ? "Sending" : "Live"}</span>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <MessageList messages={messages} onReply={onSendPayload} isSending={isSending} />
      <Composer
        onSend={onSend}
        onStart={onStart}
        isSending={isSending}
        isEmpty={isEmpty}
      />
    </section>
  );
}
