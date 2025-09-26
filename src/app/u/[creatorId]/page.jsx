"use client";
import React from "react";
import { useParams } from "next/navigation";
import MessageForm from "@/components/MessageForm";

export default function PublicPage() {
  const params = useParams();
  const { creatorId } = params;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Enviar mensaje</h1>
      <MessageForm creatorId={creatorId} />
    </div>
  );
}
