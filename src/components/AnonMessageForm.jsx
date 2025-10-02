"use client";
import { useState, useEffect } from "react";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function AnonMessageForm({ publicId, onSent }) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [chatUrls, setChatUrls] = useState([]); // múltiples chats guardados
  const [charCount, setCharCount] = useState(0);

  // ======================
  // Cargar chats guardados de localStorage
  // ======================
  useEffect(() => {
    const urls = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`chat_${publicId}_`)) {
        const value = localStorage.getItem(key);
        try {
          const parsed = JSON.parse(value);
          urls.push(parsed);
        } catch {
          // compatibilidad: si era string plano
          urls.push({ url: value, alias: "Anon", createdAt: Date.now() });
        }
      }
    }
    setChatUrls(urls);
  }, [publicId]);

  // ======================
  // Validaciones
  // ======================
  const validateForm = () => {
    if (!content || content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres");
      return false;
    }
    if (alias.length > 20) {
      setErrorMsg("El alias no puede superar 20 caracteres");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  // ======================
  // Submit
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus("loading");

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error enviando mensaje");

      // Reset
      setContent("");
      setAlias("");
      setCharCount(0);
      setStatus("success");

      if (typeof onSent === "function") onSent();

      // Guardar link único
      if (data.chatId && data.anonToken) {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/chats/${data.anonToken}/${data.chatId}`;
        const key = `chat_${publicId}_${alias || "anon"}`;

        const chatData = {
          url,
          alias: alias || "Anon",
          createdAt: Date.now(),
        };

        localStorage.setItem(key, JSON.stringify(chatData));

        setChatUrls((prev) =>
          prev.find((c) => c.url === url) ? prev : [...prev, chatData]
        );
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  // ======================
  // Copiar link
  // ======================
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      alert("📋 Link copiado al portapapeles");
    });
  };

  // ======================
  // Render
  // ======================
  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
      <input
        type="text"
        placeholder="Tu alias (opcional, máx 20)"
        value={alias}
        maxLength={20}
        onChange={(e) => setAlias(e.target.value)}
        style={{
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 6,
          fontSize: 14,
        }}
      />

      <textarea
        placeholder="Escribe tu mensaje anónimo..."
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setCharCount(e.target.value.length);
        }}
        required
        minLength={3}
        style={{
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 6,
          minHeight: 100,
          fontSize: 14,
        }}
      />
      <div style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
        {charCount}/500
      </div>

      {errorMsg && <p style={{ color: "red" }}>⚠️ {errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "10px 20px",
          backgroundColor: status === "loading" ? "#999" : "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: status === "loading" ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {status === "loading" ? "Enviando..." : "Enviar mensaje"}
      </button>

      {/* feedback */}
      {status === "success" && (
        <p style={{ color: "green" }}>✅ Mensaje enviado con éxito</p>
      )}
      {status === "error" && (
        <p style={{ color: "red" }}>❌ Error: {errorMsg || "intenta de nuevo"}</p>
      )}

      {/* chats guardados */}
      {chatUrls.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontWeight: "bold" }}>📌 Tus chats guardados:</p>
          <ul style={{ paddingLeft: 20, listStyle: "square" }}>
            {chatUrls.map((chat, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                <a
                  href={chat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0070f3", textDecoration: "underline" }}
                >
                  {chat.alias} – {new Date(chat.createdAt).toLocaleString()}
                </a>{" "}
                <button
                  type="button"
                  onClick={() => copyToClipboard(chat.url)}
                  style={{
                    marginLeft: 8,
                    padding: "2px 6px",
                    fontSize: 12,
                    background: "#eee",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Copiar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
