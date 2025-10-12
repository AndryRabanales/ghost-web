// src/components/DashboardInfo.jsx
"use client";
import { useState, useEffect } from "react";
import LivesStatus from "./LivesStatus";
import PremiumButton from "./PremiumButton";

const CopyIcon = () => (
    <svg height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M8 17.929H6c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h11c1.105 0 2 .895 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 7.01V4c0-1.105.895-2 2-2h7c1.105 0 2 .895 2 2v12c0 1.105-.895 2-2 2h-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
);

// --- Componente LinkInput rediseñado para usar clases CSS ---
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


export default function DashboardInfo({ creator, onChange }) {
  const [publicUrl, setPublicUrl] = useState('');
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [copyStatus, setCopyStatus] = useState({});

  useEffect(() => {
    if (creator && typeof window !== 'undefined') {
      const origin = window.location.origin;
      setPublicUrl(`${origin}/u/${creator.publicId}`);
      setDashboardUrl(`${origin}/dashboard/${creator.id}`);
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
    <div className="dashboard-info-container">
      {/* Estructura corregida: un solo flex container */}
      <div className="dashboard-main-content">

        
        <div className="links-section">
          <LinkInput 
            icon="✨"
            label="Link Público"
            url={publicUrl}
            type="public"
            onCopy={handleCopy}
            copyStatus={copyStatus}
          />
          <LinkInput 
            icon="🚀"
            label="Link del Dashboard"
            url={dashboardUrl}
            type="dash"
            onCopy={handleCopy}
            copyStatus={copyStatus}
          />
        </div>
      </div>
      
      <div className="dashboard-side-content">
        <LivesStatus creator={creator} />
        <PremiumButton creator={creator} onChange={onChange} />
      </div>
    </div>
  );
}