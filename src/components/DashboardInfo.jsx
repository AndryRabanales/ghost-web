// src/components/DashboardInfo.jsx
"use client";
import { useState, useEffect } from "react";

// --- AÑADIDO: Importar el nuevo componente ---
import BalanceSummary from "./BalanceSummary"; 

// ... (const CopyIcon, const LinkInput, const ArrowIcon ... sin cambios) ...
const CopyIcon = () => (
    <svg height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M8 17.929H6c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h11c1.105 0 2 .895 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 7.01V4c0-1.105.895-2 2-2h7c1.105 0 2 .895 2 2v12c0 1.105-.895 2-2 2h-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
);

const LinkInput = ({ label, icon, url, type, onCopy, copyStatus }) => {
    return (
        <div className="link-input-container">
            <label className="link-input-label">
                <span className="link-input-icon">{icon}</span> {label}
            </label>
            <div className="input-wrapper">
                <input 
                    type="text" 
                    value={url} 
                    readOnly 
                    className="link-input-field"
                />
                <button 
                    onClick={() => onCopy(url, type)} 
                    className="copy-button"
                >
                    <CopyIcon /> {copyStatus[type] || 'Copiar'}
                </button>
            </div>
        </div>
    );
};

const ArrowIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 10L12 15L7 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export default function DashboardInfo({ creator, onChange }) {
  const [publicUrl, setPublicUrl] = useState('');
  const [copyStatus, setCopyStatus] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false); 

  useEffect(() => {
    if (creator && typeof window !== 'undefined') {
      const origin = window.location.origin;
      setPublicUrl(`${origin}/u/${creator.publicId}`);
    }
  }, [creator]);

  const handleCopy = (url, type) => {
    navigator.clipboard.writeText(url).then(() => {
        setCopyStatus(prev => ({ ...prev, [type]: '¡Copiado!' }));
        setTimeout(() => setCopyStatus(prev => ({ ...prev, [type]: null })), 2000);
    });
  };

  if (!creator) return null;

  return (
    <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      
      <div className="sidebar-content">
        
        {/* 1. LinkInput */}
        <div className="links-section">
          <LinkInput 
            icon="✨"
            label="Link Público (compártelo en tus redes sociales)"
            url={publicUrl}
            type="public"
            onCopy={handleCopy}
            copyStatus={copyStatus}
          />
        </div>
        
        {/* --- AÑADIDO: El componente de Balance --- */}
        {/* Lo colocamos antes del botón Premium */}
        <BalanceSummary creator={creator} />\
      </div>
      
      {/* Botón de colapso */}
      <div className="sidebar-toggle-container">
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-toggle-button" title={isCollapsed ? "Mostrar" : "Ocultar"}>
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}