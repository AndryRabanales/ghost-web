// src/components/PriceConfig.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { getAuthHeaders, refreshToken } from "@/utils/auth";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const MIN_PRICE_PESOS = 100;

// Icono para el input
const MoneyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

export default function PriceConfig({ creator, onChange }) {
    // Estado interno para el input. Lo manejamos en PESOS (ej: 100)
    const [priceInPesos, setPriceInPesos] = useState(MIN_PRICE_PESOS);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    // Cuando el 'creator' carga, actualizamos el estado local
    useEffect(() => {
        if (creator?.baseTipAmountCents) {
            setPriceInPesos(creator.baseTipAmountCents / 100);
        }
    }, [creator]);

    const handlePriceChange = (e) => {
        // Permitir solo números
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
            
            // Actualizar el estado del creador en el componente padre
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
                Establece el precio mínimo (en pesos) que debe pagar un anónimo para enviarte un mensaje. (Mínimo $100 MXN).
            </p>
            
            <div className="contract-input-wrapper" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                {/* Icono de dinero */}
                <div className="balance-icon" style={{
                    color: 'var(--glow-accent-crimson)', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    padding: '12px', 
                    borderRadius: '50%', 
                    display: 'flex'
                }}>
                    <MoneyIcon />
                </div>
                
                {/* Input de Precio */}
                <input
                    type="number" // Cambiado a 'number'
                    min={MIN_PRICE_PESOS}
                    step="1"
                    value={priceInPesos}
                    onChange={handlePriceChange}
                    disabled={loading}
                    placeholder={`Mínimo ${MIN_PRICE_PESOS}`}
                    className="form-input-field contract-input"
                    style={{flexGrow: 1}}
                />
                
                {/* Botón de Guardar */}
                <button 
                    onClick={handleSave} 
                    disabled={loading || Number(priceInPesos) < MIN_PRICE_PESOS} 
                    className="save-contract-button" 
                    style={{minWidth: '100px'}}
                >
                    {loading ? '...' : 'Guardar'}
                </button>
            </div>

            {status && (
                <p className={`contract-status ${status.type === 'error' ? 'auth-error' : 'form-status-message success'}`} style={{
                    textAlign: 'center', 
                    marginTop: '15px', 
                    color: status.type === 'error' ? '#ff7b7b' : 'var(--success-solid)'
                }}>
                    {status.message}
                </p>
            )}
        </div>
    );
}

// Reutilizamos algunas clases de CSS que ya existen
// .premium-contract-config-container
// .contract-guide-text
// .contract-input-wrapper
// .form-input-field
// .save-contract-button