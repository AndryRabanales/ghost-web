// src/components/AnonMessageForm.jsx
"use client";
import { useState, useEffect } from "react";
// El resto de los imports...

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function AnonMessageForm({ publicId, onSent }) {
  const [alias, setAlias] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim().length < 3) {
      setErrorMsg("El mensaje debe tener al menos 3 caracteres.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API}/public/${publicId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error enviando el mensaje");

      setStatus("success");
      
      if (data.chatId && data.anonToken) {
        const myChats = JSON.parse(localStorage.getItem("myChats") || "[]");
        const newChatEntry = {
          chatId: data.chatId,
          anonToken: data.anonToken,
          creatorPublicId: publicId,
          preview: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          ts: new Date().toISOString(),
          creatorName: "Conversación",
        };
        const updatedChats = [newChatEntry, ...myChats];
        localStorage.setItem("myChats", JSON.stringify(updatedChats));
      }
      
      setContent("");
      setCharCount(0);
      if (typeof onSent === "function") onSent();

    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };
  
  // ... (toda la sección de estilos y el resto del JSX se mantiene igual)

  // -- Único cambio en el JSX --
  return (
    <>
      {/* ... (el resto del formulario) ... */}
      {status === "success" && (
        <div className="form-element" style={{ padding: '15px', background: 'rgba(46, 204, 113, 0.1)', border: '1px solid #2ECC71', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ margin: 0, color: "#2ECC71", fontWeight: 'bold' }}>✅ ¡Mensaje enviado con éxito!</p>
          <p style={{ marginTop: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            <strong>Importante:</strong> Puedes ver esta y todas tus conversaciones en la lista de abajo o en <a href="/chats" style={{ color: '#58a6ff', fontWeight: 'bold' }}>Mis Chats</a>.
          </p>
        </div>
      )}
      {/* ... (el resto del formulario) ... */}
    </>
  );
}