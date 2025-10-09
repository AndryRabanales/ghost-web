"use client";
import { useState } from "react";
import LivesStatus from "./LivesStatus";
import PremiumButton from "./PremiumButton";

export default function DashboardInfo({ creator, dashboardId, onChange }) {
  if (!creator) return <p>Cargando…</p>;

  // Construye la URL pública
  const publicUrl = `${window.location.origin}/u/${creator.publicId}`;

  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div style={{ marginBottom: 20, padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
      <p><strong>Nombre:</strong> {creator.name}</p>
      <p><strong>Dashboard ID:</strong> {dashboardId}</p>

      {/* Sección para compartir el link público */}
      <div style={{ marginTop: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '6px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Tu link público para compartir:</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
          <input type="text" value={publicUrl} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <button onClick={copyToClipboard} style={{ padding: '8px 12px', cursor: 'pointer' }}>
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <LivesStatus creator={creator} />
      <PremiumButton creator={creator} onChange={onChange} />
    </div>
  );
}