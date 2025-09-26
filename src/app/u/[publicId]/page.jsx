"use client";
import { useParams } from "next/navigation";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API;

export default function PublicPage() {
  const { publicId } = useParams();
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, alias, publicId }),
      });
      if (!res.ok) throw new Error("Error al enviar mensaje");
      setContent("");
      setAlias("");
      setSent(true);
    } catch (err) {
      console.error(err);
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
          placeholder="Tu mensaje..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
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
          }}
        >
          Enviar
        </button>
      </form>
      {sent && <p style={{ marginTop: 10 }}>¡Mensaje enviado!</p>}
    </div>
  );
}
