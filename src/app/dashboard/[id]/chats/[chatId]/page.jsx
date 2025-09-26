"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function ChatPage() {
  const params = useParams();
  const dashboardId = params.id;       // id del creador
  const chatId = params.chatId;        // id del chat

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}/dashboard/chats/${chatId}`);
      if (!res.ok) {
        console.error('Error al cargar mensajes', res.status);
        return;
      }
      const data = await res.json();
      if (data && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error en fetchMessages:', err);
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [chatId, dashboardId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    try {
      await fetch(`${API}/dashboard/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMsg, dashboardId }), // opcional enviar dashboardId
      });
      setNewMsg('');
      fetchMessages();
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>Chat con anónimo</h1>
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: 8,
          padding: 10,
          height: 400,
          overflowY: 'auto',
        }}
      >
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
