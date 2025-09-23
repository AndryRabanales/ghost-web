"use client";
import React from 'react';

const API = 'https://ghost-api-2qmr.onrender.com';

export default function CreateRoundButton({ creatorId, onRoundCreated }) {
  const handleCreateRound = async () => {
    try {
      const res = await fetch(`${API}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }), // 👈 pasa aquí tu id de creador
      });
      if (!res.ok) throw new Error('Error al crear ronda');
      const round = await res.json();
      if (onRoundCreated) onRoundCreated(round);
      alert(`Nueva ronda creada con id: ${round.id}`);
    } catch (err) {
      console.error(err);
      alert('No se pudo crear la ronda');
    }
  };

  return (
    <button
      onClick={handleCreateRound}
      style={{
        marginBottom: '20px',
        padding: '10px 20px',
        backgroundColor: '#2196f3',
        color: '#fff',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
      }}
    >
      ➕ Crear nueva ronda
    </button>
  );
}
