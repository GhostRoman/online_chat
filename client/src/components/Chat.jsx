import React, { useState, useEffect } from "react";
import axios from "axios";
import MessageList from "./MessageList";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          "https://chat-1-7buy.onrender.com/api/messages",
        );
        setMessages(response.data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();

    const socket = new WebSocket("ws://localhost:10000");
    socket.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      if (messageData.type === "new") {
        setMessages((prev) => [...prev, messageData.data]);
      } else if (messageData.type === "history") {
        setMessages(messageData.data);
      } else if (messageData.type === "delete") {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageData.id));
      }
    };

    setWs(socket);

    return () => socket.close();
  }, []);

  const handleSendMessage = async () => {
    if (content.trim() === "") return;

    try {
      await axios.post("https://chat-1-7buy.onrender.com/api/messages", {
        content,
      });

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(content);
      }

      setContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      await axios.delete(`https://chat-1-7buy.onrender.com/api/messages/${id}`);
      setMessages((prev) => prev.filter((msg) => msg._id !== id));

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "delete", id }));
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  return (
    <div style={styles.chatContainer}>
      <h2 style={styles.title}>💬 Chat Room</h2>
      <MessageList messages={messages} onDelete={handleDeleteMessage} />
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
        />
        <button onClick={handleSendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
};

// Добавляем объект стилей
const styles = {
  chatContainer: {
    maxWidth: "800px", // увеличиваем максимальную ширину
    width: "90%", // адаптируем ширину под экран
    height: "80vh", // высота составляет 80% от высоты экрана
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#1f1f2e",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    color: "#fff",
    fontSize: "24px",
    textAlign: "center",
    marginBottom: "20px",
  },
  inputContainer: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  input: {
    flexGrow: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #333",
    backgroundColor: "#333",
    color: "#fff",
    outline: "none",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#4a4aff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
};

export default Chat;
