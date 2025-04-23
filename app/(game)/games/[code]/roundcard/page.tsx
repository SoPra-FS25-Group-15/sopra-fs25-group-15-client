"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Spin } from "antd";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRouter, useParams } from "next/navigation";
import { useGlobalUser } from "@/contexts/globalUser";
import GameContainer from "@/components/game/gameContainer";
import RoundCardComponent from "@/components/game/roundCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { getApiDomain } from "@/utils/domain";
import { getRoundCards, RoundCardIdentifier } from "@/types/game/roundcard";

interface ServerRoundCardDTO {
  id: string;
  name: string;
  description: string;
  modifiers: {
    time: number;
    guessType?: string;
    streetView?: string;
    map?: string;
    guesses?: number;
  };
}

export default function RoundCardPageComponent() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user } = useGlobalUser();

  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [roundCardIds, setRoundCardIds] = useState<RoundCardIdentifier[]>([]);
  const [selectedState, setSelectedState] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lobbyIdNumber, setLobbyIdNumber] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentChooserToken, setCurrentChooserToken] = useState<string | null>(null);

  // STOMP / debugging
  const [stompConnected, setStompConnected] = useState(false);
  const stompClient = useRef<Client | null>(null);
  const gameSub = useRef<StompSubscription | null>(null);
  const errorSub = useRef<StompSubscription | null>(null);

  // 1) Load chooser token & lobbyId, then fetch the round cards (global metadata)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return; // wait for globalUser

    const chooser = localStorage.getItem("roundChooser");
    if (chooser && currentChooserToken === null) {
      setCurrentChooserToken(chooser);
    }

    const stored = localStorage.getItem("lobbyId");
    if (!stored) {
      setNotification({
        type: "error",
        message: "Lobby ID missing, please re-join.",
        onClose: () => setNotification(null),
      });
      setLoading(false);
      return;
    }
    const lobbyId = parseInt(stored, 10);
    setLobbyIdNumber(lobbyId);

    const url = `${getApiDomain()}/games/data?lobbyId=${lobbyId}`;
    console.log("[RoundCardPage] fetching", url, "with token", user.token);
    fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: user.token,
      },
    })
      .then(async (res) => {
        const text = await res.text();
        console.log("[RoundCardPage] raw response:", res.status, text);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
        return JSON.parse(text) as { roundCards: ServerRoundCardDTO[] };
      })
      .then((data) => {
        console.log("[RoundCardPage] parsed data:", data);
        const ids = data.roundCards.map((c) => c.id as RoundCardIdentifier);
        setRoundCardIds(ids);
        setSelectedState(0);
      })
      .catch((err) => {
        console.error("[RoundCardPage] error fetching game data", err);
        setFetchError(err.message);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // 2) STOMP subscriptions: broadcast + personal ERROR queue
  useEffect(() => {
    if (loading || !user?.token || lobbyIdNumber === null) return;

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("[RoundCardPage] STOMP connected");
        setStompConnected(true);

        // 2a) Broadcast channel
        gameSub.current = client.subscribe(
          `/topic/lobby/${lobbyIdNumber}/game`,
          (msg) => {
            const { type: gType, payload: gPayload } = JSON.parse(msg.body);
            console.log("[RoundCardPage] broadcast:", gType, gPayload);
            if (gType === "SCREEN_CHANGE" && gPayload.screen === "ACTIONCARD") {
              console.log("[RoundCardPage] routing to actioncard");
              router.push(`/games/${code}/actioncard`);
            }
          }
        );

        // 2b) Personal queue for ERROR messages
        errorSub.current = client.subscribe(
          `/user/queue/lobby/${lobbyIdNumber}/game`,
          (msg) => {
            console.log("[RoundCardPage] personal msg:", msg.body);
            const { type, payload } = JSON.parse(msg.body);
            if (type === "ERROR") {
              setNotification({
                type: "error",
                message: payload as string,
                onClose: () => setNotification(null),
              });
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error("[RoundCardPage] STOMP error:", frame.headers["message"]);
        setNotification({
          type: "error",
          message: frame.headers["message"] as string,
          onClose: () => setNotification(null),
        });
      },
      onDisconnect: () => {
        console.log("[RoundCardPage] STOMP disconnected");
        setStompConnected(false);
      },
    });

    stompClient.current = client;
    client.activate();

    return () => {
      // stompClient.current?.deactivate();
      gameSub.current?.unsubscribe();
      errorSub.current?.unsubscribe();
    };
  }, [loading, user?.token, lobbyIdNumber, code, router]);

  // 3) When the chooser hits “Select”, compute full card ID and send it
  function handleSubmit() {
    console.log("[RoundCardPage] handleSubmit");
    if (!user) {
      setNotification({ type: "error", message: "Please log in first", onClose: () => setNotification(null) });
      return;
    }
    if (lobbyIdNumber === null) {
      setNotification({ type: "error", message: "Lobby ID not ready", onClose: () => setNotification(null) });
      return;
    }
    if (roundCardIds.length === 0) {
      setNotification({ type: "error", message: "No round cards available", onClose: () => setNotification(null) });
      return;
    }
    if (!stompConnected) {
      setNotification({
        type: "error",
        message: "Still connecting… please wait a moment",
        onClose: () => setNotification(null),
      });
      return;
    }

    // *** CLIENT SOLUTION: append your token prefix to the type ***
    const type = roundCardIds[selectedState];               // e.g. "world" or "flash"
    const prefix = user.token.substring(0, 8);               // same logic as server
    const chosenId = `${type}-${prefix}`;                    // e.g. "world-be88289b"
    console.log("[RoundCardPage] publishing select-round-card:", { lobbyIdNumber, chosenId });

    stompClient.current?.publish({
      destination: `/app/lobby/${lobbyIdNumber}/game/select-round-card`,
      body: JSON.stringify({ roundCardId: chosenId }),
    });
  }

  // 4) Render
  if (loading) {
    return (
      <GameContainer>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </GameContainer>
    );
  }

  if (fetchError) {
    return (
      <GameContainer>
        <p style={{ color: "red", textAlign: "center" }}>Error loading round cards: {fetchError}</p>
      </GameContainer>
    );
  }

  if (roundCardIds.length === 0) {
    return (
      <GameContainer>
        <p style={{ color: "#fff", textAlign: "center" }}>No round cards received. Please check you’re still in the lobby.</p>
      </GameContainer>
    );
  }

  // only the chooser sees the card-picker UI
  if (user?.token === currentChooserToken) {
    return (
      <GameContainer>
        {notification && <Notification {...notification} />}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1>It’s on you to set the rules</h1>
          <h2>Play one of your round cards</h2>
        </div>
        <section
          style={{
            scrollSnapType: "x mandatory",
            overflowX: "auto",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "nowrap",
            gap: 20,
            padding: "30px 10px",
            height: "50vh",
          }}
        >
          {getRoundCards(roundCardIds).map((card, idx) => (
            <RoundCardComponent
              key={idx}
              selected={idx === selectedState}
              {...card}
              onClick={() => setSelectedState(idx)}
            />
          ))}
        </section>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Button onClick={handleSubmit} type="primary" size="large">
            Select card
          </Button>
        </div>
      </GameContainer>
    );
  }

  // everyone else just waits
  return (
    <GameContainer>
      {notification && <Notification {...notification} />}
      <div style={{ textAlign: "center", padding: 30 }}>
        <h1>Waiting for the round card to be chosen…</h1>
      </div>
    </GameContainer>
  );
}
