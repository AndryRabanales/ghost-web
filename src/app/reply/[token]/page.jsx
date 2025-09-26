"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-2qmr.onrender.com";

export default function ReplyPage() {
  const { token } = useParams();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [lastCount, setLastCount] = useState(0);

  // refs para auto-scroll
  const listRef = useRef(null);
  const lastItemRef = useRef(null);

  const fetchMessage = async () => {
    try {
      const res = await fetch(`${API}/messages/reply/${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error cargando mensaje");

      // si hay más respuestas que antes, notifica y luego haremos scroll
      if (message && data.responses.length > lastCount) {
        setNotification("¡Hay nuevas respuestas!");
        setTimeout(() => setNotification(null), 4000);
      }

      setLastCount(data.responses.length);
      setMessage(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMessage();
      const interval = setInterval(fetchMessage, 10000); // cada 10s
      return () => clearInterval(interval);
    }
  }, [token]);

  // Cuando cambie el número de respuestas, baja hasta la última
  useEffect(() => {
    if (!message || !message.responses) return;
    if (message.responses.length > 0) {
      // dar un pequeño delay para asegurar que el DOM se pintó
      setTimeout(() => {
        if (lastItemRef.current) {
          lastItemRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [message?.responses?.length]);

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;
  if (!message) return <p style={{ padding: 20 }}>No se encontró el mensaje.</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      {notification && (
        <div
          style={{
            backgroundColor: "#4CAF50",
            color: "#fff",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          {notification}
        </div>
      )}

      <h1>Tu mensaje</h1>
      <p style={{ margin: 0, color: "#444" }}>
        <strong>Alias:</strong> {message.alias || "Anónimo"}
      </p>
      <p style={{ marginTop: 4, color: "#000" }}>{message.content}</p>

      <h2 style={{ marginTop: 20 }}>Respuestas</h2>

      <div
        ref={listRef}
        style={{
          maxHeight: 400,
          overflowY: "auto",
          paddingRight: 6,
          borderRadius: 8,
        }}
      >
        {message.responses && message.responses.length > 0 ? (
          message.responses.map((r, idx) => {
            const isLast = idx === message.responses.length - 1;
            return (
              <div
                key={r.id}
                ref={isLast ? lastItemRef : null}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p style={{ margin: 0 }}>{r.content}</p>
              </div>
            );
          })
        ) : (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            Aún no hay respuesta. Vuelve más tarde.
          </p>
        )}
      </div>
    </div>
  );
}
