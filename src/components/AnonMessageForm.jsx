"use client";
import { useState, useEffect } from "react";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function AnonMessageForm({ publicId }) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState(null);
  const [chatUrls, setChatUrls] = useState([]); // 👈 ahora manejamos múltiples

  // 🔄 Revisar todos los chats guardados en localStorage
  useEffect(() => {
    const urls = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`chat_${publicId}_`)) {
        urls.push(localStorage.getItem(key));
      }
    }
    setChatUrls(urls);
  }, [publicId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error enviando mensaje");

      setContent("");
      setAlias("");
      setStatus("success");

      // 👇 Construir link único con alias y guardarlo
      if (data.chatId && data.anonToken) {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/chats/${data.anonToken}/${data.chatId}`;
        const key = `chat_${publicId}_${alias || "anon"}`;

        localStorage.setItem(key, url);

        setChatUrls((prev) =>
          prev.includes(url) ? prev : [...prev, url] // evitar duplicados
        );
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <input
        type="text"
        placeholder="Tu alias (opcional)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
      />

      <textarea
        placeholder="Escribe tu mensaje anónimo..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        style={{
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 6,
          minHeight: 100,
        }}
      />

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {status === "loading" ? "Enviando..." : "Enviar mensaje"}
      </button>

      {status === "success" && (
        <p style={{ color: "green" }}>✅ Mensaje enviado con éxito</p>
      )}
      {status === "error" && (
        <p style={{ color: "red" }}>❌ Error al enviar el mensaje</p>
      )}

      {chatUrls.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontWeight: "bold" }}>📌 Tus chats guardados:</p>
          <ul style={{ paddingLeft: 20 }}>
            {chatUrls.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0070f3", textDecoration: "underline" }}
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
