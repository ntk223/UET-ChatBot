import { useState, useEffect } from "react";
import "./styles.css";
import ChatWindow from "./components/ChatWindow.jsx";
import { useChat } from "./hooks/useChat.js";
import {
  Settings,
  Database,
  Brain,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Save,
  CheckCircle2,
  Trash2,
  Key,
  BookOpen,
  ChevronDown,
  ChevronUp,
  User,
  Check,
  Zap,
} from "lucide-react";

export default function App() {
  const {
    messages,
    isSending,
    apiStatus,
    error,
    newChat,
    startChat,
    sendText,
    sendPayload,
    slots,
    currentFlow,
    nextSlotToCollect,
    submissions,
    clearSubmissions,
    systemPrompt,
    setSystemPrompt,
    apiKey,
    setApiKey,
    chatEngine,
    setChatEngine,
    getSlotLabel,
  } = useChat();

  const [promptInput, setPromptInput] = useState(systemPrompt);
  const [showPromptSaveSuccess, setShowPromptSaveSuccess] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState("editor"); // 'editor' | 'kb' | 'settings'
  const [showSubmissionCelebration, setShowSubmissionCelebration] = useState(false);

  // Sync prompt editor when default is restored or loaded
  useEffect(() => {
    setPromptInput(systemPrompt);
  }, [systemPrompt]);

  // Monitor submission count to trigger a brief toast celebration
  useEffect(() => {
    if (submissions.length > 0) {
      setShowSubmissionCelebration(true);
      const timer = setTimeout(() => setShowSubmissionCelebration(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [submissions.length]);

  const handleSavePrompt = () => {
    setSystemPrompt(promptInput);
    setShowPromptSaveSuccess(true);
    setTimeout(() => setShowPromptSaveSuccess(false), 3000);
  };

  const handleRestoreDefaultPrompt = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục system prompt về mặc định không?")) {
      newChat();
    }
  };

  // Quick tests for the slot filling mechanism
  const triggerQuickTest = (text) => {
    sendText(text);
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow flex-align">
            <Sparkles size={14} className="icon-blue" />
            <span>Cổng Thông Tin Tuyển Sinh UET</span>
          </p>
          <h1>Cổng Tư Vấn &amp; Đăng Ký Tuyển Sinh UET</h1>
          <p className="subtitle">
            Hệ thống hỗ trợ tư vấn tuyển sinh và tiếp nhận hồ sơ nguyện vọng trực tuyến tự động qua Rasa NLU.
          </p>
        </div>
        <div className="system-status-card">
          <div className="status-label">Trạng thái kết nối</div>
          <div className="status-value flex-align">
            <span className={`dot-online ${apiStatus === "offline" ? "offline" : ""}`} />
            <span>
              {`Rasa NLU Engine (${apiStatus === "online" ? "Trực tuyến" : "Ngoại tuyến/Lỗi"})`}
            </span>
          </div>
        </div>
      </header>

      {showSubmissionCelebration && (
        <div className="celebration-toast flex-align">
          <CheckCircle2 size={18} className="text-green" />
          <div>
            <strong>Ghi nhận hồ sơ thành công!</strong>
            <p>Ứng viên đã được lưu vào cơ sở dữ liệu.</p>
          </div>
        </div>
      )}

      <main className="playground-grid">
        {/* MIDDLE COLUMN: Active Chat Session */}
        <section className="column middle-column">
          <ChatWindow
            messages={messages}
            onSend={sendText}
            onSendPayload={sendPayload}
            onLoadHistory={null}
            onNewChat={newChat}
            onStart={startChat}
            canLoadHistory={false}
            isHistoryLoading={false}
            isSending={isSending}
            error={error}
          />

          {/* Quick-test triggers for easier verification */}
          {/* <div className="quick-test-section">
            <h4 className="flex-align">
              <Zap size={14} className="icon-blue" fill="currentColor" />
              <span>Nút Thử Nghiệm Nhanh Nghiệp Vụ (Test Scenarios)</span>
            </h4>
            <div className="test-buttons-grid">
              <button
                className="test-btn"
                onClick={() => triggerQuickTest("Mình muốn đăng ký nguyện vọng xét tuyển")}
              >
                1. Đăng ký nguyện vọng
              </button>
              <button
                className="test-btn"
                onClick={() => triggerQuickTest("Xét bằng phương thức THPTQG")}
              >
                2. Chọn THPTQG
              </button>
              <button
                className="test-btn"
                onClick={() => triggerQuickTest("Nguyễn Trung Kiên")}
              >
                3. Khai báo Họ Tên
              </button>
              <button
                className="test-btn"
                onClick={() => triggerQuickTest("0912345678")}
              >
                4. Khai báo SĐT
              </button>
              <button
                className="test-btn"
                onClick={() => triggerQuickTest("Học phí ngành CNTT CN4 là bao nhiêu?")}
              >
                ⚡ Hỏi xen ngang Học phí (Interruption)
              </button>
              <button
                className="test-btn"
                onClick={() => triggerQuickTest("https://drive.google.com/minhchung.png")}
              >
                5. Khai báo Minh chứng
              </button>
            </div>
          </div> */}
        </section>

        {/* RIGHT COLUMN: Chatbot Session Memory Slots & Database Submissions */}
        <section className="column right-column">
          {/* Active Slots Monitor */}
          <div className="panel-card slots-card">
            <h2>Bộ Nhớ Agent (Slots Tracker)</h2>
            <p className="panel-desc">
              Trạng thái điền các thông tin trong hồ sơ của thí sinh ở phiên hội thoại hiện tại:
            </p>

            <div className="slots-status-bar">
              <div className="status-item">
                <span className="status-label">Luồng nghiệp vụ:</span>
                <span className={`flow-tag ${currentFlow || "none"}`}>
                  {currentFlow ? currentFlow : "Không (Hội thoại tự do)"}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Đang yêu cầu:</span>
                <span className="expected-slot-tag">
                  {nextSlotToCollect ? getSlotLabel(nextSlotToCollect) : "Không"}
                </span>
              </div>
            </div>

            <div className="slots-list">
              {Object.keys(slots).map((key) => {
                const isRelevant =
                  !currentFlow ||
                  (currentFlow === "THPTQG" &&
                    ["fullname", "phone_number", "chosen_major", "thptqg_block", "thptqg_score", "evidence_url"].includes(key)) ||
                  (currentFlow === "HSA" &&
                    ["fullname", "phone_number", "chosen_major", "hsa_id", "hsa_score"].includes(key)) ||
                  (currentFlow === "IELTS" &&
                    ["fullname", "phone_number", "chosen_major", "ielts_score", "math_score"].includes(key)) ||
                  (currentFlow === "TUYEN_THANG" &&
                    ["fullname", "phone_number", "chosen_major", "award_name"].includes(key));

                if (!isRelevant) return null;

                const isFilled = slots[key] !== null;
                const isExpected = nextSlotToCollect === key;

                return (
                  <div
                    key={key}
                    className={`slot-row ${isFilled ? "filled" : ""} ${isExpected ? "expected" : ""}`}
                  >
                    <div className="slot-indicator">
                      {isFilled ? (
                        <CheckCircle2 size={16} className="text-green" />
                      ) : isExpected ? (
                        <span className="pulse-expected" />
                      ) : (
                        <span className="dot-empty" />
                      )}
                    </div>
                    <div className="slot-meta">
                      <div className="slot-name">{getSlotLabel(key)}</div>
                      <div className="slot-key">{key}</div>
                    </div>
                    <div className="slot-value">
                      {isFilled ? (
                        key === "evidence_url" && slots[key].startsWith("http") ? (
                          <a href={slots[key]} target="_blank" rel="noopener noreferrer" className="link-text">
                            Xem URL ↗
                          </a>
                        ) : (
                          slots[key]
                        )
                      ) : isExpected ? (
                        <span className="text-waiting">Đang chờ nhập...</span>
                      ) : (
                        <span className="text-empty">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {currentFlow === null && (
                <div className="no-active-flow-msg">
                  Bắt đầu quy trình Đăng ký nguyện vọng để theo dõi bộ nhớ điền hồ sơ (Slot Filling).
                </div>
              )}
            </div>
          </div>

          {/* Candidate database submission records */}
          <div className="panel-card database-card">
            <div className="panel-header-action">
              <h2>Mock Database (Hồ sơ đã lưu)</h2>
              {submissions.length > 0 && (
                <button className="ghost-button icon-only" onClick={clearSubmissions} title="Xóa toàn bộ hồ sơ">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="panel-desc">Các hồ sơ được thêm tự động khi sự kiện [CALL_ACTION] được gọi thành công:</p>

            <div className="submissions-list">
              {submissions.length === 0 ? (
                <div className="empty-db-state">
                  <Database size={32} className="icon-muted" />
                  <p>Chưa có hồ sơ thí sinh nào được lưu. Hãy hoàn tất quy trình điền form trên chatbot để lưu hồ sơ!</p>
                </div>
              ) : (
                submissions.map((sub, index) => (
                  <div key={sub.id || index} className="db-record-card">
                    <div className="db-record-header">
                      <div className="db-record-title flex-align">
                        <User size={13} className="icon-blue" />
                        <strong>{sub.fullname}</strong>
                      </div>
                      <span className="db-record-method">{sub.admission_method}</span>
                    </div>
                    <div className="db-record-details">
                      <div className="detail-row">
                        <span>SĐT:</span> <strong>{sub.phone_number}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Ngành:</span> <strong>{sub.chosen_major}</strong>
                      </div>
                      {Object.keys(sub.details)
                        .slice(3)
                        .map((detailKey) => (
                          <div key={detailKey} className="detail-row sub-detail">
                            <span>{getSlotLabel(detailKey)}:</span>
                            <span className="detail-val">{sub.details[detailKey]}</span>
                          </div>
                        ))}
                    </div>
                    <div className="db-record-footer">
                      <span className="record-date">{sub.created_at}</span>
                      <span className="record-id">{sub.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
