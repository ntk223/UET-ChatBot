export default function ReplyButtons({ buttons, onReply, disabled }) {
  if (!buttons || buttons.length === 0) {
    return null;
  }

  return (
    <div className="reply-buttons">
      {buttons.map((button, index) => (
        <button
          key={`${button.title}-${index}`}
          className="reply-button"
          type="button"
          onClick={() => onReply?.(button)}
          disabled={disabled}
        >
          {button.title}
        </button>
      ))}
    </div>
  );
}
