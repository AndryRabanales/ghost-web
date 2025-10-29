// src/components/FirstMessageGuideModal.jsx
"use client";
import React, { useEffect } from 'react';
// --- 👇 Import Next.js Image component ---
import Image from 'next/image';

// --- ESTILOS ---
// ... (modalOverlayStyle, modalContentStyle, titleStyle, etc. sin cambios) ...
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
  width: '97%',
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

const arrowStyle = {
  fontSize: '32px',
  display: 'block',
  margin: '10px auto 5px',
  color: 'var(--glow-accent-crimson, #c9a4ff)',
  animation: 'bounceArrow 1.8s infinite ease-in-out',
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

// --- 👇 NUEVO ESTILO PARA LA IMAGEN ---
const imageStyle = {
    display: 'block',     // Para poder centrar con margin
    maxWidth: '100%',      // Que no sea más ancha que el 80% del modal
    height: 'auto',       // Mantiene la proporción
    margin: '15px auto', // Centra la imagen y añade espacio arriba/abajo
    borderRadius: '16px', // Bordes redondeados
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)', // Sombra sutil
};
// --- 👆 FIN NUEVO ESTILO ---

// --- COMPONENTE ---
export default function FirstMessageGuideModal({ onClose }) {
  // ... (useEffect para Escape y temporizador sin cambios) ...
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(onClose, 15000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>¡Chat Anónimo Abierto! 💬</h2>

        <p style={highlightTextStyle}>
        Espera a que te respondan el mensaje que acabas de enviar!
        </p>
        <p style={textStyle}>
          **Presiona en abrir chatear ahora mismo!.⬇️**
        </p>

 {/* --- 👇 AÑADIR IMAGEN AQUÍ 👇 --- */}
        {/* Usamos el componente Image de Next.js para optimización */}
        <Image
          src="/guide.jpg" // Ruta desde la carpeta 'public'
          alt="Guía visual para encontrar chats"
          width={500} // Ancho deseado (Next.js lo usa para optimizar)
          height={350} // Alto deseado (ajusta según tu imagen)
          style={imageStyle} // Aplicamos los estilos
          priority // Cargar la imagen rápido ya que es importante para el modal
        />
        {/* --- 👆 FIN AÑADIR IMAGEN 👆 --- */}

        <p style={textStyle}>
          En este apartado crea tu propio dashboard, comparte y recibe mensajes anónimos!
        </p>

        {/* --- 👇 AÑADIR IMAGEN AQUÍ 👇 --- */}
        {/* Usamos el componente Image de Next.js para optimización */}
        <Image
          src="/dash.jpg" // Ruta desde la carpeta 'public'
          alt="Guía visual para encontrar chats"
          width={200} // Ancho deseado (Next.js lo usa para optimizar)
          height={350} // Alto deseado (ajusta según tu imagen)
          style={imageStyle} // Aplicamos los estilos
          priority // Cargar la imagen rápido ya que es importante para el modal
        />
        {/* --- 👆 FIN AÑADIR IMAGEN 👆 --- */}

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
      `}</style>
    </div>
  );
}