import { useState } from "react";
import ReplyButtons from "./ReplyButtons.jsx";
import { Brain, Code, Play, ChevronDown, ChevronRight } from "lucide-react";

export default function MessageBubble({ message, onReply, buttonsDisabled }) {
  const [showThinking, setShowThinking] = useState(false);
  const isBot = message.from === "bot";
  const bubbleClass = message.from === "user" ? "message user" : "message bot";

  // Parse [CALL_ACTION: ...]
  let displayText = message.text || "";
  let actionName = null;
  let actionJson = null;

  if (isBot && message.text && message.text.includes("[CALL_ACTION:")) {
    const parts = message.text.split(/\[CALL_ACTION:\s*(\w+)\]/i);
    if (parts.length >= 3) {
      displayText = parts[0].trim();
      actionName = parts[1];
      actionJson = parts[2].trim();
    }
  }

  return (
    <div className={`message-wrapper ${message.from}`}>
      {isBot && message.thinking && (
        <div className={`thinking-accordion ${showThinking ? "open" : ""}`}>
          <button
            type="button"
            className="thinking-toggle"
            onClick={() => setShowThinking(!showThinking)}
          >
            <Brain size={13} className="icon-orange" />
            <span>Quá trình tư duy của Agent</span>
            {showThinking ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {showThinking && (
            <div className="thinking-content">
              {message.thinking.split("\n").map((line, i) => (
                <div key={i} className="thinking-line">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={bubbleClass}>
        <div className="message-content">
          {displayText.split("\n").map((paragraph, i) => (
            <p key={i} style={{ margin: 0, marginBottom: i < displayText.split("\n").length - 1 ? "8px" : 0 }}>
              {paragraph}
            </p>
          ))}
        </div>

        <ReplyButtons
          buttons={message.buttons}
          onReply={onReply}
          disabled={buttonsDisabled}
        />
      </div>

      {isBot && actionName && (
        <div className="action-callback-card">
          <div className="card-header">
            <Code size={13} className="icon-blue" />
            <span>Kích hoạt Sự kiện (CALL_ACTION)</span>
          </div>
          <div className="card-body">
            <div className="action-tag">
              <Play size={10} fill="currentColor" />
              <span>{actionName}</span>
            </div>
            {actionJson && (
              <pre className="action-json">
                <code>{actionJson}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
