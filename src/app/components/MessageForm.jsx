"use client";
import React, { useState } from 'react';

const API = 'https://ghost-api-2qmr.onrender.com';

export default function MessageForm({ roundId, onMessageSent }) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      // 👇 ahora envía también el roundId
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: 'anon', // puedes poner null o el userId real
          roundId,        // 👈 ronda activa
        }),
      });

      if (!res.ok) throw new Error('Error al enviar mensaje');

      setContent('');
      if (onMessageSent) onMessageSent();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu predicción aquí..."
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
        Enviar predicción
      </button>
    </form>
  );
}
