import Composer from "./Composer.jsx";
import MessageList from "./MessageList.jsx";

export default function ChatWindow({ messages, onSend, onSendPayload, isSending, error }) {
  return (
    <section className="chat-card">
      <div className="chat-header">
        <div>
          <h3>Live preview</h3>
          <p className="muted">Responses are powered by the backend webhook.</p>
        </div>
        <span className="badge">{isSending ? "Sending" : "Live"}</span>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <MessageList messages={messages} onReply={onSendPayload} />
      <Composer onSend={onSend} isSending={isSending} />
    </section>
  );
}
