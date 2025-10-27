// src/components/FirstMessageGuideModal.jsx
"use client";
import React, { useEffect } from 'react';

// --- ESTILOS (Puedes moverlos a globals.css si prefieres) ---
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(13, 12, 34, 0.85)', // Fondo oscuro semi-transparente (ajusta --background-abyss)
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  opacity: 0,
  animation: 'fadeInOverlay 0.5s forwards',
  backdropFilter: 'blur(5px)', // Efecto blur para el fondo
  WebkitBackdropFilter: 'blur(5px)',
};

const modalContentStyle = {
  background: 'linear-gradient(145deg, #1a1a2e, #2c1a5c)', // Gradiente similar al fondo (ajusta --background-core)
  padding: '30px 35px', // Padding ajustado
  borderRadius: '24px', // Borde redondeado
  border: '1px solid rgba(142, 45, 226, 0.3)', // Borde sutil púrpura (ajusta --border-color-faint)
  maxWidth: '420px', // Ancho máximo
  width: '90%',
  textAlign: 'center',
  color: 'var(--text-primary, #f5f5f5)', // Color de texto primario
  boxShadow: '0 15px 50px rgba(0, 0, 0, 0.6)', // Sombra más pronunciada
  transform: 'translateY(20px) scale(0.95)', // Estado inicial para animación
  opacity: 0, // Estado inicial para animación
  animation: 'popUpModal 0.6s 0.1s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Animación de entrada
};

const titleStyle = {
    fontSize: '24px', // Tamaño ajustado
    fontWeight: '700', // Negrita
    color: '#fff', // Blanco para contraste
    marginBottom: '10px', // Espacio abajo
};

const textStyle = {
    color: 'rgba(235, 235, 245, 0.7)', // Color secundario (ajusta --text-secondary)
    lineHeight: 1.7, // Interlineado
    fontSize: '15px', // Tamaño ligero
    marginBottom: '15px',
};

const highlightTextStyle = {
    fontWeight: '600', // Ligeramente más negrita
    color: '#fff', // Blanco
    marginTop: '15px',
    marginBottom: '15px',
    fontSize: '16px',
};

const arrowStyle = {
  fontSize: '32px', // Tamaño flecha
  display: 'block',
  margin: '10px auto 5px', // Espaciado ajustado
  color: 'var(--glow-accent-crimson, #c9a4ff)', // Color acento púrpura claro
  animation: 'bounceArrow 1.8s infinite ease-in-out', // Animación más suave
};

const buttonStyle = {
  marginTop: '25px',
  padding: '14px 30px', // Padding ajustado
  background: 'linear-gradient(90deg, #8e2de2, #4a00e0)', // Gradiente púrpura (ajusta colores primarios)
  border: 'none',
  borderRadius: '12px', // Borde redondeado
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '16px', // Tamaño ajustado
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.3s ease',
  boxShadow: '0 5px 15px rgba(74, 0, 224, 0.3)', // Sombra sutil
};

// --- COMPONENTE ---
export default function FirstMessageGuideModal({ onClose }) {
  // Cierra el modal si se presiona la tecla Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Cierra el modal automáticamente después de 12 segundos
  useEffect(() => {
    const timer = setTimeout(onClose, 15000); // 12 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={modalOverlayStyle} onClick={onClose}> {/* Cierra al hacer clic fuera */}
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}> {/* Evita cerrar al hacer clic dentro */}
        <h2 style={titleStyle}>¡Chat Anónimo Abierto! 💬</h2>
        <p style={textStyle}>
        Tu conversación acaba de empezar. Haz clic en el botón de abajo para entrar. 👇 El creador responderá tan pronto como pueda...
        </p>
        <p style={highlightTextStyle}>
          Puedes esperar aquí o volver más tarde.
        </p>
        <p style={textStyle}>
            **Desliza hacia abajo 👇 para verlos.**
        </p>
        <div style={arrowStyle}>⬇️</div>
        <button
            style={buttonStyle}
            onClick={onClose}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Entendido
        </button>
      </div>
      {/* Keyframes para las animaciones (inyectados directamente) */}
      <style>{`
        @keyframes fadeInOverlay { to { opacity: 1; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); } }
        @keyframes popUpModal { to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes bounceArrow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
      `}</style>
    </div>
  );
}