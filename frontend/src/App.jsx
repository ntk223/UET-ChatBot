import { useState, useEffect } from "react";
import "./styles.css";
import ChatWindow from "./components/ChatWindow.jsx";
import FlowchartVisualizer from "./components/FlowchartVisualizer.jsx";
import StudentPortal from "./components/StudentPortal.jsx";
import MockDatabaseView from "./components/MockDatabaseView.jsx";
import AspirationsList from "./components/AspirationsList.jsx";
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
    loggedInCandidate,
    logoutCandidate,
    candidateAspirations,
    authError,
    setAuthError,
    loginUser,
    registerUser,
    verifyAspiration,
  } = useChat();

  const [promptInput, setPromptInput] = useState(systemPrompt);
  const [showPromptSaveSuccess, setShowPromptSaveSuccess] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState("editor"); // 'editor' | 'kb' | 'settings'
  const [showSubmissionCelebration, setShowSubmissionCelebration] = useState(false);
  const [rightColTab, setRightColTab] = useState("flowchart"); // 'flowchart' | 'aspirations'
  const [prevAspirationsCount, setPrevAspirationsCount] = useState(0);

  useEffect(() => {
    if (candidateAspirations.length > prevAspirationsCount) {
      setRightColTab("aspirations");
    }
    setPrevAspirationsCount(candidateAspirations.length);
  }, [candidateAspirations.length, prevAspirationsCount]);

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

  if (!loggedInCandidate) {
    return (
      <div className="guest-mode">
        <header className="hero flex-column align-center text-center" style={{ width: '100%', maxWidth: '480px', margin: '0 auto 24px', padding: '24px' }}>
          <div className="logo-icon-wrapper" style={{ margin: '0 auto 12px', background: 'var(--accent-light)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain className="logo-icon" size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <h1>UET Admissions</h1>
          <p className="subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
            Hệ thống tiếp nhận hồ sơ xét tuyển &amp; tư vấn tự động qua Rasa NLU
          </p>
        </header>

        <div className="guest-login-wrapper">
          <StudentPortal
            authError={authError}
            setAuthError={setAuthError}
            loginUser={loginUser}
            registerUser={registerUser}
          />
        </div>
      </div>
    );
  }

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
        <div className="header-actions flex-align" style={{ gap: '16px' }}>
          {loggedInCandidate && (
            <div className="system-status-card candidate-profile-header-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 'auto' }}>
              <div className="logo-icon-wrapper" style={{ background: 'var(--accent-light)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--ink)' }}>
                  {loggedInCandidate.fullname}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {loggedInCandidate.email}
                </div>
              </div>
              <button 
                onClick={logoutCandidate} 
                className="logout-btn"
                style={{ marginLeft: '10px', padding: '6px 12px', fontSize: '11px' }}
              >
                Đăng xuất
              </button>
            </div>
          )}

          <div className="system-status-card">
            <div className="status-label">Trạng thái kết nối</div>
            <div className="status-value flex-align">
              <span className={`dot-online ${apiStatus === "offline" ? "offline" : ""}`} />
              <span>
                {`Rasa NLU Engine (${apiStatus === "online" ? "Trực tuyến" : "Ngoại tuyến/Lỗi"})`}
              </span>
            </div>
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
          <div className="right-column-tabs-header flex-align">
            <button
              className={`right-tab-btn ${rightColTab === "flowchart" ? "active" : ""}`}
              onClick={() => setRightColTab("flowchart")}
              type="button"
            >
              <Brain size={14} />
              <span>Tiến trình tuyển sinh</span>
            </button>
            <button
              className={`right-tab-btn ${rightColTab === "aspirations" ? "active" : ""}`}
              onClick={() => setRightColTab("aspirations")}
              type="button"
            >
              <BookOpen size={14} />
              <span>Nguyện vọng đã đặt</span>
              {candidateAspirations.length > 0 && (
                <span className="tab-badge">{candidateAspirations.length}</span>
              )}
            </button>
          </div>

          <div className="right-column-tab-content">
            {rightColTab === "flowchart" ? (
              <FlowchartVisualizer
                slots={slots}
                currentFlow={currentFlow}
                nextSlotToCollect={nextSlotToCollect}
                getSlotLabel={getSlotLabel}
              />
            ) : (
              <AspirationsList
                candidateAspirations={candidateAspirations}
                verifyAspiration={verifyAspiration}
              />
            )}
          </div>

          <MockDatabaseView
            submissions={submissions}
            clearSubmissions={clearSubmissions}
            getSlotLabel={getSlotLabel}
          />
        </section>
      </main>
    </div>
  );
}
