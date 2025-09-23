"use client";
import React from 'react';

export default function MessageList({ messages, onStatusChange }) {
  if (!messages || messages.length === 0) {
    return <p>No hay predicciones todavía en esta ronda.</p>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '15px' }}>Predicciones recibidas</h2>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            border: '1px solid #ccc',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '5px',
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>{new Date(msg.createdAt).toLocaleString()}:</strong>{' '}
            {msg.content}
          </p>
          <p style={{ margin: '5px 0' }}>Estado: {msg.status}</p>

          {/* Botones para cambiar estado */}
          <button
            onClick={() => onStatusChange(msg.id, 'FULFILLED')}
            style={{
              padding: '5px 10px',
              marginRight: '10px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            ✅ Cumplida
          </button>
          <button
            onClick={() => onStatusChange(msg.id, 'NOT_FULFILLED')}
            style={{
              padding: '5px 10px',
              backgroundColor: '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            ❌ No cumplida
          </button>
        </div>
      ))}
    </div>
  );
}
