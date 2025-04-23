"use client";

import React, { useState, useEffect, useRef } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRouter, useParams } from "next/navigation";
import { LoadingOutlined } from "@ant-design/icons";
import { Button, Spin, Flex, SelectProps } from "antd";

import GameContainer, { gameState } from "@/components/game/gameContainer";
import ActionCardComponent from "@/components/game/actionCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalUser } from "@/contexts/globalUser";
import { ActionCard, getActionCards } from "@/types/game/actioncard";
import { GameState } from "@/types/game/game";
import { getApiDomain } from "@/utils/domain";

export default function ActionCardPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const { user } = useGlobalUser();

  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<ActionCard | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [stompConnected, setStompConnected] = useState<boolean>(false);

  const stompClient = useRef<Client | null>(null);
  const gameSub = useRef<StompSubscription | null>(null);
  const errorSub = useRef<StompSubscription | null>(null);

  // 1) Initialize local game state & default selection
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    // grab from the shared gameState context
    setGame(gameState);
    const available = getActionCards(gameState.inventory.actionCards);
    setSelectedCard(available[0] || null);
    setLoading(false);
  }, [code, user, router]);

  // 2) Wire up STOMP subscriptions
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
        setStompConnected(true);

        // broadcast channel
        gameSub.current = client.subscribe(
          `/topic/lobby/${lobbyId}/game`,
          (msg) => {
            const { type: gType, payload } = JSON.parse(msg.body);
            // when all have submitted, server sends SCREEN_CHANGE → GUESS
            if (gType === "SCREEN_CHANGE" &&
                payload.screen === "GUESS" &&
                payload.actionCardsComplete) {
              router.push(`/games/${code}/guess`);
            }
          }
        );

        // personal queue for errors & replacements
        errorSub.current = client.subscribe(
          `/user/queue/lobby/${lobbyId}/game`,
          (msg) => {
            const { type: t, payload: pl } = JSON.parse(msg.body);
            if (t === "ERROR") {
              setNotification({
                type: "error",
                message: pl as string,
                onClose: () => setNotification(null),
              });
            }
            // Optionally handle ACTION_CARD_REPLACEMENT here if you
            // want to update game.inventory dynamically.
          }
        );
      },
      onStompError: (frame) => {
        setNotification({
          type: "error",
          message: frame.headers["message"] as string,
          onClose: () => setNotification(null),
        });
      },
      onDisconnect: () => {
        setStompConnected(false);
      },
    });

    stompClient.current = client;
    client.activate();

    return () => {
      stompClient.current?.deactivate();
      gameSub.current?.unsubscribe();
      errorSub.current?.unsubscribe();
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

    stompClient.current?.publish({
      destination: `/app/lobby/${lobbyId}/game/play-action-card`,
      body: JSON.stringify({
        actionCardId: selectedCard.identifier,
        targetPlayerToken: selectedUsername,
      }),
    });
  };

  const handleSkip = () => {
    // if you want to let players skip, notify server that they're done
    if (!stompConnected) return;
    const stored = localStorage.getItem("lobbyId");
    if (!stored) return;
    const lobbyId = parseInt(stored, 10);

    stompClient.current?.publish({
      destination: `/app/lobby/${lobbyId}/game/action-cards-complete`,
      body: "", // server just needs the frame to advance
    });
  };

  // 4) UI
  if (loading || !game) {
    return (
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
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
        <section
          style={{
            scrollSnapAlign: "center",
            scrollSnapType: "x mandatory",
            overflow: "scroll visible",
            maxWidth: "100%",
            height: "40vh",
            padding: "30px 10px",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "nowrap",
            gap: 20,
          }}
        >
          {getActionCards(game.inventory.actionCards).map((card, idx) => (
            <ActionCardComponent
              key={idx}
              selected={idx === selectedState}
              {...card}
              playerList={game.players.map(p => ({ label: p.username, value: p.username })) as SelectProps["options"]}
              onClick={() => {
                setSelectedCard(card);
                setSelectedState(idx);
              }}
              onChange={(username: string) => {
                setSelectedUsername(username);
              }}
            />
          ))}
        </section>
      </Flex>

      <Flex align="center" justify="center" gap={8} style={{ width: "100%" }}>
        <Button onClick={handleSubmit} type="primary" size="large">
          Select card
        </Button>
        <Button onClick={handleSkip} type="default" size="large">
          Skip
        </Button>
      </Flex>
    </GameContainer>
  );
}
