"use client";
import React, { useState } from 'react';

const API = 'https://ghost-api-2qmr.onrender.com'; // 👈 backend de Render

export default function MessageForm({ onMessageSent }) {
  const [content, setContent] = useState('');
  const [alias, setAlias] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: 'anon', // o null si no usas userId
          alias,
        }),
      });

      const data = await res.json();
      console.log('Respuesta del servidor:', res.status, data);

      if (!res.ok) throw new Error(data.error || 'Error al enviar mensaje');

      setContent('');
      setAlias('');

      if (onMessageSent) onMessageSent();
    } catch (err) {
      console.error('Error en handleSubmit:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
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
