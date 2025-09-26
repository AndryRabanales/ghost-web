"use client";
import React, { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function MessageForm({ publicId }) {
  const [content, setContent] = useState('');
  const [alias, setAlias] = useState('');
  const [chatUrl, setChatUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      // leer chats previos del localStorage
      const stored = JSON.parse(localStorage.getItem('myChats') || '[]');
      // buscamos si ya tenemos un chat abierto para este publicId
      const existing = stored.find(c => c.publicId === publicId);

      if (existing) {
        // si ya existe, mandamos el mensaje a ese chat
        const res = await fetch(`${API}/chats/${existing.anonToken}/${existing.chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, alias }), // enviamos alias también
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Error enviando mensaje');
          return;
        }
        // opcional: actualizar preview del localStorage
        existing.preview = content.slice(0, 80);
        existing.ts = Date.now();
        localStorage.setItem('myChats', JSON.stringify([existing, ...stored.filter(c => c.chatId !== existing.chatId)]));
        setContent('');
      } else {
        // crear chat nuevo
        const res = await fetch(`${API}/chats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId, content, alias }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Error creando chat');
          return;
        }

        const entry = {
          anonToken: data.anonToken,
          chatId: data.chatId,
          chatUrl: data.chatUrl,
          preview: content.slice(0, 80),
          ts: Date.now(),
          publicId,
        };
        const next = [entry, ...stored.filter(c => c.chatId !== data.chatId)];
        localStorage.setItem('myChats', JSON.stringify(next));

        setChatUrl(data.chatUrl);
        setContent('');
        setAlias('');
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      alert("Error al enviar mensaje");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Tu alias (opcional)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: 12 }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu mensaje aquí..."
        style={{ width: '100%', height: 80, padding: 10 }}
      />
      <button type="submit" style={{ marginTop: 10 }}>Enviar mensaje</button>

      {chatUrl && (
        <div style={{ marginTop: 12 }}>
          <p>✅ Chat abierto. Guarda este link para seguir la conversación:</p>
          <a href={chatUrl}>{chatUrl}</a>
          <p>También puedes ver todos tus chats en: <a href="/chats">/chats</a></p>
        </div>
      )}
    </form>
  );
}
