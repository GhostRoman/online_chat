require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const { WebSocketServer } = require("ws");
const { Pool } = require("pg");
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then(() => {
    console.log("Connected to the db");
  })
  .catch((err) => {
    console.error("Error connecting to the database", err);
  });

// Create messages table if it doesn't exist
pool
  .query(
    `
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`,
  )
  .then(() => console.log("Messages table created or already exists"))
  .catch((err) => console.error("Error creating messages table", err));

app.use(express.json());

app.get("/api/messages", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY created_at ASC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }
    const result = await pool.query(
      "INSERT INTO messages (content) VALUES ($1) RETURNING *",
      [content],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to post message" });
  }
});

app.delete("/api/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM messages WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.status(200).json({ message: "Message deleted successfully", id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

wss.on("connection", (ws) => {
  console.log("The client has connected");

  pool
    .query("SELECT * FROM messages ORDER BY created_at ASC")
    .then((result) => {
      ws.send(JSON.stringify({ type: "history", data: result.rows }));
    })
    .catch((err) => console.error("Error fetching messages", err));

  ws.on("message", async (message) => {
    console.log("Received:", message);

    if (!message || message.toString().trim() === "") {
      ws.send(
        JSON.stringify({
          type: "error",
          data: "Message content cannot be empty",
        }),
      );
      return;
    }

    try {
      const result = await pool.query(
        "INSERT INTO messages (content) VALUES ($1) RETURNING *",
        [message.toString()],
      );
      const newMessage = result.rows[0];

      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "new", data: newMessage }));
        }
      });
    } catch (err) {
      console.error("Error saving message", err);
    }
  });

  ws.on("close", () => {
    console.log("The client has been disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

const port = process.env.PORT || 10000;

server.listen(port, () => {
  console.log(`The server is running on port ${port}`);
});
