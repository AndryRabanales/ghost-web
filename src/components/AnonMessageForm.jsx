// src/components/AnonMessageForm.jsx
"use client";
import { useState, useEffect } from "react";

const API =
  process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function AnonMessageForm({ publicId, onSent }) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [lastChat, setLastChat] = useState(null); // Para mostrar el último chat creado

  const validateForm = () => {
    if (!content || content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres.");
      return false;
    }
    if (alias.length > 20) {
      setErrorMsg("El alias no puede superar los 20 caracteres.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus("loading");
    setLastChat(null); // Limpiamos el chat anterior

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error enviando el mensaje");

      setStatus("success");
      
      if (data.chatUrl) {
        const newChat = {
          url: data.chatUrl,
          alias: alias || "Anónimo",
          createdAt: Date.now(),
        };
        // Guardamos en localStorage para persistencia
        const key = `chat_${publicId}_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(newChat));
        setLastChat(newChat);
      }
      
      // Limpiamos el formulario después de un éxito
      setContent("");
      setAlias("");
      setCharCount(0);

      // Opcional: notificar al componente padre
      if (typeof onSent === "function") onSent();

    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, marginTop: '20px' }}>
      <input
        type="text"
        placeholder="Tu alias (opcional, máx 20)"
        value={alias}
        maxLength={20}
        onChange={(e) => setAlias(e.target.value)}
        style={{
          padding: '12px',
          border: '1px solid #ccc',
          borderRadius: 8,
          fontSize: 16,
        }}
      />

      <div style={{ position: 'relative' }}>
        <textarea
          placeholder="Escribe tu mensaje anónimo..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setCharCount(e.target.value.length);
          }}
          required
          minLength={3}
          maxLength={500}
          style={{
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: 8,
            minHeight: 120,
            fontSize: 16,
            width: '100%',
            boxSizing: 'border-box',
            resize: 'vertical',
          }}
        />
        <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 12, color: charCount > 500 ? 'red' : '#666' }}>
          {charCount}/500
        </div>
      </div>
      
      {errorMsg && status === 'error' && <p style={{ color: "red", margin: 0 }}>⚠️ {errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "12px 24px",
          backgroundColor: status === "loading" ? "#ccc" : "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: status === "loading" ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: '16px',
          transition: 'background-color 0.2s ease',
        }}
      >
        {status === "loading" ? "Enviando..." : "Enviar Mensaje"}
      </button>

      {status === "success" && (
        <div style={{ padding: '15px', background: 'rgba(47, 187, 70, 0.1)', border: '1px solid #2FBB46', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, color: "#2FBB46", fontWeight: 'bold' }}>✅ ¡Mensaje enviado con éxito!</p>
          {lastChat && (
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              Guarda el link de tu chat para ver las respuestas: <a href={lastChat.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3' }}>Ver mi chat</a>
            </p>
          )}
        </div>
      )}
    </form>
  );
}