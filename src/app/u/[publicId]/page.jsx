// src/app/u/[publicId]/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// --- 👇 1. AÑADE ESTA LÍNEA DE IMPORTACIÓN 👇 ---
import AnonMessageForm from "@/components/AnonMessageForm";

const API = process.env.NEXT_PUBLIC_API || "https://ghost-api-production.up.railway.app";
const FALLBACK_MIN_PREMIUM_AMOUNT = 100; 
const MAX_PREMIUM_AMOUNT = 100000; // $100,000 MXN

// --- ❌ 2. BORRA TODO DESDE AQUÍ... ❌ ---
// const formatContract = (contractData) => { ... }
// const EscasezCounter = ({ data, isFull }) => { ... }
// function AnonMessageForm({ ... }) { ... } 
// ... (BORRA TODAS ESAS FUNCIONES, HASTA LA LÍNEA 278)
// --- ❌ ...HASTA AQUÍ ❌ ---


// --- 3. COMPONENTE DE PÁGINA (ESTO SE QUEDA) ---
export default function PublicUserPage() {
  const params = useParams();
  const router = useRouter();
  const { publicId } = params;

  const [creatorInfo, setCreatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carga los datos del creador (contrato, precio, etc.) desde la API
  useEffect(() => {
    if (publicId) {
      const fetchData = async () => {
        try {
          const res = await fetch(`${API}/public/creator/${publicId}`);
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "No se pudo cargar la información del creador.");
          }
          const data = await res.json();
          setCreatorInfo(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [publicId]);

  // Define qué hacer cuando el chat se cree (redirigir)
  const handleChatCreated = (newChatEntry) => {
    if (newChatEntry.anonToken && newChatEntry.chatId) {
      router.push(`/chats/${newChatEntry.anonToken}/${newChatEntry.chatId}`);
    }
  };

  if (loading) {
    return (
      <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px', fontFamily: 'monospace' }}>
        Cargando espacio...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: '#ff7b7b', textAlign: 'center', paddingTop: '100px', fontFamily: 'monospace' }}>
        Error: {error}
      </div>
    );
  }

  if (!creatorInfo) {
    return (
      <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px', fontFamily: 'monospace' }}>
        Creador no encontrado.
      </div>
    );
  }

  // Renderiza el formulario, pasando los datos cargados como props
  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{
          fontSize: '34px',
          fontWeight: '800',
          letterSpacing: '-1.5px',
          background: 'linear-gradient(90deg, #8e2de2, #c9a4ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 15px',
          textAlign: 'center'
        }}>
        Enviar a {creatorInfo.creatorName}
      </h1>
        {/* AHORA ESTA LLAMADA USA EL COMPONENTE IMPORTADO Y CORRECTO */}
        <AnonMessageForm
        publicId={publicId}
        onChatCreated={handleChatCreated}
        escasezData={creatorInfo.escasezData}
        isFull={creatorInfo.isFull}
        // ❌ ELIMINADO: creatorContract
        topicPreference={creatorInfo.topicPreference} 
        creatorName={creatorInfo.creatorName}
        baseTipAmountCents={creatorInfo.baseTipAmountCents}
      />

    </div>
  );
}