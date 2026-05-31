import "./styles.css";
import ChatWindow from "./components/ChatWindow.jsx";
import QuickTopics from "./components/QuickTopics.jsx";
import { quickReplies } from "./data/quickReplies.js";
import { useChat } from "./hooks/useChat.js";

export default function App() {
  const {
    messages,
    isSending,
    apiStatus,
    error,
    loadHistory,
    canLoadHistory,
    isHistoryLoading,
    newChat,
    startChat,
    sendText,
    sendPayload,
  } = useChat();

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">UET Admissions Prototype</p>
        <h1>Cổng Hỗ Trợ Tuyển Sinh UET</h1>
        <p className="subtitle">
          Hệ thống chatbot tư vấn tuyển sinh tự động (Flowchart-Grounded AI) liên kết trực tiếp với dữ liệu điểm chuẩn, học phí và các phương thức xét tuyển mới nhất.
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
          onLoadHistory={loadHistory}
          onNewChat={newChat}
          onStart={startChat}
          canLoadHistory={canLoadHistory}
          isHistoryLoading={isHistoryLoading}
          isSending={isSending}
          error={error}
        />
      </main>
    </div>
  );
}
