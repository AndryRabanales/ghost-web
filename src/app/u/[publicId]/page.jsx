// src/app/u/[publicId]/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AnonMessageForm from "@/components/AnonMessageForm";

const API = process.env.NEXT_PUBLIC_API || "https://api.ghostmsg.space";

// Constants removed

export default function PublicUserPage() {
  const params = useParams();
  const router = useRouter();
  // Manejo seguro de params.publicId
  const publicId = params?.publicId;

  const [creatorInfo, setCreatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carga los datos del creador
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

  // Redirección al crear chat
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

  // Renderizado Principal
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

      <AnonMessageForm
        publicId={publicId}
        onChatCreated={handleChatCreated}
        creatorName={creatorInfo.creatorName}
      />
    </div>
  );
}