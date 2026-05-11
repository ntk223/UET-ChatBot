import "./styles.css";
import ChatWindow from "./components/ChatWindow.jsx";
import QuickTopics from "./components/QuickTopics.jsx";
import { quickReplies } from "./data/quickReplies.js";
import { useChat } from "./hooks/useChat.js";

export default function App() {
  const { messages, isSending, apiStatus, error, sendText, sendPayload } = useChat();

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">UET Chatbot Demo</p>
        <h1>Admissions assistant prototype</h1>
        <p className="subtitle">
          A simple React UI connected to the backend webhook for live replies.
        </p>
      </header>

      <main className="layout">
        <QuickTopics
          topics={quickReplies}
          onSelect={sendText}
          apiStatus={apiStatus}
          isSending={isSending}
          error={error}
        />
        <ChatWindow
          messages={messages}
          onSend={sendText}
          onSendPayload={sendPayload}
          isSending={isSending}
          error={error}
        />
      </main>
    </div>
  );
}
