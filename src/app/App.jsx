"use client";
import React, { useEffect, useState } from "react";
import MessageForm from "./components/MessageForm";
import MessageList from "./components/MessageList";
import CreateRoundButton from "./components/CreateRoundButton";

const API = "https://ghost-api-2qmr.onrender.com";

function App() {
  const [messages, setMessages] = useState([]);
  const [roundId, setRoundId] = useState(null);
  const [loading, setLoading] = useState(true);
  const creatorId = "andry"; // tu id creador

  // Obtener la ronda activa al montar
  useEffect(() => {
    getCurrentRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentRound = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/rounds/current/${creatorId}`);
      if (!res.ok) throw new Error("Error al obtener ronda actual");
      const round = await res.json();
      if (round && round.id) {
        setRoundId(round.id);
      } else {
        setRoundId(null);
      }
    } catch (err) {
      console.error(err);
      setRoundId(null);
    } finally {
      setLoading(false);
    }
  };

  // Cargar mensajes cuando tengo roundId
  useEffect(() => {
    if (roundId) {
      fetchMessages(roundId);
    } else {
      setMessages([]); // limpiar mensajes si no hay ronda
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  const fetchMessages = async (rid) => {
    try {
      const res = await fetch(`${API}/messages/${rid}`);
      if (!res.ok) throw new Error("Error al obtener mensajes");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Error actualizando estado");
      if (roundId) fetchMessages(roundId);
    } catch (err) {
      console.error(err);
    }
  };

  // Cuando se cree una ronda manualmente, refrescar estado
  const handleRoundCreated = (round) => {
    if (round && round.id) {
      setRoundId(round.id);
      fetchMessages(round.id);
    }
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>Cargando...</p>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      {/* Botón para crear ronda */}
      <CreateRoundButton creatorId={creatorId} onRoundCreated={handleRoundCreated} />

      {roundId ? (
        <>
          <MessageForm
            roundId={roundId}
            onMessageSent={() => fetchMessages(roundId)}
          />
          <MessageList messages={messages} onStatusChange={handleStatusChange} />
        </>
      ) : (
        <p style={{ padding: "20px", textAlign: "center" }}>
          No hay ronda activa actualmente. Pulsa el botón para crear una nueva.
        </p>
      )}
    </div>
  );
}

export default App;
