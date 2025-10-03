"use client";
import { useEffect, useState } from "react";

export default function WsTest() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 🔌 Conectarse al backend (ajusta la URL a tu Render)
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_API?.replace(/^http/, "ws")}/ws/chat?chatId=${chatId}`
    );
    

    ws.onopen = () => console.log("✅ Conectado al WebSocket");
    ws.onmessage = (event) => {
      console.log("📩 Mensaje del servidor:", event.data);
      setMessages((prev) => [...prev, event.data]);
    };
    ws.onclose = () => console.log("❌ Conexión cerrada");

    setSocket(ws);

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (socket && input.trim() !== "") {
      socket.send(input);
      setInput("");
    }
  };

  return (
    <div>
      <h2>Prueba de WebSocket</h2>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Escribe un mensaje..."
      />
      <button onClick={sendMessage}>Enviar</button>

      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
