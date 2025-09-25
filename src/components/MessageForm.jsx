"use client";
import React, { useState } from "react";

const API = "https://ghost-api-2qmr.onrender.com";

export default function MessageForm({ onMessageSent }) {
  const [content, setContent] = useState("");
  const [alias, setAlias] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, userId: "anon", alias }),
      });
      const data = await res.json();
      console.log("Respuesta del servidor:", res.status, data);

      if (!res.ok) throw new Error(data.error || "Error al enviar mensaje");

      setContent("");
      setAlias("");
      onMessageSent?.();
    } catch (err) {
      console.error("Error en handleSubmit:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <input
        type="text"
        placeholder="Tu alias (opcional)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 12,
          borderRadius: 4,
          border: "1px solid #ccc",
        }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu mensaje aquí..."
        style={{ width: "100%", height: 80, padding: 10 }}
      />
      <button
        type="submit"
        style={{
          marginTop: 10,
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Enviar mensaje
      </button>
    </form>
  );
}
