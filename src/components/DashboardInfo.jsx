// src/components/DashboardInfo.jsx
"use client";
import { useState, useEffect } from "react";
import LivesStatus from "./LivesStatus";
import PremiumButton from "./PremiumButton";

const CopyIcon = () => (
    <svg height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path d="M8 17.929H6c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h11c1.105 0 2 .895 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8 7.01V4c0-1.105.895-2 2-2h7c1.105 0 2 .895 2 2v12c0 1.105-.895 2-2 2h-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
);

const LinkInput = ({ label, url, type, onCopy, copyStatus, color }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div>
            <label style={{ display: 'block', fontWeight: '600', color, marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <input 
                    type="text" 
                    value={url} 
                    readOnly 
                    style={{ 
                        width: '100%',
                        padding: '12px 15px', 
                        background: '#121212', 
                        border: '1px solid #48484A', 
                        borderRadius: '10px', 
                        color: 'rgba(255,255,255,0.7)', 
                        fontSize: '14px',
                        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                        boxSizing: 'border-box'
                    }} 
                />
                <button 
                    onClick={() => onCopy(url, type)} 
                    style={{ 
                        position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                        padding: '9px 12px', cursor: 'pointer', 
                        background: isHovered ? '#48484A' : '#38383a', 
                        border: 'none', borderRadius: '8px', color: '#fff', 
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'background-color 0.3s ease',
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
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
      <div className="dashboard-main-content">
        <div>
          <h2 className="dashboard-title">
            Centro de Mando
          </h2>
          <p className="dashboard-subtitle">
            Bienvenido a tu espacio, <b>{creator.name || 'Creador'}</b>. Aquí gestionas tus conversaciones.
          </p>
        </div>
        
        <div style={{ display: 'grid', gap: '25px' }}>
          <LinkInput 
            label="🔗 Link Público (Compártelo)"
            url={publicUrl}
            type="public"
            onCopy={handleCopy}
            copyStatus={copyStatus}
            color="#00E676"
          />
          <LinkInput 
            label="🔖 Link del Dashboard (Guárdalo)"
            url={dashboardUrl}
            type="dash"
            onCopy={handleCopy}
            copyStatus={copyStatus}
            color="#FFD54F"
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