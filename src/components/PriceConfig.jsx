// src/components/PriceConfig.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
// ✅ CAMBIO APLICADO: Mínimo ajustado a 20 pesos
const MIN_PRICE_PESOS = 20;

// Icono para el input
const MoneyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

export default function PriceConfig({ creator, onChange }) {
    const [priceInPesos, setPriceInPesos] = useState(MIN_PRICE_PESOS);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (creator?.baseTipAmountCents) {
            setPriceInPesos(creator.baseTipAmountCents / 100);
        }
    }, [creator]);

    const handlePriceChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setPriceInPesos(value === '' ? '' : Number(value));
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus(null);

        const priceInCents = Number(priceInPesos) * 100;

        if (priceInPesos < MIN_PRICE_PESOS) {
            setStatus({ type: 'error', message: `El precio mínimo es $${MIN_PRICE_PESOS} MXN.` });
            setLoading(false);
            return;
        }

        try {
            let res = await fetch(`${API}/creators/${creator.id}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ baseTipAmountCents: priceInCents }),
            });

            if (res.status === 401) {
                const newToken = await refreshToken(localStorage.getItem("publicId"));
                if (newToken) {
                    res = await fetch(`${API}/creators/${creator.id}/settings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(newToken) },
                        body: JSON.stringify({ baseTipAmountCents: priceInCents }),
                    });
                }
            }

            if (!res.ok) throw new Error("Error al guardar el precio.");

            const data = await res.json();
            setStatus({ type: 'success', message: '¡Precio actualizado!' });

            if (onChange) {
                onChange({ ...creator, baseTipAmountCents: data.baseTipAmountCents });
            }

        } catch (err) {
            setStatus({ type: 'error', message: err.message || "Error de red." });
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    return (
        <div className="premium-contract-config-container" style={{borderTop: '1px solid var(--border-color-faint)', paddingTop: '20px'}}>
            <h3 style={{fontSize: '1.1em', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '10px'}}>
                💰 Precio Base por Mensaje
            </h3>

            <p className="contract-guide-text" style={{fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 15px'}}>
                Establece el precio mínimo (en pesos) que debe pagar un anónimo para enviarte un mensaje. (Mínimo ${MIN_PRICE_PESOS} MXN).
            </p>

            <div className="contract-input-wrapper" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <div className="balance-icon" style={{
                    color: 'var(--glow-accent-crimson)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '12px',
                    borderRadius: '50%',
                    display: 'flex'
                }}>
                    <MoneyIcon />
                </div>

                <input
                    type="number"
                    min={MIN_PRICE_PESOS}
                    step="1"
                    value={priceInPesos}
                    onChange={handlePriceChange}
                    disabled={loading}
                    placeholder={`Mínimo ${MIN_PRICE_PESOS}`}
                    className="form-input-field contract-input"
                    style={{flexGrow: 1}}
                />

                <button 
                    onClick={handleSave} 
                    disabled={loading || Number(priceInPesos) < MIN_PRICE_PESOS} 
                    className="submit-button"
                    style={{
                        minWidth: '150px',
                        padding: '10px 20px',
                        border: 'none',
                        backgroundColor: loading || Number(priceInPesos) < MIN_PRICE_PESOS ? '#8a6bb3' : '#503382',
                        color: '#fff',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: loading || Number(priceInPesos) < MIN_PRICE_PESOS ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading && Number(priceInPesos) >= MIN_PRICE_PESOS) {
                            e.target.style.backgroundColor = '#3f2868';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(80, 51, 130, 0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!loading && Number(priceInPesos) >= MIN_PRICE_PESOS) {
                            e.target.style.backgroundColor = '#503382';
                        }
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                >
                    {loading ? 'Guardando...' : 'Guardar'}
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