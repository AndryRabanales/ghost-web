"use client";
import LivesStatus from "./LivesStatus";
import PremiumButton from "./PremiumButton";

export default function DashboardInfo({ creator, dashboardId, onChange }) {
  if (!creator) return <p>Cargando…</p>;

  return (
    <div style={{ marginBottom: 20 }}>
      <p><strong>Nombre:</strong> {creator.name}</p>
      <p><strong>Dashboard ID:</strong> {dashboardId}</p>

      <LivesStatus creator={creator} />

      {/* Botón premium sincronizado */}
      <PremiumButton onChange={onChange} />
    </div>
  );
}
