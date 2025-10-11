// src/app/dashboard/[id]/page.jsx (Versión Dinámica y Emocionante)
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { refreshToken } from "@/utils/auth";
import MessageList from "@/components/MessageList";
import DashboardInfo from "@/components/DashboardInfo";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// --- Componente de Carga Mejorado ---
const FullPageLoader = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'rgba(255, 255, 255, 0.8)',
    }}>
        <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
            <style>{`.spinner_V8m1{transform-origin:center;animation:spinner_zKoa 2s linear infinite}.spinner_V8m1 circle{stroke-linecap:round;animation:spinner_YpZS 1.5s ease-in-out infinite}@keyframes spinner_zKoa{100%{transform:rotate(360deg)}}@keyframes spinner_YpZS{0%{stroke-dasharray:0 150;stroke-dashoffset:0}47.5%{stroke-dasharray:42 150;stroke-dashoffset:-16}95%,100%{stroke-dasharray:42 150;stroke-dashoffset:-59}}`}</style>
            <g className="spinner_V8m1"><circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="2" stroke="currentColor"></circle></g>
        </svg>
        <p style={{ marginTop: '20px', fontSize: '18px', letterSpacing: '0.5px' }}>Accediendo a tu Espacio Secreto...</p>
    </div>
);

export default function DashboardPage() {
    const { id } = useParams();
    const router = useRouter();
    const [creator, setCreator] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Estilos Globales y Animaciones ---
    const pageStyles = `
        body { 
            background-color: #121212; 
            color: #fff;
            font-family: sans-serif;
            overflow-x: hidden;
        }
        @keyframes fadeInUp { 
            from { opacity: 0; transform: translateY(25px); } 
            to { opacity: 1; transform: translateY(0); } 
        }
        .fade-in-up { 
            animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            opacity: 0; /* Inicia invisible para que la animación funcione */
        }
    `;

    const getAuthHeaders = (token) => {
        const t = token || localStorage.getItem("token");
        return t ? { Authorization: `Bearer ${t}` } : {};
    };

    const handleAuthFailure = () => {
        localStorage.clear();
        router.push("/login?session=expired");
    };

    const fetchCreator = async (token) => {
        try {
            const headers = getAuthHeaders(token);
            let res = await fetch(`${API}/creators/me`, { headers });

            if (res.status === 401) {
                const publicId = localStorage.getItem("publicId");
                const newToken = await refreshToken(publicId);
                if (newToken) {
                    res = await fetch(`${API}/creators/me`, { headers: { Authorization: `Bearer ${newToken}` } });
                } else {
                    handleAuthFailure(); return;
                }
            }
            if (!res.ok) { handleAuthFailure(); return; }
            
            const data = await res.json();
            setCreator(data);
        } catch (err) {
            console.error("❌ Error en fetchCreator:", err);
            handleAuthFailure();
        } finally {
            setTimeout(() => setLoading(false), 600); // Pequeño delay para una transición suave
        }
    };

    useEffect(() => {
        fetchCreator();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <style>{pageStyles}</style>
            <div style={{ minHeight: '100vh' }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: '40px 20px' }}>
                    {loading && <FullPageLoader />}
                    
                    {!loading && creator && (
                        <div>
                            <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <DashboardInfo creator={creator} onChange={setCreator} />
                            </div>
                            <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
                                <MessageList dashboardId={id} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}