"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Flex, Spin } from "antd";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import GameContainer, { gameState } from "@/components/game/gameContainer";
import RoundCardComponent from "@/components/game/roundCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalUser } from "@/contexts/globalUser";
import { useRouter, useParams } from "next/navigation";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { GameState } from "@/types/game/game";
import { getRoundCards, RoundCardIdentifier } from "@/types/game/roundcard";
import { getApiDomain } from "@/utils/domain";

const RoundCardPageComponent: React.FC = () => {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const { user } = useGlobalUser();

  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedId, setSelectedId] = useState<RoundCardIdentifier | null>(null);
  const [selectedState, setSelectedState] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lobbyIdNumber, setLobbyIdNumber] = useState<number | null>(null);

  // Who gets to choose
  const [currentChooserToken, setCurrentChooserToken] = useState<string | null>(null);

  // STOMP ref
  const gameSub = useRef<StompSubscription | null>(null);
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    // Redirect if no user
    if (typeof window !== "undefined") {
      if (!localStorage.getItem("user")) {
        router.push("/login");
        return;
      }
      if (!user) {
        return; // wait for context
      }
    }

    // 1) seed placeholder state
    setGame(gameState);
    setSelectedId(gameState.inventory.roundCards[0]);

    // 2) load and clear the chooser token
    const chooser = localStorage.getItem("roundChooser");
    if (chooser) {
      setCurrentChooserToken(chooser);
      localStorage.removeItem("roundChooser");
    }

    // 3) load numeric lobbyId
    const storedId = localStorage.getItem("lobbyId");
    if (!storedId) {
      setNotification({
        type: "error",
        message: "Lobby ID missing, please re‑join.",
        onClose: () => setNotification(null),
      });
      return;
    }
    const lobbyId = parseInt(storedId, 10);
    setLobbyIdNumber(lobbyId);
    setLoading(false);

    // 4) STOMP: subscribe to game topic directly
    if (user?.token) {
      const client = new Client({
        webSocketFactory: () => new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
        connectHeaders: { Authorization: `Bearer ${user.token}` },
        heartbeatIncoming: 0,
        heartbeatOutgoing: 0,
        reconnectDelay: 5000,
        onConnect: () => {
          gameSub.current = client.subscribe(
            `/topic/lobby/${lobbyId}/game`,
            (msg) => {
              const { type: gType, payload: gPayload } = JSON.parse(msg.body);
              // when it's time to go to action card:
              if (gType === "SCREEN_CHANGE" && gPayload.screen === "ACTIONCARD") {
                router.push(`/games/${code}/actioncard`);
              }
            }
          );
        },
        onStompError: (frame) => {
          setNotification({
            type: "error",
            message: frame.headers["message"],
            onClose: () => setNotification(null),
          });
        },
      });

      stompClient.current = client;
      client.activate();
    }

    return () => {
      stompClient.current?.deactivate();
      gameSub.current?.unsubscribe();
    };
  }, [code, user, router]);

  async function handleSubmit() {
    if (!user) {
      setNotification({ type: "error", message: "Please log in first", onClose: () => setNotification(null) });
      return;
    }
    if (!game) {
      setNotification({ type: "error", message: "Game data unavailable", onClose: () => setNotification(null) });
      return;
    }
    if (!selectedId) {
      setNotification({ type: "error", message: "Select a round card", onClose: () => setNotification(null) });
      return;
    }
    if (lobbyIdNumber === null) {
      setNotification({ type: "error", message: "Lobby ID not ready", onClose: () => setNotification(null) });
      return;
    }

    stompClient.current?.publish({
      destination: `/app/lobby/${lobbyIdNumber}/game/select-round-card`,
      body: JSON.stringify({ roundCardId: selectedId }),
    });
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    );
  }

  // chooser’s view
  if (game && user?.token === currentChooserToken) {
    return (
      <GameContainer>
        {notification && <Notification {...notification} />}
        <Flex vertical align="center" justify="center" gap={10} style={{ width: "100%" }}>
          <h1>It’s on you to set the rules</h1>
          <h2>Play one of your round cards</h2>
        </Flex>
        <section
          style={{
            scrollSnapType: "x mandatory",
            overflow: "auto",
            maxWidth: "100%",
            height: "50vh",
            padding: "30px 10px",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "nowrap",
            gap: 20,
          }}
        >
          {getRoundCards(game.inventory.roundCards).map((card, idx) => (
            <RoundCardComponent
              key={idx}
              selected={idx === selectedState}
              {...card}
              onClick={() => {
                setSelectedId(card.identifier);
                setSelectedState(idx);
              }}
            />
          ))}
        </section>
        <Flex align="center" justify="center" style={{ width: "100%" }}>
          <Button onClick={handleSubmit} type="primary" size="large">
            Select card
          </Button>
        </Flex>
      </GameContainer>
    );
  }

  // everyone else
  return (
    <GameContainer>
      <Flex vertical align="center" justify="center" gap={10} style={{ width: "100%" }}>
        <h1>Waiting for the round card to be chosen…</h1>
      </Flex>
    </GameContainer>
  );
};

export default RoundCardPageComponent;
