"use client";
import { useState } from "react";

export default function MessageForm() {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://ghost-api-2qmr.onrender.com/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      setStatus(`Mensaje enviado con id ${data.id}`);
      setContent("");
    } catch (err) {
      console.error(err);
      setStatus("Error al enviar");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Enviar mensaje anónimo</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu mensaje aquí"
          rows={4}
          style={{ width: "100%", padding: "0.5rem" }}
        />
        <button type="submit" style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
          Enviar
        </button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
