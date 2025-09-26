"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API;

export default function PublicPage() {
  const { publicId } = useParams();
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, alias, publicId }),
      });
      if (!res.ok) throw new Error("Error enviando mensaje");
      setOk(true);
      setContent("");
      setAlias("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Enviar mensaje</h1>
      {ok && <p style={{ color: "green" }}>Mensaje enviado 🎉</p>}
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
          placeholder="Escribe tu mensaje aquí..."
          style={{ width: "100%", height: "80px", padding: 10 }}
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
