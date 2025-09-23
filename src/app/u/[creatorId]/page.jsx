"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = "https://ghost-api-2qmr.onrender.com";

export default function PublicPredictionsPage() {
  // Obtenemos el creatorId de la URL (ej: /u/andry)
  const params = useParams();
  const creatorId = params?.creatorId;

  const [roundId, setRoundId] = useState(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Al cargar, buscamos la ronda actual del creatorId
  useEffect(() => {
    const loadRound = async () => {
      try {
        const res = await fetch(`${API}/rounds/current/${creatorId}`);
        const round = await res.json();
        if (round?.id) setRoundId(round.id);
      } catch (e) {
        setErrorMsg("No se pudo obtener la ronda. Intenta más tarde.");
      }
    };
    if (creatorId) loadRound();
  }, [creatorId]);

  const submitPrediction = async (e) => {
    e.preventDefault();
    if (!content.trim() || !roundId) return;
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, roundId }),
      });
      if (!res.ok) throw new Error("Error enviando predicción");
      setStatus("sent");
      setContent("");
    } catch (err) {
      setStatus("error");
      setErrorMsg("No pudimos enviar tu predicción. Inténtalo de nuevo.");
    }
  };

  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>
        Haz tu predicción para {creatorId || "..."}
      </h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Escribe una predicción: <i>“Hoy vas a…”</i> o <i>“Mañana estarás…”</i>
      </p>

      {!roundId && !errorMsg && <p>Cargando…</p>}
      {errorMsg && <p style={{ color: "tomato" }}>{errorMsg}</p>}

      {roundId && (
        <form onSubmit={submitPrediction}>
          <textarea
            placeholder="Hoy vas a…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
          <button
            disabled={status === "sending" || !content.trim()}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#22c55e",
              color: "#fff",
              border: 0,
              cursor: "pointer",
            }}
          >
            {status === "sending" ? "Enviando…" : "Enviar predicción"}
          </button>
          {status === "sent" && (
            <p style={{ marginTop: 10 }}>
              ✅ ¡Predicción enviada! Revisa la story mañana para ver si acertaste 👀
            </p>
          )}
        </form>
      )}
    </main>
  );
}
