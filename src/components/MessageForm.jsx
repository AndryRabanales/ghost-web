"use client";
import React, { useState } from 'react';

const API = 'https://ghost-api-2qmr.onrender.com';

export default function MessageForm({ onMessageSent }) {
  const [content, setContent] = useState('');
  const [alias, setAlias] = useState(''); // 👈 estado para alias

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      // 👇 envía alias junto con el mensaje
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: 'anon',
          alias,
        }),
      });

      if (!res.ok) throw new Error('Error al enviar mensaje');

      setContent('');
      setAlias('');

      if (onMessageSent) onMessageSent();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      {/* input para alias */}
      <input
        type="text"
        placeholder="Tu alias (opcional)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '12px',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      />

      {/* textarea para mensaje */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu mensaje aquí..."
        style={{ width: '100%', height: '80px', padding: '10px' }}
      />

      <button
        type="submit"
        style={{
          marginTop: '10px',
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Enviar mensaje
      </button>
    </form>
  );
}
