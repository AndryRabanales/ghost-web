"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://api.ghostmsg.space";

export default function ReplyPage() {
  const params = useParams();
  const token = params.token;
  const [content, setContent] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    await fetch(`${API}/messages/reply/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setContent("");
    alert("Respuesta enviada");
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Responder con token</h1>
      <form onSubmit={handleSend}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu respuesta"
          style={{ width: "100%", height: 80, padding: 10 }}
        />
        <button type="submit" style={{ marginTop: 8 }}>Enviar</button>
      </form>
    </div>
  );
}
