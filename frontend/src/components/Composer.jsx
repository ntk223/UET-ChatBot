import { useState } from "react";
import { Rocket, SendHorizontal } from "lucide-react";

export default function Composer({ onSend, onStart, isSending, isEmpty }) {
  const [draft, setDraft] = useState("");
  const canSend = draft.trim().length > 0 && !isSending;

  if (isEmpty) {
    return (
      <div className="composer">
        <button
          className="flex-align"
          type="button"
          onClick={onStart}
          disabled={isSending}
          style={{ width: "auto", margin: "0 auto", padding: "12px 24px" }}
        >
          <Rocket size={16} />
          <span>Bắt đầu tư vấn</span>
        </button>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    onSend(trimmed);
    setDraft("");
  };

  return (
    <div className="composer">
      <input
        type="text"
        placeholder="Nhập câu hỏi hoặc chọn từ các nút gợi ý..."
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSend();
          }
        }}
        disabled={isSending}
      />
      <button
        className="flex-align"
        type="button"
        onClick={handleSend}
        disabled={!canSend}
      >
        <SendHorizontal size={16} />
        <span>Gửi</span>
      </button>
    </div>
  );
}
