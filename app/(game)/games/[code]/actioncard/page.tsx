"use client";

import React, { useState, useEffect, useRef } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRouter, useParams } from "next/navigation";
import { LoadingOutlined } from "@ant-design/icons";
import { Button, Spin, Flex } from "antd";

import GameContainer, { gameState } from "@/components/game/gameContainer";
import ActionCardComponent from "@/components/game/actionCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalUser } from "@/contexts/globalUser";
import { getApiDomain } from "@/utils/domain";
import { ActionCard, getActionCards } from "@/types/game/actioncard";
import { GameState } from "@/types/game/game";

export default function ActionCardPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const { user } = useGlobalUser();

  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<ActionCard | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stompConnected, setStompConnected] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const stompClient = useRef<Client | null>(null);
  const gameSub = useRef<StompSubscription | null>(null);
  const errorSub = useRef<StompSubscription | null>(null);

  // 1) Initialize local game state & default selection
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setGame(gameState);
    const available = getActionCards(gameState.inventory.actionCards);
    setSelectedCard(available[0] || null);
    setLoading(false);
  }, [code, user, router]);

  // 2) STOMP setup — now only navigating on ROUND_START, after storing coords
  useEffect(() => {
    if (loading || !user?.token) return;

    const stored = localStorage.getItem("lobbyId");
    if (!stored) {
      setNotification({
        type: "error",
        message: "Lobby ID missing, please re-join.",
        onClose: () => setNotification(null),
      });
      return;
    }
    const lobbyId = parseInt(stored, 10);

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("[ActionCardPage] STOMP connected");
        setStompConnected(true);

        // Broadcast channel: wait for ROUND_START
        gameSub.current = client.subscribe(
          `/topic/lobby/${lobbyId}/game`,
          (msg) => {
            const { type: gType, payload } = JSON.parse(msg.body as string);
            console.log("[ActionCardPage] Received", gType, payload);
            if (gType === "ROUND_START") {
              // Persist the coordinates + time before navigating
              const dto = payload.roundData;
              console.log("[ActionCardPage] Storing round data:", dto);
              localStorage.setItem("roundLatitude", dto.latitude.toString());
              localStorage.setItem("roundLongitude", dto.longitude.toString());
              localStorage.setItem("roundTime", dto.roundTime.toString());

              console.log("[ActionCardPage] Routing to /guess");
              router.push(`/games/${code}/guess`);
            }
          }
        );

        // Personal queue for ERRORs & replacements
        errorSub.current = client.subscribe(
          `/user/queue/lobby/${lobbyId}/game`,
          (msg) => {
            const { type: t, payload: pl } = JSON.parse(msg.body as string);
            if (t === "ERROR") {
              setNotification({
                type: "error",
                message: pl as string,
                onClose: () => setNotification(null),
              });
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error("[ActionCardPage] STOMP error:", frame.headers["message"]);
        setNotification({
          type: "error",
          message: frame.headers["message"] as string,
          onClose: () => setNotification(null),
        });
      },
      onDisconnect: () => {
        console.log("[ActionCardPage] STOMP disconnected");
        setStompConnected(false);
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      console.log("[ActionCardPage] Cleaning up STOMP subscriptions");
      gameSub.current?.unsubscribe();
      errorSub.current?.unsubscribe();
      client.deactivate();
    };
  }, [loading, user?.token, code, router]);

  // 3) Handlers
  const handleSubmit = () => {
    if (!selectedCard) {
      setNotification({ type: "error", message: "Please select a card", onClose: () => setNotification(null) });
      return;
    }
    if (selectedCard.type === "punishment" && !selectedUsername) {
      setNotification({ type: "error", message: "Please select a player to punish", onClose: () => setNotification(null) });
      return;
    }
    if (!stompConnected) return;
    const stored = localStorage.getItem("lobbyId");
    if (!stored) return;
    const lobbyId = parseInt(stored, 10);

    console.log("[ActionCardPage] Publishing play-action-card", selectedCard.identifier, selectedUsername);
    stompClient.current?.publish({
      destination: `/app/lobby/${lobbyId}/game/play-action-card`,
      body: JSON.stringify({
        actionCardId: selectedCard.identifier,
        targetPlayerToken: selectedUsername,
      }),
    });

    setSubmitted(true);
  };

  const handleSkip = () => {
    if (!stompConnected) return;
    const stored = localStorage.getItem("lobbyId");
    if (!stored) return;
    const lobbyId = parseInt(stored, 10);

    console.log("[ActionCardPage] Publishing action-cards-complete");
    stompClient.current?.publish({
      destination: `/app/lobby/${lobbyId}/game/action-cards-complete`,
      body: "",
    });

    setSubmitted(true);
  };

  // Render
  if (loading || !game) {
    return (
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    );
  }
  if (submitted) {
    return (
      <GameContainer>
        {notification && <Notification {...notification} />}
        <div style={{ textAlign: "center", padding: 30 }}>
          <h1>Waiting for other players to submit…</h1>
        </div>
      </GameContainer>
    );
  }
  return (
    <GameContainer>
      {notification && <Notification {...notification} />}

      <Flex vertical align="center" justify="center" gap={10} style={{ width: "100%" }}>
        <h1>Choose an action card</h1>
        <h2>Or skip to keep them for later</h2>
      </Flex>

      <Flex vertical align="center" justify="center" gap={10} style={{ width: "100%" }}>
        <section style={{ overflowX: "auto", display: "flex", gap: 20, padding: "30px 10px", height: "40vh" }}>
          {getActionCards(game.inventory.actionCards).map((card, idx) => (
            <ActionCardComponent
              key={idx}
              selected={idx === idx}
              {...card}
              playerList={game.players.map(p => ({ label: p.username, value: p.username }))}
              onClick={() => setSelectedCard(card)}
              onChange={(username: string) => setSelectedUsername(username)}
            />
          ))}
        </section>
      </Flex>

      <Flex align="center" justify="center" gap={8} style={{ width: "100%" }}>
        <Button onClick={handleSubmit} type="primary" size="large">Select card</Button>
        <Button onClick={handleSkip} type="default" size="large">Skip</Button>
      </Flex>
    </GameContainer>
  );
}
