// src/components/PremiumContractConfig.jsx
"use client";
import React, { useState } from 'react';
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const MAX_LENGTH_CONTRACT = 120;
const MAX_LENGTH_TOPIC = 100;

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
        successMessage = 'Contrato de Servicio actualizado.';
        creatorKey = 'premiumContract';
    } else if (field === 'topic') {
        loadingSetter = setLoadingTopic;
        statusSetter = setStatusTopic;
        value = topic;
        endpoint = `${API}/creators/${creator.id}/update-topic`;
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

      if (onChange) onChange({ ...creator, [creatorKey]: value });

    } catch (err) {
      statusSetter({ type: 'error', message: err.message || "Error de red." });
    } finally {
      loadingSetter(false);
      setTimeout(() => statusSetter(null), 3000);
    }
  };

  return (
    <div className="premium-contract-config-container">
      
      {/* SECCIÓN CONTRATO */}
      <h3 style={{fontSize: '1.2em', fontWeight: '700', margin: '0 0 10px', color: 'var(--text-primary)'}}>
        📜 Contrato de Servicio (S3)
      </h3>
      <p className="contract-guide-text">
        Define lo que <b>garantizas</b> en tu respuesta de texto.
      </p>

      <div className="contract-input-wrapper">
        <input
          type="text"
          value={contract}
          onChange={(e) => setContract(e.target.value.slice(0, MAX_LENGTH_CONTRACT))}
          disabled={loadingContract}
          placeholder="Ej: Una respuesta detallada de al menos 100 caracteres."
          className="form-input-field contract-input"
        />
        <div className="char-count" style={{
          color: contract.length > MAX_LENGTH_CONTRACT - 20 ? '#ff7b7b' : 'var(--text-secondary)'
        }}>
          {contract.length} / {MAX_LENGTH_CONTRACT}
        </div>
      </div>

      {/* ✅ BOTÓN GUARDAR CONTRATO CON DISEÑO */}
      <button 
        onClick={() => handleSave('contract')} 
        disabled={loadingContract || contract.trim().length < 5} 
        className="save-contract-button"
        style={{
          marginTop: '10px',
          minWidth: '150px',
          padding: '10px 20px',
          border: 'none',
          backgroundColor: loadingContract || contract.trim().length < 5 ? '#d4b5e0' : '#b794f4',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '14px',
          cursor: loadingContract || contract.trim().length < 5 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          if (!loadingContract && contract.trim().length >= 5) {
            e.target.style.backgroundColor = '#a67dd9';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(183, 148, 244, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loadingContract && contract.trim().length >= 5) {
            e.target.style.backgroundColor = '#b794f4';
          }
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}
      >
        {loadingContract ? 'Guardando...' : 'Guardar Contrato'}
      </button>

      {statusContract && (
        <p className={`contract-status ${statusContract.type === 'error' ? 'auth-error' : 'form-status-message success'}`} 
           style={{textAlign: 'center', marginTop: '15px'}}>
          {statusContract.message}
        </p>
      )}

      {/* SECCIÓN TEMA */}
      <div style={{borderTop: '1px solid var(--border-color-faint)', paddingTop: '20px', marginTop: '30px'}}>
        <h3 style={{fontSize: '1.2em', fontWeight: '700', margin: '0 0 10px', color: 'var(--text-primary)'}}>
            🤖 Filtro de Relevancia (E4)
        </h3>

        <p className="contract-guide-text" style={{fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 15px'}}>
            Describe el tipo de mensajes que más te interesan.
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
          <div className="char-count" style={{
            color: topic.length > MAX_LENGTH_TOPIC - 10 ? '#ff7b7b' : 'var(--text-secondary)'
          }}>
            {topic.length} / {MAX_LENGTH_TOPIC}
          </div>
        </div>

        {/* ✅ BOTÓN GUARDAR TEMA CON DISEÑO */}
        <button 
          onClick={() => handleSave('topic')} 
          disabled={loadingTopic || topic.trim().length < 5} 
          className="save-contract-button"
          style={{
            marginTop: '10px',
            minWidth: '150px',
            padding: '10px 20px',
            border: 'none',
            backgroundColor: loadingTopic || topic.trim().length < 5 ? '#d4b5e0' : '#b794f4',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: loadingTopic || topic.trim().length < 5 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            if (!loadingTopic && topic.trim().length >= 5) {
              e.target.style.backgroundColor = '#a67dd9';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(183, 148, 244, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loadingTopic && topic.trim().length >= 5) {
              e.target.style.backgroundColor = '#b794f4';
            }
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          {loadingTopic ? 'Guardando...' : 'Guardar Tema'}
        </button>

        {statusTopic && (
          <p className={`contract-status ${statusTopic.type === 'error' ? 'auth-error' : 'form-status-message success'}`} 
             style={{textAlign: 'center', marginTop: '15px'}}>
            {statusTopic.message}
          </p>
        )}
      </div>
    </div>
  );
}