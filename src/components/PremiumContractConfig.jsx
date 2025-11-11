// src/components/PremiumContractConfig.jsx
"use client";
import React, { useState } from 'react';
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const MAX_LENGTH = 120; // Límite de caracteres para el contrato

export default function PremiumContractConfig({ creator, onChange }) {
  const [contract, setContract] = useState(creator.premiumContract || "Respuesta de alta calidad.");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);

    try {
      let res = await fetch(`${API}/creators/${creator.id}/update-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ premiumContract: contract }),
      });

      // Lógica de refresh si el token expiró
      if (res.status === 401) {
        const newToken = await refreshToken(localStorage.getItem("publicId"));
        if (newToken) {
          res = await fetch(`${API}/creators/${creator.id}/update-contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders(newToken) },
            body: JSON.stringify({ premiumContract: contract }),
          });
        }
      }

      if (!res.ok) throw new Error("Error al guardar el contrato.");

      setStatus({ type: 'success', message: 'Contrato actualizado.' });
      
      // Actualizar el estado del creador en el componente padre
      if (onChange) {
        onChange({ ...creator, premiumContract: contract });
      }

    } catch (err) {
      setStatus({ type: 'error', message: err.message || "Error de red." });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="premium-contract-config-container">
      <h3>📜 Contrato de Servicio Premium (S3)</h3>
      <p className="contract-guide-text">Define lo que garantizas en tu respuesta Premium (máximo {MAX_LENGTH} caracteres).</p>
      
      <div className="contract-input-wrapper">
        <input
          type="text"
          value={contract}
          onChange={(e) => setContract(e.target.value.slice(0, MAX_LENGTH))}
          disabled={loading}
          placeholder="Ej: Recibirás 1 foto exclusiva y 50 caracteres de texto."
          className="form-input-field contract-input"
        />
        <div className="char-count" style={{ color: contract.length > MAX_LENGTH - 20 ? '#ff7b7b' : 'var(--text-secondary)' }}>
          {contract.length} / {MAX_LENGTH}
        </div>
      </div>

      <button onClick={handleSave} disabled={loading || contract.trim().length < 5} className="save-contract-button">
        {loading ? 'Guardando...' : 'Guardar Contrato'}
      </button>

      {status && (
        <p className={`contract-status ${status.type}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}