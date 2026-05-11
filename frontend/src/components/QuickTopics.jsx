export default function QuickTopics({ topics, onSelect, apiStatus, isSending, error }) {
  const statusLabel = {
    online: "API online",
    offline: "API offline",
    unknown: "API unknown",
  }[apiStatus];

  return (
    <section className="panel">
      <div className="panel-card">
        <h2>Quick topics</h2>
        <p className="muted">
          Tap a topic to send a message. Replies come from the backend webhook.
        </p>
        <div className="chips">
          {topics.map((topic) => (
            <button
              key={topic}
              className="chip"
              type="button"
              onClick={() => onSelect(topic)}
              disabled={isSending}
            >
              {topic}
            </button>
          ))}
        </div>

        <div className="status-line">
          <span className={`status-pill ${apiStatus}`}>{statusLabel}</span>
          <span className="status-text">{isSending ? "Sending..." : "Ready"}</span>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}
      </div>
    </section>
  );
}
