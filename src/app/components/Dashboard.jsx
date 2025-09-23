"use client";
import React, { useState, useEffect } from "react";

const API = "https://ghost-api-2qmr.onrender.com";

export default function Dashboard() {
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [messages, setMessages] = useState([]);

  // cargar rondas al montar
  useEffect(() => {
    fetch(`${API}/rounds`)
      .then((r) => r.json())
      .then(setRounds)
      .catch(console.error);
  }, []);

  // cargar mensajes cuando cambia la ronda seleccionada
  useEffect(() => {
    if (selectedRound) {
      fetch(`${API}/messages/${selectedRound}`)
        .then((r) => r.json())
        .then(setMessages)
        .catch(console.error);
    }
  }, [selectedRound]);

  // crear una ronda nueva
  const createRound = async () => {
    const res = await fetch(`${API}/rounds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId: "andry" }), // tu id creador
    });
    const round = await res.json();
    setRounds([round, ...rounds]);
  };

  // marcar mensaje
  const updateStatus = async (id, status) => {
    const res = await fetch(`${API}/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setMessages(messages.map((m) => (m.id === id ? updated : m)));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard de Predicciones</h1>

      <button onClick={createRound}>➕ Crear nueva ronda</button>

      <h2 style={{ marginTop: 20 }}>Rondas</h2>
      {rounds.map((r) => (
        <div key={r.id} style={{ marginBottom: 5 }}>
          <button onClick={() => setSelectedRound(r.id)}>
            {r.date.slice(0, 10)} - {r.status}
          </button>
        </div>
      ))}

      {selectedRound && (
        <div style={{ marginTop: 30 }}>
          <h2>Mensajes de la ronda {selectedRound}</h2>
          {messages.length === 0 && <p>No hay mensajes en esta ronda.</p>}
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                marginBottom: 10,
                borderRadius: 5,
              }}
            >
              <p>
                <strong>{new Date(m.createdAt).toLocaleString()}:</strong>{" "}
                {m.content}
              </p>
              <p>Estado: {m.status}</p>
              <button onClick={() => updateStatus(m.id, "FULFILLED")}>
                ✅ Cumplida
              </button>
              <button
                onClick={() => updateStatus(m.id, "NOT_FULFILLED")}
                style={{ marginLeft: 10 }}
              >
                ❌ No cumplida
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
