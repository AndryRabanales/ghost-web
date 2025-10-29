// src/app/dashboard/[id]/page.jsx
"use client";
import { useEffect, useState, useMemo, useCallback } from "react"; // Añadido useCallback y useMemo si no estaban
import { useParams, useRouter } from "next/navigation";
import { refreshToken, getAuthHeaders } from "@/utils/auth"; // Asegúrate que getAuthHeaders esté exportado
import MessageList from "@/components/MessageList";
import DashboardInfo from "@/components/DashboardInfo";
import ShareLinkGuideModal from "@/components/ShareLinkGuideModal"; // Importa el modal

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

const FullPageLoader = () => ( /* ... (tu componente Loader sin cambios) ... */
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
    const [showShareGuideModal, setShowShareGuideModal] = useState(false); // Estado para el modal

    // --- Estilos Globales y Animaciones ---
    const pageStyles = ` /* ... (tus estilos pageStyles sin cambios) ... */ `;

    const handleAuthFailure = useCallback(() => {
        localStorage.clear();
        router.push("/login?session=expired");
    }, [router]);

    // --- Función para cargar datos del creador y chats ---
    const fetchDashboardData = useCallback(async (tokenToUse) => {
        setLoading(true); // Mostrar carga al inicio
        try {
            const currentToken = tokenToUse || localStorage.getItem("token");
            if (!currentToken) { handleAuthFailure(); return; }

            const headers = getAuthHeaders(currentToken);
            // Hacemos ambas peticiones en paralelo para eficiencia
            const [meRes, chatsRes] = await Promise.all([
                fetch(`${API}/creators/me`, { headers, cache: 'no-store' }),
                fetch(`${API}/dashboard/${id}/chats`, { headers, cache: 'no-store' })
            ]);

            // --- Manejo de errores de autenticación y refresh ---
            if (meRes.status === 401 || chatsRes.status === 401) {
                const publicId = localStorage.getItem("publicId");
                if (publicId) {
                    const newToken = await refreshToken(publicId);
                    if (newToken) {
                        fetchDashboardData(newToken); // Reintentar con el nuevo token
                        return; // Salir de esta ejecución
                    }
                }
                handleAuthFailure(); // Si no hay publicId o refresh falla
                return;
            }

            // --- Procesar respuestas OK ---
            if (!meRes.ok) throw new Error('Error al cargar datos del creador');
            if (!chatsRes.ok) throw new Error('Error al cargar chats');

            const meData = await meRes.json();
            const chatsData = await chatsRes.json();

            setCreator(meData); // Guardar datos del creador

            // --- 👇 Lógica para mostrar el Modal de Compartir 👇 ---
            // Construir la clave única para este creador en localStorage
            const guideSeenKey = `hasSeenShareGuide_${meData.publicId}`;
            const hasSeenGuide = localStorage.getItem(guideSeenKey);

            // Mostrar si: No ha visto la guía ANTES Y no tiene chats AHORA
            if (!hasSeenGuide && chatsData.length === 0) {
                setShowShareGuideModal(true);
            }
            // --- 👆 Fin de la lógica del Modal 👆 ---

        } catch (err) {
            console.error("❌ Error en fetchDashboardData:", err);
            // Podrías mostrar un mensaje de error al usuario aquí
            if (err.message.includes('401') || err.message.includes('Authentication failed')) {
                handleAuthFailure(); // Redirigir si el error es de autenticación
            }
        } finally {
            setTimeout(() => setLoading(false), 400); // Pequeño delay
        }
    }, [id, handleAuthFailure]); // Dependencias estables

    // --- useEffect inicial para cargar datos ---
    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo se ejecuta una vez al montar

    // --- Función para cerrar el modal y marcar como visto ---
    const closeShareGuideModal = useCallback(() => {
        if (creator?.publicId) {
            // Guardar en localStorage que ya se vio para ESTE creador
            const guideSeenKey = `hasSeenShareGuide_${creator.publicId}`;
            localStorage.setItem(guideSeenKey, 'true');
        }
        setShowShareGuideModal(false);
    }, [creator?.publicId]); // Depende del publicId del creador

    // --- Calcular publicLink ---
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
                        {/* El DashboardInfo ahora recibe el creator directamente */}
                        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <DashboardInfo creator={creator} onChange={setCreator} />
                        </div>
                        {/* MessageList necesita el dashboardId */}
                        <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <MessageList dashboardId={id} />
                        </div>
                    </div>
                )}

                {/* --- 👇 Renderizado Condicional del Modal 👇 --- */}
                {showShareGuideModal && creator && (
                    <ShareLinkGuideModal
                        onClose={closeShareGuideModal}
                        publicLink={publicLink} // Pasar el link calculado
                    />
                )}
                {/* --- 👆 Fin Renderizado Condicional 👆 --- */}

            </div>
        </>
    );
}