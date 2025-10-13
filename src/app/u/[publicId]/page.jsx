// src/app/u/[publicId]/page.jsx
"use client";
import AnonMessageForm from "@/components/AnonMessageForm";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function PublicPage() {
  // Obtiene el 'publicId' de la URL de forma segura
  const params = useParams();
  const publicId = params.publicId;

  const [myChats, setMyChats] = useState([]);
  const router = useRouter();

  // Función para cargar los chats guardados en el navegador
  const loadChats = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
      // Muestra solo los chats de la página actual
      const relevantChats = stored.filter(chat => chat.creatorPublicId === publicId);
      relevantChats.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      setMyChats(relevantChats);
    } catch (error) {
      console.error("Error al cargar chats:", error);
      setMyChats([]);
    }
  };

  // Carga los chats cuando el componente se monta
  useEffect(() => {
    if (publicId) {
      loadChats();
    }
  }, [publicId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const pageStyles = `
    @keyframes gradient-pan {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .page-container {
      background: linear-gradient(-45deg, #0b021a, #1d103b, #2c1a5c, #3c287c);
      background-size: 400% 400%;
      animation: gradient-pan 15s ease infinite;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      padding-top: 5vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      <div className="page-container">
        <div style={{ maxWidth: 480, width: '100%' }}>
          <h1 style={{
            textAlign: 'center', marginBottom: '40px', fontSize: '32px',
            color: '#fff', fontWeight: 700, textShadow: '0 0 15px rgba(255, 255, 255, 0.3)'
          }}>
            Envíame un mensaje anónimo
          </h1>

          {/* =============================================== */}
          {/* AQUÍ ESTÁ EL FORMULARIO QUE FALTABA          */}
          {/* =============================================== */}
          <AnonMessageForm publicId={publicId} onSent={loadChats} />

          {/* =============================================== */}
          {/* Y AQUÍ ESTÁ LA LISTA DE CHATS PENDIENTES    */}
          {/* =============================================== */}
          {myChats.length > 0 && (
            <div style={{ marginTop: '50px' }}>
              <h2 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px', marginBottom: '20px', fontSize: '22px' }}>
                Tus Chats Anteriores
              </h2>
              <div style={{ display: "grid", gap: 12 }}>
                {myChats.map((chat) => (
                  <div
                    key={chat.chatId}
                    className="chat-item"
                    style={{ animation: 'none' }}
                    onClick={() => router.push(`/chats/${chat.anonToken}/${chat.chatId}`)}
                  >
                    <div className="chat-item-main">
                      <div className="chat-item-alias">{chat.creatorName || "Anónimo"}</div>
                      <div className="chat-item-content">"{chat.preview}"</div>
                      <div className="chat-item-date" style={{fontSize: '12px'}}>{formatDate(chat.ts)}</div>
                    </div>
                    <button className="chat-item-button">Abrir</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}