"use client";
import { useEffect, useState } from "react";

export default function MessageList() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch("https://ghost-api-2qmr.onrender.com/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Mensajes recibidos</h2>
      <ul>
        {messages.map((m) => (
          <li key={m.id}>
            <strong>{new Date(m.createdAt).toLocaleString()}:</strong> {m.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
