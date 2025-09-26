"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function ChatPage() {
  const params = useParams();
  // En tu ruta es /dashboard/[id]/chats/[chatId]
  const dashboardId = params.id; 
  const chatId = params.chatId;

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/chats/${chatId}?dashboardId=${dashboardId}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Auto-refresh cada 5s
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [chatId, dashboardId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    await fetch(`${API}/dashboard/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newMsg }),
    });

    setNewMsg('');
    fetchMessages();
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>Chat con anónimo</h1>
      <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 10, height: 400, overflowY: 'auto' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <strong>{m.from === 'creator' ? 'Tú:' : 'Anónimo:'}</strong> {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ marginTop: 10 }}>
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Escribe tu respuesta..."
          style={{ width: '100%', padding: 10 }}
        />
        <button type="submit" style={{ marginTop: 8 }}>Enviar</button>
      </form>
    </div>
  );
}
