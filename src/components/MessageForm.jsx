"use client";
import React, { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageForm({ publicId, onMessageSent }) {
  const [content, setContent] = useState('');
  const [alias, setAlias] = useState('');
  const [chatUrl, setChatUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await fetch(`${API}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId, content, alias }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando chat');

      // Guardar/ordenar chats del anónimo en localStorage
      const stored = JSON.parse(localStorage.getItem('myChats') || '[]');
      const entry = {
        anonToken: data.anonToken,
        chatId: data.chatId,
        chatUrl: data.chatUrl,
        preview: content.slice(0, 80),
        ts: Date.now(),
      };
      const next = [entry, ...stored.filter(c => c.chatId !== data.chatId)];
      localStorage.setItem('myChats', JSON.stringify(next));

      setChatUrl(data.chatUrl);
      setContent('');
      setAlias('');

      if (onMessageSent) onMessageSent();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <input
        type="text"
        placeholder="Tu alias (opcional)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu mensaje aquí..."
        style={{ width: '100%', height: 80, padding: 10 }}
      />
      <button
        type="submit"
        style={{ marginTop: 10, padding: '10px 20px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        Enviar mensaje
      </button>

      {chatUrl && (
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 6 }}>
            ✅ Chat abierto. Guarda este link para seguir la conversación:
          </p>
          <a href={chatUrl}>{chatUrl}</a>
          <p style={{ marginTop: 6 }}>
            También puedes ver todos tus chats en: <a href="/chats">/chats</a>
          </p>
        </div>
      )}
    </form>
  );
}
