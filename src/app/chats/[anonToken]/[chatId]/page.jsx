[CONTENIDO DEL ARCHIVO: andryrabanales/ghost-web/ghost-web-492a7fdaff6d2bdce1bfb60bf94d3aa7e7972aa0/src/app/chats/[anonToken]/[chatId]/page.jsx]
// src/app/chats/[anonToken]/[chatId]/page.jsx
"use client";
import React, { useEffect, useState, useRef, useCallback } from "react"; // Añadir useCallback
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

export default function PublicChatPage() {
  const params = useParams();
  const { anonToken, chatId } = params;

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [creatorName, setCreatorName] = useState("Respuesta");
  const [anonAlias, setAnonAlias] = useState("Tú"); // En la vista pública, el anónimo es "Tú"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  // --- Función para marcar como leído ---
  const markChatAsRead = useCallback(() => {
    try {
        const storedChats = JSON.parse(localStorage.getItem("myChats") || "[]");
        const updatedChats = storedChats.map(chat =>
            chat.chatId === chatId && chat.anonToken === anonToken
                ? { ...chat, hasNewReply: false }
                : chat
        );
        localStorage.setItem("myChats", JSON.stringify(updatedChats));
    } catch (e) {
        console.error("Error updating localStorage:", e);
    }
  }, [chatId, anonToken]); // Dependencias: chatId y anonToken

  // Scroll automático al fondo
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
     // Marcar como leído cuando los mensajes cambian (o inicialmente)
     markChatAsRead();
  }, [messages, markChatAsRead]); // Incluir markChatAsRead

  // ... (Recuperar alias y nombre guardados - sin cambios) ...
   useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
    const found = stored.find(
      (c) => c.chatId === chatId && c.anonToken === anonToken
    );
    // Nota: Aquí no establecemos anonAlias porque en esta vista siempre es "Tú"
    if (found?.creatorName) setCreatorName(found.creatorName);
    // if (found?.anonAlias) setAnonAlias(found.anonAlias); <--- Esto no es necesario aquí
  }, [chatId, anonToken]);

  // Función para guardar actualizaciones en localStorage (si es necesario)
   const updateLocalStorage = useCallback((updater) => {
        try {
            const stored = JSON.parse(localStorage.getItem("myChats") || "[]");
            const next = stored.map((c) =>
              c.chatId === chatId && c.anonToken === anonToken ? updater(c) : c
            );
            localStorage.setItem("myChats", JSON.stringify(next));
        } catch (e) {
            console.error("Error updating localStorage:", e);
        }
   }, [chatId, anonToken]);


  // Cargar mensajes iniciales y conectar WebSocket
  useEffect(() => {
    const fetchMessages = async () => {
      // ... (lógica fetchMessages sin cambios, pero usamos updateLocalStorage) ...
      try {
            setError(null);
            const res = await fetch(`${API}/chats/${anonToken}/${chatId}`);
            if (!res.ok) throw new Error("No se pudo cargar el chat");

            const data = await res.json();
            if (Array.isArray(data.messages)) {
              setMessages(data.messages);

              if (data.creatorName) {
                setCreatorName(data.creatorName);
                // Usamos la función para actualizar
                updateLocalStorage((c) => ({ ...c, creatorName: data.creatorName }));
              }
              markChatAsRead();

            } else {
                setMessages([]); // Asegura que messages sea un array
            }
          } catch (err) {
            console.error(err);
            setError("⚠️ Error cargando mensajes");
            setMessages([]); // Asegura que messages sea un array en caso de error
          } finally {
            setLoading(false);
          }
    };

    fetchMessages(); // Carga inicial

    // --- 👇 AQUÍ ESTÁ LA CORRECCIÓN 👇 ---
    // El servidor (websocket.js) espera "anonTokens" (plural)
    const wsUrl = `${API.replace(/^http/, "ws")}/ws?anonTokens=${anonToken}`;
    // --- 👆 FIN DE LA CORRECCIÓN 👆 ---

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

     ws.onopen = () => console.log(`WebSocket conectado (Anónimo) escuchando token: ${anonToken}`);
     ws.onerror = (error) => console.error("WebSocket error:", error);
     ws.onclose = () => console.log(`WebSocket desconectado (Anónimo)`);

    ws.onmessage = (event) => {
      // ... (lógica onmessage sin cambios, pero llama a markChatAsRead) ...
      try {
            const msg = JSON.parse(event.data);
            
            // --- MODIFICACIÓN: Chequeo más simple ---
            // Si el mensaje es de tipo 'message' y es de 'creator', lo añadimos.
            // El backend ya se encarga de enviarlo solo al anonToken correcto.
            if (msg.type === "message" && msg.from === "creator") { 
                setMessages((prev) => {
                    // Evitar duplicados
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                
                // --- 👇 AÑADIDO: Actualizar localStorage con la nueva respuesta 👇 ---
                updateLocalStorage((c) => ({
                  ...c,
                  hasNewReply: true,
                  preview: msg.content.length > 50 ? msg.content.substring(0, 47) + '...' : msg.content,
                  ts: msg.createdAt
                }));
                // --- 👆 FIN AÑADIDO 👆 ---

                // Marcar como leído si la ventana está activa
                if (document.visibilityState === 'visible') {
                    markChatAsRead();
                }
            }
        } catch (e) {
            console.error("Error procesando WebSocket:", e);
        }
    };

    // Limpieza
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, anonToken, updateLocalStorage]); // Incluir updateLocalStorage

  // Enviar mensaje
  const handleSend = async (e) => {
    // ... (lógica handleSend sin cambios) ...
    e.preventDefault();
        if (!newMsg.trim()) return;
        const tempMsg = newMsg;
        setNewMsg(""); // Limpia input inmediatamente
        try {
          const res = await fetch(`${API}/chats/${anonToken}/${chatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: tempMsg }),
          });
          if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || "No se pudo enviar el mensaje");
          }
          // No necesitamos añadir el mensaje aquí, esperamos al WebSocket
        } catch (err) {
          console.error(err);
          setError("⚠️ No se pudo enviar el mensaje. Intenta de nuevo.");
          setNewMsg(tempMsg); // Restaurar si falla
        }
  };

   // Componente Message (adaptado para esta vista)
   const Message = ({ msg, creatorName }) => {
        const isCreator = msg.from === "creator";
        const senderName = isCreator ? creatorName : "Tú"; // Anónimo siempre es "Tú" aquí

        return (
             // Alineación: Creador a la izquierda ('anon'), Anónimo a la derecha ('creator')
            <div className={`message-bubble-wrapper ${isCreator ? 'anon' : 'creator'}`}>
              <div>
                  <div className="message-alias">{senderName}</div>
                   {/* Estilo: Creador gris ('anon'), Anónimo púrpura ('creator') */}
                  <div className={`message-bubble ${isCreator ? 'anon' : 'creator'}`}>
                      {msg.content}
                  </div>
              </div>
            </div>
        );
    };

  if (loading) return <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando chat…</p>;

  return (
    // Reutilizamos clases de la vista unificada si es posible
    <div className="public-chat-view" style={{ maxWidth: 600, margin: "40px auto", padding: 20, height: 'auto', maxHeight: 'none' }}>
      <div className="chat-view-header">
           <h1>Chat con {creatorName}</h1>
           {/* Puedes añadir un botón para volver a la lista si quieres */}
           {/* <button onClick={() => router.back()} className="back-button">← Volver</button> */}
      </div>

      <div className="messages-display">
        {/* ... (renderizado de mensajes y error sin cambios) ... */}
        {error && <p style={{ color: "red", textAlign: 'center' }}>{error}</p>}
        {messages.length === 0 && !loading && (
              <div style={{ color: "#666", textAlign: "center", padding: '20px' }}>
                Aún no hay mensajes. ¡Envía el primero!
              </div>
        )}
         {messages.map((m) => (
             <Message key={m.id || Math.random()} msg={m} creatorName={creatorName} />
         ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="chat-reply-form">
         {/* ... (input y botón sin cambios) ... */}
         <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="form-input-field reply-input" // Reutilizar estilos
            />
            <button
              type="submit"
              className="submit-button reply-button" // Reutilizar estilos
              disabled={!newMsg.trim()}
            >
              Enviar
            </button>
      </form>
    </div>
  );
}