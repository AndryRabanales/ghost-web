// src/components/TopicConfig.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://api.ghostmsg.space";

const TopicIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

export default function TopicConfig({ creator, onChange }) {
    const [topic, setTopic] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (creator?.topicPreference) {
            setTopic(creator.topicPreference);
        }
    }, [creator]);

    const handleSave = async () => {
        setLoading(true);
        setStatus(null);

        if (!topic.trim()) {
            setStatus({ type: 'error', message: 'El tema no puede estar vacío.' });
            setLoading(false);
            return;
        }

        try {
            let res = await fetch(`${API}/creators/${creator.id}/update-topic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ topicPreference: topic }),
            });

            if (res.status === 401) {
                const newToken = await refreshToken(localStorage.getItem("publicId"));
                if (newToken) {
                    res = await fetch(`${API}/creators/${creator.id}/update-topic`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(newToken) },
                        body: JSON.stringify({ topicPreference: topic }),
                    });
                }
            }

            if (!res.ok) throw new Error("Error al guardar el tema.");

            const data = await res.json();
            setStatus({ type: 'success', message: '¡Tema actualizado!' });

            if (onChange) {
                onChange({ ...creator, topicPreference: topic });
            }

        } catch (err) {
            setStatus({ type: 'error', message: err.message || "Error de red." });
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    return (
        <div className="premium-contract-config-container" style={{ borderBottom: '1px solid var(--border-color-faint)', paddingBottom: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1em', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '10px' }}>
                🎯 Filtro de IA / Tema
            </h3>

            <p className="contract-guide-text" style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 15px' }}>
                Define qué tipo de mensajes quieres recibir. La IA usará esto para filtrar el spam o mensajes fuera de contexto.
            </p>

            <div className="contract-input-wrapper" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="balance-icon" style={{
                    color: 'var(--glow-accent-crimson)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '12px',
                    borderRadius: '50%',
                    display: 'flex'
                }}>
                    <TopicIcon />
                </div>

                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={loading}
                    placeholder="Ej: Solo preguntas sobre tecnología..."
                    className="form-input-field contract-input"
                    style={{ flexGrow: 1 }}
                />

                <button
                    onClick={handleSave}
                    disabled={loading || !topic.trim()}
                    className="submit-button"
                    style={{
                        minWidth: '100px',
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: loading ? '#8a6bb3' : '#503382',
                        color: '#fff',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    {loading ? '...' : 'Guardar'}
                </button>
            </div>

            {status && (
                <p
                    className={`contract-status ${status.type === 'error' ? 'auth-error' : 'form-status-message success'}`}
                    style={{
                        textAlign: 'center',
                        marginTop: '15px',
                        color: status.type === 'error' ? '#ff7b7b' : 'var(--success-solid)'
                    }}
                >
                    {status.message}
                </p>
            )}
        </div>
    );
}