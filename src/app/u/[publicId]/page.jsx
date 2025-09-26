"use client";
import { useParams } from "next/navigation";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API;

export default function PublicPage() {
  const { publicId } = useParams();
  const [content, setContent] = useState("");
  const [alias, setAlias] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, alias, publicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error enviando mensaje");
      setContent("");
      setAlias("");
      alert("Mensaje enviado!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Enviar un mensaje</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tu alias (opcional)"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />
        <textarea
          placeholder="Escribe tu mensaje"
          value={content}
          onChange={(e) => setContent(e.target.value)}
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
          Enviar
        </button>
      </form>
    </div>
  );
}
