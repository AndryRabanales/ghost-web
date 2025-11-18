"use client";

// Es necesario usar Suspense para useSearchParams en el App Router de Next.js
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Define la URL de la API
const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";

// Componente SvgSpinner para la carga
const SvgSpinner = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white" style={{ margin: "0 auto 20px" }}>
    <style>{`.spinner_V8m1{transform-origin:center;animation:spinner_zKoa 2s linear infinite}.spinner_V8m1 circle{stroke-linecap:round;animation:spinner_YpZS 1.5s ease-in-out infinite}@keyframes spinner_zKoa{100%{transform:rotate(360deg)}}@keyframes spinner_YpZS{0%{stroke-dasharray:0 150;stroke-dashoffset:0}47.5%{stroke-dasharray:42 150;stroke-dashoffset:-16}95%,100%{stroke-dasharray:42 150;stroke-dashoffset:-59}}`}</style>
    <g className="spinner_V8m1"><circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="2" stroke="currentColor"></circle></g>
  </svg>
);

// Este es el componente principal de la página que maneja la lógica
function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("Procesando tu pago, por favor espera...");
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setError("No se encontró un ID de sesión. Por favor, regresa e intenta de nuevo.");
      setStatus("Error");
      return;
    }

    const fetchChatDetails = async () => {
      try {
        const res = await fetch(`${API}/public/chat-from-session?session_id=${sessionId}`);
        const data = await res.json();

        if (!res.ok) {
          // Si el webhook aún no se procesa (404), reintentamos.
          // Damos 5 intentos (10 segundos)
          if (res.status === 404 && retryCount < 5) {
            setStatus(`Esperando confirmación del pago... (Intento ${retryCount + 1})`);
            // Espera 2 segundos y vuelve a intentar (disparando el useEffect)
            setTimeout(() => setRetryCount(prevCount => prevCount + 1), 2000); 
          } else {
            // Si falla después de 5 intentos o es otro error
            throw new Error(data.error || "No se pudo recuperar tu chat.");
          }
          return;
        }

        // --- 👇 INICIO DE MODIFICACIÓN (TAREA #2) 👇 ---
        const { chatId, anonToken, creatorName, anonAlias, preview, ts } = data;

        if (chatId && anonToken) {
          setStatus("¡Éxito! Guardando y redirigiendo a tu chat...");

          try {
            const newChatEntry = {
              chatId,
              anonToken,
              creatorName: creatorName || "Creador",
              anonAlias: anonAlias || "Anónimo",
              preview: preview ? (preview.length > 50 ? preview.substring(0, 47) + '...' : preview) : "...",
              ts: ts || new Date().toISOString(),
              hasNewReply: false // El chat es nuevo, no tiene respuesta
            };

            const storedChats = JSON.parse(localStorage.getItem("myChats") || "[]");
            
            // Evitar duplicados si el usuario refresca la página de éxito
            const isAlreadySaved = storedChats.some(c => c.chatId === chatId);
            
            if (!isAlreadySaved) {
              // Añadir al principio de la lista
              const updatedChats = [newChatEntry, ...storedChats];
              localStorage.setItem("myChats", JSON.stringify(updatedChats));
            }

          } catch (storageError) {
            console.error("Error al guardar en localStorage:", storageError);
            // No es un error fatal, simplemente continuamos a la redirección
          }
          // --- 👆 FIN DE MODIFICACIÓN 👆 ---
          
          // Redirigir al chat
          router.push(`/chats/${anonToken}/${chatId}`);
        } else {
          throw new Error("Datos del chat incompletos recibidos de la API.");
        }

      } catch (err) {
        console.error("Error en fetchChatDetails:", err);
        setError(`Error: ${err.message}. Si tu pago fue exitoso, por favor contacta a soporte o revisa tu email.`);
        setStatus("Error");
      }
    };

    fetchChatDetails();
    
    // El 'timer' de reintento se maneja en el bloque 'catch'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, router, retryCount]); // Se vuelve a ejecutar cuando retryCount cambia

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px',
      color: 'var(--text-primary)',
      // Usamos los fondos de tu globals.css
      backgroundColor: 'var(--background-abyss)',
      backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(108, 99, 255, 0.15), transparent 40%), radial-gradient(circle at 85% 20%, rgba(0, 255, 255, 0.15), transparent 40%)',
    }}>
      {/* Usamos el estilo de .auth-card de tu CSS */}
      <div className="auth-card">
        {!error && <SvgSpinner />}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          margin: '0 0 15px',
          color: error ? '#ff7b7b' : 'var(--glow-accent-crimson)',
        }}>
          {error ? "Hubo un Problema" : "Pago Exitoso"}
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '16px',
          lineHeight: '1.6',
        }}>
          {error || status}
        </p>
      </div>
    </div>
  );
}

// Envolvemos el componente en Suspense como requiere Next.js
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{color: 'white', textAlign: 'center', paddingTop: '100px'}}>
        Cargando...
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}