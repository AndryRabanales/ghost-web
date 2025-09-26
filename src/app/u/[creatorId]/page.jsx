"use client";
import React from "react";
import { useParams } from "next/navigation";
import MessageForm from "@/components/MessageForm";

export default function PublicPage() {
  const { publicId } = useParams();

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Enviar mensaje anónimo</h1>
      <MessageForm publicId={publicId} />
    </div>
  );
}
