"use client";
import { useParams } from "next/navigation";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API || "http://localhost:3001";

export default function PublicPage() {
  const { publicId } = useParams();
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, alias, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error enviando mensaje");
      setStatus("Mensaje enviado ✅");
      setAlias("");
      setContent("");
    } catch (err) {
      setStatus("Error enviando mensaje");
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Enviar mensaje</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tu alias (opcional)"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />
        <textarea
          placeholder="Escribe tu mensaje…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: "100%", padding: 10, height: 80 }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
          }}
        >
          Enviar
        </button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
