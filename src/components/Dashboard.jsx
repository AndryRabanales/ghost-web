"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import MessageList from "@/components/MessageList";
import CreateRoundButton from "@/components/CreateRoundButton";

const API = "https://ghost-api-2qmr.onrender.com";

export default function DashboardCreatorIdPage() {
  const params = useParams();
  const creatorId = params?.creatorId;

  const [messages, setMessages] = useState([]);
  const [roundId, setRoundId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar ronda actual
  useEffect(() => {
    if (creatorId) getCurrentRound(creatorId);
  }, [creatorId]);

  const getCurrentRound = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/rounds/current/${id}`);
      const round = await res.json();
      if (round?.id) setRoundId(round.id);
      else setRoundId(null);
    } catch (err) {
      console.error(err);
      setRoundId(null);
    } finally {
      setLoading(false);
    }
  };

  // Cargar mensajes
  const fetchMessages = async (rid) => {
    try {
      const res = await fetch(
