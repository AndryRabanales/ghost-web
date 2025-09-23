"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MessageForm from "@/components/MessageForm";
import MessageList from "@/components/MessageList";
import CreateRoundButton from "@/components/CreateRoundButton";

const API = "https://ghost-api-2qmr.onrender.com";

export default function DashboardPage() {
  const params = useParams();
  const creatorId = params?.creatorId;

  const [messages, setMessages] = useState([]);
  const [roundId, setRoundId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener ronda actual cuando hay creatorId
  useEffect(() => {
    if (creatorId) getCurrentRound(creatorId);
  }, [creatorId]);

  const getCurrentRound = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/rounds/current/${id}`);
      if (!res.ok) throw new Error("Error al obtener ronda actual");
      const round = await res.json();
      if (round?.id) setRoundId(round.id);
      else setRoundId(null);
    } catch (err) {
      console.error(err);
      setRoundId(null);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (roundId) fetchMessages(roundId);
    else setMessages([]);
  }, [roundId]);

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`${API}/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (roundId) fetchMessages(roundId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoundCreated = (round) => {
    if (round?.id) {
      setRoundId(round.id);
      fetchMessages(round.id);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Dashboard de {creatorId}</h1>
      <p>
        Tu link público para predicciones:{" "}
        <a href={`/u/${creatorId}`}>
          {typeof window !== "undefined"
            ? `${window.location.origin}/u/${creatorId}`
            : `/u/${creatorId}`}
        </a>
      </p>

      <CreateRoundButton creatorId={creatorId} onRoundCreated={handleRoundCreated} />

      {roundId ? (
        <>
          <MessageList messages={messages} onStatusChange={handleStatusChange} />
        </>
      ) : (
        <p style={{ padding: 20, textAlign: "center" }}>
          No hay ronda activa actualmente. Pulsa el botón para crear una nueva.
        </p>
      )}
    </div>
  );
}
