"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API;

export default function PublicPage({ params }) {
  const { publicId } = params;
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, alias, publicId }),
    });
    const data = await res.json();
    if (res.ok) {
      setAlias("");
      setContent("");
      alert("Mensaje enviado");
    } else {
      alert(data.error || "Error enviando mensaje");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Envía un mensaje</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tu alias (opcional)"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu mensaje..."
          style={{ width: "100%", height: 80, padding: 10 }}
        />
        <button
          type="submit"
          style={{
            marginTop: "10px",
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
    </div>
  );
}
