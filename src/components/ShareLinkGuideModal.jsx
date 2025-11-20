// src/components/ShareLinkGuideModal.jsx
"use client";
import React, { useEffect, useState } from 'react';

// --- ESTILOS ---
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 12, 34, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    opacity: 0,
    animation: 'fadeInOverlay 0.5s forwards',
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
};

const modalContentStyle = {
    background: 'linear-gradient(145deg, #1a1a2e, #2c1a5c)',
    padding: '30px 35px',
    borderRadius: '24px',
    border: '1px solid rgba(142, 45, 226, 0.3)',
    maxWidth: '420px',
    width: '90%',
    textAlign: 'center',
    color: 'var(--text-primary, #f5f5f5)',
    boxShadow: '0 15px 50px rgba(0, 0, 0, 0.6)',
    transform: 'translateY(20px) scale(0.95)',
    opacity: 0,
    animation: 'popUpModal 0.6s 0.1s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

const titleStyle = {
    fontSize: '24px',
    fontWeight: '800', // Más peso para impacto
    color: '#fff',
    marginBottom: '10px',
    textShadow: '0 0 10px rgba(201, 164, 255, 0.5)'
};

const textStyle = {
    color: 'rgba(235, 235, 245, 0.8)',
    lineHeight: 1.6,
    fontSize: '15px',
    marginBottom: '15px',
};

const linkInputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '12px',
    padding: '10px',
    marginTop: '20px',
    marginBottom: '20px',
    border: '1px solid rgba(142, 45, 226, 0.3)', // Borde sutil morado
};

const linkInputStyle = {
    flexGrow: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: '14px',
    padding: '5px',
    whiteSpace: 'nowrap',
    overflowX: 'scroll',
    scrollbarWidth: 'none',
    MsOverflowStyle: 'none',
    fontFamily: 'monospace'
};

const scrollbarHideStyle = `
  .link-input-scroll::-webkit-scrollbar {
    display: none;
  }
`;

const copyButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#c9a4ff', // Acento
    fontSize: '13px',
    fontWeight: '700',
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    whiteSpace: 'nowrap'
};

const copyButtonHoverStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: '#c9a4ff',
    transform: 'translateY(-1px)'
};

const buttonStyle = {
    marginTop: '25px',
    padding: '14px 30px',
    background: 'linear-gradient(90deg, #8e2de2, #4a00e0)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: '800',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.3s ease',
    boxShadow: '0 5px 15px rgba(74, 0, 224, 0.4)',
    width: '100%'
};

// --- COMPONENTE ---
export default function ShareLinkGuideModal({ onClose, publicLink }) {
    const [copyText, setCopyText] = useState('Copiar');

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(publicLink);
            setCopyText('¡Listo!');
            setTimeout(() => setCopyText('Copiar'), 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
            setCopyText('Error');
        }
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                
                {/* TÍTULO DE NEGOCIO, NO DE APP */}
                <h2 style={titleStyle}>💸 Estás listo para cobrar</h2>

                <p style={textStyle}>
                    El secreto no es compartir el link, es <b>crear curiosidad</b>.
                </p>

                {/* INPUT DE LINK */}
                <div style={linkInputContainerStyle}>
                    <input
                        type="text"
                        value={publicLink}
                        readOnly
                        style={linkInputStyle}
                        className="link-input-scroll"
                    />
                    <button
                        onClick={handleCopyLink}
                        style={copyButtonStyle}
                        onMouseOver={(e) => Object.assign(e.currentTarget.style, copyButtonHoverStyle)}
                        onMouseOut={(e) => Object.assign(e.currentTarget.style, copyButtonStyle)}
                    >
                        {copyText}
                    </button>
                </div>

                {/* ESTRATEGIA MIMÉTICA (EL GUION DE VENTA) */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '15px', 
                    borderRadius: '12px', 
                    textAlign: 'left', 
                    marginTop: '20px',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <p style={{fontSize: '12px', color: '#c9a4ff', fontWeight: 'bold', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px'}}>
                        💡 Estrategia Pro:
                    </p>
                    <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.6'}}>
                        Sube una Historia a Instagram/Twitter con este texto exacto:
                        <br/><br/>
                        <span style={{fontStyle: 'italic', color: '#fff'}}>
                            "Voy a responder las preguntas más interesantes (y picantes) por aquí. Solo gente seria."
                        </span>
                        <br/><br/>
                        ...y pega el link usando el Sticker de Enlace.
                    </p>
                </div>

                <button
                    style={buttonStyle}
                    onClick={onClose}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Entendido, a cobrar
                </button>
            </div>
            <style>{`
                @keyframes fadeInOverlay { to { opacity: 1; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); } }
                @keyframes popUpModal { to { transform: translateY(0) scale(1); opacity: 1; } }
                ${scrollbarHideStyle}
            `}</style>
        </div>
    );
}