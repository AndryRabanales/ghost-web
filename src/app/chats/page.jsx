"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { timeAgo } from "@/utils/timeAgo"; // Importamos tu helper de tiempo

// Icono para "Ver"
const IconVer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

// Icono para "Nuevo"
const IconResponder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

// Componente de la lista de chats
export default function MyChatsPage() {
  const [chats, setChats] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Recuperar chats guardados en localStorage
    const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
    // Ordenar por fecha (ts) descendente
    stored.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    setChats(stored);
  }, []);

  return (
    // Usamos el contenedor de la página de autenticación para centrar
    <div className="auth-container">
      <div className="chats-list-section" style={{ width: '100%', maxWidth: '600px', marginTop: 0 }}>
        <h1 className="chats-list-title">Mis Mensajes Enviados</h1>
        
        {/* Botón para volver a la página principal */}
        <div className="create-space-link-container" style={{ animationDelay: '0s', marginTop: '0', marginBottom: '25px' }}>
          <Link href="/" className="create-space-link">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z"/>
            </svg>
            Enviar un nuevo mensaje
          </Link>
        </div>

        {chats.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Aún no has enviado ningún mensaje.
          </p>
        ) : (
          <div className="chats-list-grid">
            {chats.map((chat) => (
              <Link
                key={chat.chatId}
                href={`/chats/${chat.anonToken}/${chat.chatId}`}
                passHref
                legacyBehavior>
                {/* Aplicamos las clases CSS de tu globals.css */}
                <a className={`chat-list-item ${chat.hasNewReply ? 'new-reply' : ''}`}>
                  <div className="chat-list-item-main">
                    <div className="chat-list-item-alias">
                      Chat con {chat.creatorName}
                      {chat.hasNewReply && <span className="new-reply-indicator">¡NUEVO!</span>}
                    </div>
                    <div className="chat-list-item-content">
                      {chat.preview}
                    </div>
                    <div className="chat-list-item-date">
                      {timeAgo(chat.ts)}
                    </div>
                  </div>
                  <button className="chat-list-item-button">
                    {chat.hasNewReply ? <IconResponder /> : <IconVer />}
                    {chat.hasNewReply ? "Ver Respuesta" : "Ver Chat"}
                  </button>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}