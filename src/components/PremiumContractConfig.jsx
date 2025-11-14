// src/components/PremiumContractConfig.jsx
"use client";
import React, { useState } from 'react';
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const MAX_LENGTH_CONTRACT = 120; // Límite para el contrato
const MAX_LENGTH_TOPIC = 100; // Límite para el nuevo campo de tema

export default function PremiumContractConfig({ creator, onChange }) {
  // --- MODIFICADO: Añadido estado para la preferencia de tema ---
  const [contract, setContract] = useState(creator.premiumContract || "Respuesta de alta calidad.");
  const [topic, setTopic] = useState(creator.topicPreference || "Cualquier mensaje respetuoso y constructivo.");
  // --- FIN DE MODIFICACIÓN ---
  const [loadingContract, setLoadingContract] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [statusContract, setStatusContract] = useState(null);
  const [statusTopic, setStatusTopic] = useState(null);

  const handleSave = async (field) => {
    let loadingSetter, statusSetter, value, endpoint, successMessage, creatorKey;

    if (field === 'contract') {
        loadingSetter = setLoadingContract;
        statusSetter = setStatusContract;
        value = contract;
        endpoint = `${API}/creators/${creator.id}/update-contract`;
        successMessage = 'Contrato de Servicio actualizado.';
        creatorKey = 'premiumContract';
    } else if (field === 'topic') {
        loadingSetter = setLoadingTopic;
        statusSetter = setStatusTopic;
        value = topic;
        endpoint = `${API}/creators/${creator.id}/update-topic`; // Ruta nueva
        successMessage = 'Filtro de Temas actualizado.';
        creatorKey = 'topicPreference';
    }

    if (!loadingSetter) return;

    loadingSetter(true);
    statusSetter(null);

    try {
      let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ [creatorKey]: value }),
      });

      // Lógica de refresh si el token expiró
      if (res.status === 401) {
        const newToken = await refreshToken(localStorage.getItem("publicId"));
        if (newToken) {
          res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders(newToken) },
            body: JSON.stringify({ [creatorKey]: value }),
          });
        }
      }

      if (!res.ok) throw new Error("Error al guardar la configuración.");

      statusSetter({ type: 'success', message: successMessage });
      
      // Actualizar el estado del creador en el componente padre
      if (onChange) {
        onChange({ ...creator, [creatorKey]: value });
      }

    } catch (err) {
      statusSetter({ type: 'error', message: err.message || "Error de red." });
    } finally {
      loadingSetter(false);
      setTimeout(() => statusSetter(null), 3000);
    }
  };

  return (
    <div className="premium-contract-config-container">
      
      {/* 1. SECCIÓN DE CONTRATO (Garantía de Calidad) */}
      <h3 style={{fontSize: '1.2em', fontWeight: '700', margin: '0 0 10px', color: 'var(--text-primary)'}}>
        📜 Contrato de Servicio (S3)
      </h3>
      <p className="contract-guide-text">Define lo que **garantizas** en tu respuesta de texto. (El envío de fotos/PDF no está disponible en esta versión).</p>
      
      <div className="contract-input-wrapper">
        <input
          type="text"
          value={contract}
          onChange={(e) => setContract(e.target.value.slice(0, MAX_LENGTH_CONTRACT))}
          disabled={loadingContract}
          placeholder="Ej: Una respuesta detallada de al menos 100 caracteres."
          className="form-input-field contract-input"
        />
        <div className="char-count" style={{ color: contract.length > MAX_LENGTH_CONTRACT - 20 ? '#ff7b7b' : 'var(--text-secondary)' }}>
          {contract.length} / {MAX_LENGTH_CONTRACT}
        </div>
      </div>

      <button 
        onClick={() => handleSave('contract')} 
        disabled={loadingContract || contract.trim().length < 5} 
        className="submit-button" // <--- CAMBIO DE CLASE
        style={{marginTop: '10px', width: '100%'}} // <--- CAMBIO DE ESTILO
      >
        {loadingContract ? 'Guardando...' : 'Guardar Contrato'}
      </button>

      {statusContract && (
        <p className={`contract-status ${statusContract.type === 'error' ? 'auth-error' : 'form-status-message success'}`} style={{textAlign: 'center', marginTop: '15px'}}>
          {statusContract.message}
        </p>
      )}

      {/* --- 👇 2. NUEVA SECCIÓN DE FILTRO DE TEMA (E4) 👇 --- */}
      <div style={{borderTop: '1px solid var(--border-color-faint)', paddingTop: '20px', marginTop: '30px'}}>
        <h3 style={{fontSize: '1.2em', fontWeight: '700', margin: '0 0 10px', color: 'var(--text-primary)'}}>
            🤖 Filtro de Relevancia (E4)
        </h3>
        <p className="contract-guide-text" style={{fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 15px'}}>
            Describe el tipo de mensajes que más te interesan. La IA usará esto solo para permitir ese tipo de mensajes!
        </p>

        <div className="contract-input-wrapper">
            <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, MAX_LENGTH_TOPIC))}
            disabled={loadingTopic}
            placeholder="Ej: Quiero recibir mensajes de apoyo o consejos de negocios."
            className="form-input-field contract-input"
            />
            <div className="char-count" style={{ color: topic.length > MAX_LENGTH_TOPIC - 10 ? '#ff7b7b' : 'var(--text-secondary)' }}>
            {topic.length} / {MAX_LENGTH_TOPIC}
            </div>
        </div>

        <button 
            onClick={() => handleSave('topic')} 
            disabled={loadingTopic || topic.trim().length < 5} 
            className="submit-button" // <--- CAMBIO DE CLASE
            style={{marginTop: '10px', width: '100%'}} // <--- CAMBIO DE ESTILO
        >
            {loadingTopic ? 'Guardando...' : 'Guardar Tema'}
        </button>
        
        {statusTopic && (
            <p className={`contract-status ${statusTopic.type === 'error' ? 'auth-error' : 'form-status-message success'}`} style={{textAlign: 'center', marginTop: '15px'}}>
            {statusTopic.message}
            </p>
        )}
      </div>
      {/* --- 👆 FIN DE NUEVA SECCIÓN 👆 --- */}
    </div>
  );
}