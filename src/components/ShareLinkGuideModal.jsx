// src/components/ShareLinkGuideModal.jsx
"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

// --- ESTILOS (Puedes moverlos a globals.css si prefieres) ---
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
    fontWeight: '700',
    color: '#fff',
    marginBottom: '10px',
};

const textStyle = {
    color: 'rgba(235, 235, 245, 0.7)',
    lineHeight: 1.7,
    fontSize: '15px',
    marginBottom: '15px',
};

const highlightTextStyle = {
    fontWeight: '600',
    color: '#fff',
    marginTop: '15px',
    marginBottom: '15px',
    fontSize: '16px',
};

const linkInputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '10px',
    marginTop: '20px',
    marginBottom: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
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
    overflowX: 'scroll', // Permite scroll horizontal si el link es muy largo
    scrollbarWidth: 'none', // Oculta la barra de scroll en Firefox
    MsOverflowStyle: 'none', // Oculta la barra de scroll en IE/Edge
};

// Oculta la barra de scroll en navegadores WebKit (Chrome, Safari)
const scrollbarHideStyle = `
  .link-input-scroll::-webkit-scrollbar {
    display: none;
  }
`;

const copyButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
};

const copyButtonHoverStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: 'scale(1.05)',
};

const buttonStyle = {
    marginTop: '25px',
    padding: '14px 30px',
    background: 'linear-gradient(90deg, #8e2de2, #4a00e0)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.3s ease',
    boxShadow: '0 5px 15px rgba(74, 0, 224, 0.3)',
};

// --- COMPONENTE ---
export default function ShareLinkGuideModal({ onClose, publicLink }) {
    const [copyText, setCopyText] = useState('Copiar');

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Opcional: Cerrar automáticamente después de un tiempo
    useEffect(() => {
      const timer = setTimeout(onClose, 20000); // Cierra después de 20 segundos
      return () => clearTimeout(timer);
    }, [onClose]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(publicLink);
            setCopyText('¡Copiado!');
            setTimeout(() => setCopyText('Copiar'), 2000); // Restablece el texto después de 2 segundos
        } catch (err) {
            console.error('Error al copiar el enlace:', err);
            setCopyText('Error');
            setTimeout(() => setCopyText('Copiar'), 2000);
        }
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <h2 style={titleStyle}>¡Tu Espacio Anónimo Está Listo! ✨</h2>

                {/* Esta imagen es solo ilustrativa, si quieres puedes usar una diferente o quitarla */}
                <Image
                    src="/guide.jpg" // Puedes cambiar esto por una imagen más adecuada para "compartir"
                    alt="Persona compartiendo un enlace"
                    width={300}
                    height={150}
                    style={{
                        display: 'block',
                        maxWidth: '85%', // Ajustado para que la imagen no sea tan dominante
                        height: 'auto',
                        margin: '15px auto',
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                    }}
                    priority
                />

                <p style={textStyle}>
                    Comparte este link para empezar a recibir mensajes anónimos.
                </p>

                <div style={linkInputContainerStyle}>
                    <input
                        type="text"
                        value={publicLink}
                        readOnly
                        style={linkInputStyle}
                        className="link-input-scroll" // Clase para ocultar scrollbar
                    />
                    <button
                        onClick={handleCopyLink}
                        style={copyButtonStyle}
                        onMouseOver={(e) => Object.assign(e.currentTarget.style, copyButtonHoverStyle)}
                        onMouseOut={(e) => Object.assign(e.currentTarget.style, copyButtonStyle)} // Vuelve al estilo original
                    >
                        {copyText === 'Copiar' && (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H9.75a1.125 1.125 0 01-1.125-1.125V17.25m12 0v-4.125c0-.621-.504-1.125-1.125-1.125h-4.125m5.25 5.25L17.25 17.25m0 0L21 13.5m-3.75 3.75l-3.75-3.75M3.75 16.5V20.25c0 .621.504 1.125 1.125 1.125h4.5a1.125 1.125 0 001.125-1.125V16.5m-1.5-4.5H3.75c-.621 0-1.125-.504-1.125-1.125V4.875c0-.621.504-1.125 1.125-1.125h10.5c.621 0 1.125.504 1.125 1.125v4.5m-13.5 0H12" /></svg>
                        )}
                        {copyText}
                    </button>
                </div>

                <p style={highlightTextStyle}>
                    ¡Anímate y compártelo ahora!
                </p>

                <button
                    style={buttonStyle}
                    onClick={onClose}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Entendido
                </button>
            </div>
            <style>{`
                @keyframes fadeInOverlay { to { opacity: 1; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); } }
                @keyframes popUpModal { to { transform: translateY(0) scale(1); opacity: 1; } }
                @keyframes bounceArrow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
                ${scrollbarHideStyle}
            `}</style>
        </div>
    );
}