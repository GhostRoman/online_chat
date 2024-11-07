import React from "react";

const MessageList = ({ messages, onDelete }) => {
  return (
    <div style={styles.messageList}>
      {messages.map((message) => (
        <div key={message._id} style={styles.message}>
          <div style={styles.messageContent}>{message.content}</div>
          <div style={styles.messageTimestamp}>
            {new Date(message.createdAt).toLocaleString()}
          </div>
          <button
            onClick={() => onDelete(message._id)}
            style={styles.deleteButton}
          >
            🗑️
          </button>
        </div>
      ))}
    </div>
  );
};

const styles = {
  messageList: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "10px",
    backgroundColor: "#2a2a3d",
    borderRadius: "8px",
    border: "1px solid #333",
    marginBottom: "10px",
  },
  message: {
    padding: "12px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #373b4a, #292a3a)",
    color: "#fff",
    marginBottom: "10px",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.3)",
    position: "relative",
  },
  messageContent: {
    fontSize: "15px",
    color: "#e0e0e0",
  },
  messageTimestamp: {
    fontSize: "12px",
    color: "#9a9a9a",
    textAlign: "right",
    marginTop: "6px",
  },
  deleteButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "transparent",
    border: "none",
    color: "#ff6b6b",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default MessageList;
