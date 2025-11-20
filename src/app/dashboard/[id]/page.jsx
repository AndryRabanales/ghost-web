// src/app/dashboard/[id]/page.jsx
"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { refreshToken, getAuthHeaders } from "@/utils/auth";
import MessageList from "@/components/MessageList";
import DashboardInfo from "@/components/DashboardInfo";
import ShareLinkGuideModal from "@/components/ShareLinkGuideModal";
// ❌ ELIMINADO: import PremiumContractConfig from "@/components/PremiumContractConfig"; 

import PriceConfig from "@/components/PriceConfig";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

const FullPageLoader = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'rgba(255, 255, 255, 0.8)', }}>
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
    const [showShareGuideModal, setShowShareGuideModal] = useState(false);

    const pageStyles = `
      /* Tus estilos globales o locales aquí si los necesitas, 
         aunque generalmente están en globals.css */
    `;

    const handleAuthFailure = useCallback(() => {
        localStorage.clear();
        router.push("/login?session=expired");
    }, [router]);

    const fetchDashboardData = useCallback(async (tokenToUse) => {
        setLoading(true);
        try {
            const currentToken = tokenToUse || localStorage.getItem("token");
            if (!currentToken) { handleAuthFailure(); return; }

            const headers = getAuthHeaders(currentToken);
            const [meRes, chatsRes] = await Promise.all([
                fetch(`${API}/creators/me`, { headers, cache: 'no-store' }),
                fetch(`${API}/dashboard/${id}/chats`, { headers, cache: 'no-store' })
            ]);

            if (meRes.status === 401 || chatsRes.status === 401) {
                const publicId = localStorage.getItem("publicId");
                if (publicId) {
                    const newToken = await refreshToken(publicId);
                    if (newToken) {
                        fetchDashboardData(newToken);
                        return;
                    }
                }
                handleAuthFailure();
                return;
            }

            if (!meRes.ok) throw new Error('Error al cargar datos del creador');
            if (!chatsRes.ok) throw new Error('Error al cargar chats');

            const meData = await meRes.json();
            const chatsData = await chatsRes.json();

            setCreator(meData);

            const guideSeenKey = `hasSeenShareGuide_${meData.publicId}`;
            const hasSeenGuide = localStorage.getItem(guideSeenKey);

            if (!hasSeenGuide && chatsData.length === 0) {
                setShowShareGuideModal(true);
            }
        } catch (err) {
            console.error("❌ Error en fetchDashboardData:", err);
            if (err.message.includes('401') || err.message.includes('Authentication failed')) {
                handleAuthFailure();
            }
        } finally {
            setTimeout(() => setLoading(false), 400);
        }
    }, [id, handleAuthFailure]);

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const closeShareGuideModal = useCallback(() => {
        if (creator?.publicId) {
            const guideSeenKey = `hasSeenShareGuide_${creator.publicId}`;
            localStorage.setItem(guideSeenKey, 'true');
        }
        setShowShareGuideModal(false);
    }, [creator?.publicId]);

    const publicLink = useMemo(() => {
        if (!creator?.publicId || typeof window === 'undefined') return "";
        return `${window.location.origin}/u/${creator.publicId}`;
    }, [creator?.publicId]);


    return (
        <>
            <style>{pageStyles}</style>
            <div className="dashboard-page-container">
                {loading && <FullPageLoader />}

                {!loading && creator && (
                    <div>
                        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <DashboardInfo creator={creator} onChange={setCreator} />
                        </div>

                        <div className="fade-in-up" style={{ 
                            animationDelay: '0.2s', 
                            marginBottom: '25px', 
                            background: 'var(--background-core)',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color-faint)',
                            padding: '20px' 
                        }}>
                            {/* ❌ ELIMINADO: <PremiumContractConfig /> */}

                            {/* Componente de Precio (se mantiene) */}
                            <PriceConfig creator={creator} onChange={setCreator} />
                        </div>

                        <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <MessageList dashboardId={id} />
                        </div>
                    </div>
                )}

                {showShareGuideModal && creator && (
                    <ShareLinkGuideModal
                        onClose={closeShareGuideModal}
                        publicLink={publicLink}
                    />
                )}
            </div>
        </>
    );
}