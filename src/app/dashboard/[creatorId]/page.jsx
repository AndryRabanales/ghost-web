"use client";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageList from "@/components/MessageList";
import CreateRoundButton from "@/components/CreateRoundButton";

const API = "https://ghost-api-2qmr.onrender.com";

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [roundId, setRoundId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatorId, setCreatorId] = useState(null);

  // Generar o recuperar creatorId único
  useEffect(() => {
    let stored = localStorage.getItem("creatorId");
    if (!stored) {
      stored = uuidv4();
      localStorage.setItem("creatorId", stored);
    }
    setCreatorId(stored);
  }, []);

  // Cargar ronda actual
  useEffect(() => {
    if (creatorId) getCurrentRound(creatorId);
  }, [creatorId]);

  const getCurrentRound = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/rounds/current/${id}`);
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

  // Cargar mensajes (visibles + bloqueados)
  const fetchMessages = async (rid) => {
    try {
      const res = await fetch(`${API}/messages/${rid}`);
      const data = await res.json();

      const unlocked = data.visible || [];
      const locked = data.locked || [];

      // combinamos ambos con flag isLocked
      const combined = [
        ...unlocked.map((m) => ({ ...m, isLocked: false })),
        ...locked.map((m) => ({ ...m, isLocked: true })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setMessages(combined);
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

  if (loading || !creatorId) return <p style={{ padding: 20 }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <p>
        Tu link público:{" "}
        <a href={`/u/${creatorId}`}>
          {typeof window !== "undefined"
            ? `${window.location.origin}/u/${creatorId}`
            : `/u/${creatorId}`}
        </a>
      </p>

      <CreateRoundButton
        creatorId={creatorId}
        onRoundCreated={handleRoundCreated}
      />

      {roundId ? (
        <MessageList
          messages={messages}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <p style={{ padding: 20, textAlign: "center" }}>
          No hay ronda activa actualmente. Pulsa el botón para crear una nueva.
        </p>
      )}
    </div>
  );
}
