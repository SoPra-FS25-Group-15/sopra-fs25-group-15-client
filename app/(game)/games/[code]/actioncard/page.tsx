"use client";

import React, { useState, useEffect, useRef } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRouter, useParams } from "next/navigation";
import { LoadingOutlined } from "@ant-design/icons";
import { Button, Spin, Flex } from "antd";

import GameContainer from "@/components/game/gameContainer";
import ActionCardComponent from "@/components/game/actionCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalUser } from "@/contexts/globalUser";
import { getApiDomain } from "@/utils/domain";
import { ActionCard, getActionCards } from "@/types/game/actioncard";
import { GameState } from "@/types/game/game";
import { useGlobalGameState } from "@/contexts/globalGameState";
import useOnceWhenReady from "@/hooks/useOnceWhenReady";
import useLocalStorage from "@/hooks/useLocalStorage";

export default function ActionCardPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const { user } = useGlobalUser();
  const { gameState } = useGlobalGameState();

  const { set: setGameState } = useLocalStorage<Partial<GameState> | null>("gameState", null);

  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [lobbyId, setLobbyId] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<ActionCard | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [stompConnected, setStompConnected] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const stompClient = useRef<Client | null>(null);
  const gameSub = useRef<StompSubscription | null>(null);
  const errorSub = useRef<StompSubscription | null>(null);
  const stateSub = useRef<StompSubscription | null>(null);

  // 1) Load lobbyId
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("lobbyId");
    if (!stored) {
      setNotification({
        type: "error",
        message: "Lobby ID missing, please re-join.",
        onClose: () => setNotification(null),
      });
      return;
    }
    setLobbyId(parseInt(stored));
  }, [user]);

  // 2) STOMP setup — run once when lobbyId and user are ready
  useOnceWhenReady([lobbyId, user], () => {
    if (!user || !lobbyId) return; // telling TypeScript that the values will not be null

    const client = new Client({
      webSocketFactory: () => new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("[ActionCardPage] STOMP connected");
        setStompConnected(true);

        // A) GAME STATE
        stateSub.current = client.subscribe(`/user/queue/lobby/${lobbyId}/game/state`, (msg: IMessage) => {
          const { type, payload }: { type: string; payload: GameState } = JSON.parse(msg.body);
          if (type === "GAME_STATE") {
            setGameState(payload);

            if (payload.currentScreen === "GUESS") {
              router.push(`/games/${code}/guess`);
            }

            if (payload.inventory.actionCards.length > 0) {
              setSelectedCard(getActionCards([payload.inventory.actionCards[0]])[0] || null);
              setSelectedUsername(null);
            }
          }
        });

        // B) ACTION CARD EFFECTS (Should be part of game state)
        gameSub.current = client.subscribe(`/topic/lobby/${lobbyId}/game`, (msg) => {
          const { type: gType, payload } = JSON.parse(msg.body as string);
          console.log("[ActionCardPage] Received", gType, payload);
          if (gType === "ROUND_START") {
            const { actionCardEffects } = payload;
            localStorage.setItem("actionCardEffects", JSON.stringify(actionCardEffects));
          }
        });

        // c) INITIAL GAME STATE REQUEST
        client.publish({
          destination: `/app/lobby/${lobbyId}/game/state`,
          body: "",
        });

        // D) ERROR
        errorSub.current = client.subscribe(`/user/queue/lobby/${lobbyId}/game`, (msg) => {
          const { type: t, payload: pl } = JSON.parse(msg.body as string);
          if (t === "ERROR") {
            setNotification({
              type: "error",
              message: pl as string,
              onClose: () => setNotification(null),
            });
          }
        });
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
      stateSub.current?.unsubscribe();
      client.deactivate();
    };
  });

  // 3) Handlers
  const handleSubmit = () => {
    if (!stompConnected) {
      setNotification({
        type: "error",
        message: "Could not connect to the game server, please reload the page and try again.",
        onClose: () => setNotification(null),
      });
      return;
    }
    console.log("🔍 handleSubmit – selectedCard:", selectedCard, "selectedUsername:", selectedUsername);
    if (!selectedCard) {
      setNotification({
        type: "error",
        message: "Please select a card",
        onClose: () => setNotification(null),
      });
      return;
    }
    if (selectedCard.type === "punishment" && !selectedUsername) {
      setNotification({
        type: "error",
        message: "Please select a player to punish",
        onClose: () => setNotification(null),
      });
      return;
    }

    console.log("[ActionCardPage] Publishing play-action-card", selectedCard.identifier, selectedUsername);
    stompClient.current?.publish({
      destination: `/app/lobby/${lobbyId}/game/play-action-card`,
      body: JSON.stringify({
        actionCardId: selectedCard.identifier,
        targetUsername: selectedUsername,
      }),
    });

    setSubmitted(true);
  };

  // Render
  if (submitted) {
    return (
      <GameContainer>
        {notification && <Notification {...notification} />}
        <div style={{ textAlign: "center", padding: 30 }}>
          <h1>Waiting for other players to submit…</h1>
        </div>
        <Flex justify="center" align="center" style={{ width: "100%", height: "100%" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        </Flex>
      </GameContainer>
    );
  }
  return (
    <GameContainer>
      {notification && <Notification {...notification} />}

      <Flex vertical align="center" justify="center" gap={10} style={{ width: "100%" }}>
        <h1>Choose an action card</h1>
      </Flex>

      <Flex vertical align="center" justify="center" gap={10} style={{ width: "100%" }}>
        <section
          style={{
            overflowX: "auto",
            display: "flex",
            gap: 20,
            padding: "30px 10px",
            height: 350,
          }}
        >
          {gameState && gameState.inventory ? (
            getActionCards(gameState.inventory.actionCards).map((card, idx) => (
              <ActionCardComponent
                key={idx}
                selected={card.identifier === selectedCard?.identifier}
                {...card}
                playerList={(gameState.players ?? [])
                  .filter((p) => p.username !== user?.username)
                  .map((p) => ({ label: p.username, value: p.username }))}
                onClick={() => setSelectedCard(card)}
                onChange={(token: string) => setSelectedUsername(token)}
              />
            ))
          ) : (
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          )}
        </section>
      </Flex>

      <Flex align="center" justify="center" gap={8} style={{ width: "100%" }}>
        <Button onClick={handleSubmit} type="primary" size="large">
          Select card
        </Button>
      </Flex>
    </GameContainer>
  );
}
