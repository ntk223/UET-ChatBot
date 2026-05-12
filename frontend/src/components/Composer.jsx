import { useState } from "react";

export default function Composer({ onSend, onStart, isSending, isEmpty }) {
  const [draft, setDraft] = useState("");
  const canSend = draft.trim().length > 0 && !isSending;

  if (isEmpty) {
    return (
      <div className="composer">
        <button type="button" onClick={onStart} disabled={isSending}>
          Start
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
        placeholder="Type a message"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSend();
          }
        }}
        disabled={isSending}
      />
      <button type="button" onClick={handleSend} disabled={!canSend}>
        Send
      </button>
    </div>
  );
}
