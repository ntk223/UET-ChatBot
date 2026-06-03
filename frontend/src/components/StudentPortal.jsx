import { useState } from "react";
import { User, AlertCircle, Key, Sparkles, CheckCircle2 } from "lucide-react";

export default function StudentPortal({
  loggedInCandidate,
  logoutCandidate,
  candidateAspirations,
  authError,
  setAuthError,
  loginUser,
  registerUser,
  verifyAspiration,
}) {
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'register'
  const [loginEmailInput, setLoginEmailInput] = useState("");
  const [loginPasswordInput, setLoginPasswordInput] = useState("");
  const [regEmailInput, setRegEmailInput] = useState("");
  const [regFullnameInput, setRegFullnameInput] = useState("");
  const [regPasswordInput, setRegPasswordInput] = useState("");

  const handleTabChange = (tab) => {
    setAuthTab(tab);
    if (setAuthError) setAuthError("");
  };

  return (
    <div className="panel-card auth-card">
      <h2>Cổng Đăng Ký &amp; Đăng Nhập (Student Portal)</h2>
      <p className="panel-desc">
        Đăng nhập tài khoản học sinh để theo dõi trạng thái, xem danh sách nguyện vọng xét tuyển và xác minh minh chứng.
      </p>

      {!loggedInCandidate ? (
        <div className="auth-container">
          <div className="auth-tabs flex-align">
            <button
              className={`auth-tab-btn ${authTab === "login" ? "active" : ""}`}
              onClick={() => handleTabChange("login")}
            >
              Đăng nhập
            </button>
            <button
              className={`auth-tab-btn ${authTab === "register" ? "active" : ""}`}
              onClick={() => handleTabChange("register")}
            >
              Đăng ký mới
            </button>
          </div>

          {authError && (
            <div className="auth-error-banner flex-align">
              <AlertCircle size={14} />
              <span>{authError}</span>
            </div>
          )}

          {authTab === "login" ? (
            <div className="auth-form">
              <div className="input-group">
                <label>Email học sinh</label>
                <input
                  type="email"
                  placeholder="example@student.com"
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  className="auth-input"
                />
              </div>
              <div className="input-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPasswordInput}
                  onChange={(e) => setLoginPasswordInput(e.target.value)}
                  className="auth-input"
                />
              </div>
              <button
                onClick={() => {
                  if (loginEmailInput.trim() && loginPasswordInput.trim()) {
                    loginUser(loginEmailInput.trim(), loginPasswordInput.trim());
                  }
                }}
                className="auth-submit-btn flex-align justify-center"
              >
                <Key size={14} />
                <span>Đăng nhập hệ thống</span>
              </button>
            </div>
          ) : (
            <div className="auth-form">
              <div className="input-group">
                <label>Họ và tên thí sinh</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={regFullnameInput}
                  onChange={(e) => setRegFullnameInput(e.target.value)}
                  className="auth-input"
                />
              </div>
              <div className="input-group">
                <label>Email học sinh</label>
                <input
                  type="email"
                  placeholder="example@student.com"
                  value={regEmailInput}
                  onChange={(e) => setRegEmailInput(e.target.value)}
                  className="auth-input"
                />
              </div>
              <div className="input-group">
                <label>Mật khẩu đăng nhập</label>
                <input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={regPasswordInput}
                  onChange={(e) => setRegPasswordInput(e.target.value)}
                  className="auth-input"
                />
              </div>
              <button
                onClick={() => {
                  if (regEmailInput.trim() && regFullnameInput.trim() && regPasswordInput.trim()) {
                    registerUser(regEmailInput.trim(), regFullnameInput.trim(), regPasswordInput.trim());
                  }
                }}
                className="auth-submit-btn flex-align justify-center"
              >
                <Sparkles size={14} />
                <span>Đăng ký tài khoản</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-profile-box">
          <div className="profile-header flex-align justify-between">
            <div className="flex-align">
              <User size={16} className="icon-blue" />
              <strong>{loggedInCandidate.fullname}</strong>
            </div>
            <button onClick={logoutCandidate} className="logout-btn">
              Đăng xuất
            </button>
          </div>

          <div className="profile-top-info">
            <p>Email liên kết: <strong>{loggedInCandidate.email}</strong></p>
            <p>Số nguyện vọng đã nộp: <strong className="aspiration-count">{candidateAspirations.length}</strong></p>
          </div>

          <div className="aspirations-section">
            <h3>Danh sách Nguyện vọng xét tuyển</h3>
            {candidateAspirations.length === 0 ? (
              <p className="no-aspiration-text">Bạn chưa đăng ký nguyện vọng nào.</p>
            ) : (
              <div className="aspirations-list">
                {candidateAspirations.map((asp) => (
                  <div key={asp.id} className="aspiration-item-card">
                    <div className="asp-card-header flex-align justify-between">
                      <span className="asp-id">
                        {asp.id.toString().startsWith("UET-") ? asp.id : `UET-${asp.id}`}
                      </span>
                      <span className={`status-badge ${asp.is_verified ? "verified" : "unverified"}`}>
                        {asp.is_verified ? "Đã xác minh ✅" : "Chờ xác minh ⏳"}
                      </span>
                    </div>
                    <div className="asp-card-body">
                      <div className="asp-row">
                        <span>Ngành học:</span> <strong>{asp.chosen_major}</strong>
                      </div>
                      <div className="asp-row">
                        <span>Phương thức:</span> <strong>{asp.admission_method}</strong>
                      </div>
                      {asp.phone_number && (
                        <div className="asp-row">
                          <span>Số điện thoại:</span> <strong>{asp.phone_number}</strong>
                        </div>
                      )}
                      {asp.details?.evidence_url && (
                        <div className="asp-row">
                          <span>Minh chứng:</span>
                          <a href={asp.details.evidence_url} target="_blank" rel="noopener noreferrer" className="link-text">
                            Xem minh chứng ↗
                          </a>
                        </div>
                      )}
                    </div>
                    {!asp.is_verified && (
                      <button
                        onClick={() => verifyAspiration(asp.id)}
                        className="verify-inline-btn flex-align justify-center"
                      >
                        <CheckCircle2 size={12} />
                        <span>Xác minh hồ sơ</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
