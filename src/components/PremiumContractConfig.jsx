// src/components/PremiumContractConfig.jsx
"use client";
import React, { useState } from 'react';
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const MAX_LENGTH_CONTRACT = 120; // Límite para el contrato
const MAX_LENGTH_TOPIC = 100; // Límite para el nuevo campo de tema

export default function PremiumContractConfig({ creator, onChange }) {
  const [contract, setContract] = useState(creator.premiumContract || "Respuesta de alta calidad.");
  const [topic, setTopic] = useState(creator.topicPreference || "Cualquier mensaje respetuoso y constructivo.");
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
        successMessage = 'Contrato actualizado.';
        creatorKey = 'premiumContract';
    } else if (field === 'topic') {
        loadingSetter = setLoadingTopic;
        statusSetter = setStatusTopic;
        value = topic;
        endpoint = `${API}/creators/${creator.id}/update-topic`;
        successMessage = 'Tema actualizado.';
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

      if (!res.ok) throw new Error("Error al guardar.");

      statusSetter({ type: 'success', message: successMessage });
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
      
      {/* 1. SECCIÓN DE CONTRATO (COMPACTA) */}
      <h3 style={{fontSize: '1em', fontWeight: '700', margin: '0 0 5px', color: 'var(--text-primary)'}}>
        📜 Contrato de Servicio (S3)
      </h3>
      <p className="contract-guide-text" style={{fontSize: '13px', margin: '0 0 10px', color: 'var(--text-secondary)'}}>
        Define tu garantía de respuesta.
      </p>
      
      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
        <input
          type="text"
          value={contract}
          onChange={(e) => setContract(e.target.value.slice(0, MAX_LENGTH_CONTRACT))}
          disabled={loadingContract}
          placeholder="Ej: Respuesta detallada."
          className="form-input-field"
          style={{flexGrow: 1, padding: '8px 12px', fontSize: '14px'}}
        />
        <button 
          onClick={() => handleSave('contract')} 
          disabled={loadingContract || contract.trim().length < 5} 
          className="submit-button"
          style={{flexShrink: 0, padding: '8px 16px', fontSize: '14px', margin: 0}}
        >
          {loadingContract ? '...' : 'Guardar'}
        </button>
      </div>
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', minHeight: '18px'}}>
        {statusContract ? (
          <p className={`contract-status ${statusContract.type === 'error' ? 'auth-error' : 'form-status-message success'}`} style={{margin: 0, fontSize: '12px'}}>
            {statusContract.message}
          </p>
        ) : <span></span>}
        <div className="char-count" style={{fontSize: '12px', color: contract.length > MAX_LENGTH_CONTRACT - 20 ? '#ff7b7b' : 'var(--text-secondary)' }}>
          {contract.length} / {MAX_LENGTH_CONTRACT}
        </div>
      </div>

      {/* 2. SECCIÓN DE FILTRO DE TEMA (COMPACTA) */}
      <div style={{borderTop: '1px solid var(--border-color-faint)', paddingTop: '15px', marginTop: '15px'}}>
        <h3 style={{fontSize: '1em', fontWeight: '700', margin: '0 0 5px', color: 'var(--text-primary)'}}>
            🤖 Filtro de Relevancia (E4)
        </h3>
        <p className="contract-guide-text" style={{fontSize: '13px', margin: '0 0 10px', color: 'var(--text-secondary)'}}>
            Describe tu tema de interés (IA bloqueará lo irrelevante).
        </p>

        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, MAX_LENGTH_TOPIC))}
            disabled={loadingTopic}
            placeholder="Ej: Consejos de negocios."
            className="form-input-field"
            style={{flexGrow: 1, padding: '8px 12px', fontSize: '14px'}}
            />
            <button 
              onClick={() => handleSave('topic')} 
              disabled={loadingTopic || topic.trim().length < 5} 
              className="submit-button"
              style={{flexShrink: 0, padding: '8px 16px', fontSize: '14px', margin: 0}}
            >
              {loadingTopic ? '...' : 'Guardar'}
            </button>
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', minHeight: '18px'}}>
          {statusTopic ? (
            <p className={`contract-status ${statusTopic.type === 'error' ? 'auth-error' : 'form-status-message success'}`} style={{margin: 0, fontSize: '12px'}}>
              {statusTopic.message}
            </p>
          ) : <span></span>}
          <div className="char-count" style={{fontSize: '12px', color: topic.length > MAX_LENGTH_TOPIC - 10 ? '#ff7b7b' : 'var(--text-secondary)' }}>
            {topic.length} / {MAX_LENGTH_TOPIC}
          </div>
        </div>
      </div>
    </div>
  );
}