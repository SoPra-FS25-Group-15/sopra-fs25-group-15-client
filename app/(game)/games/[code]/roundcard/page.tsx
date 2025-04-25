/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import GameContainer from "@/components/game/gameContainer";
import RoundCardComponent from "@/components/game/roundCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { Button, Flex, Spin, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Client, StompSubscription, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useGlobalUser } from "@/contexts/globalUser";
import { useRouter, useParams } from "next/navigation";
import { getApiDomain } from "@/utils/domain";
import { getRoundCards, RoundCardIdentifier } from "@/types/game/roundcard";

export default function RoundCardPageComponent() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user } = useGlobalUser();

  const [notification, setNotification] = useState<NotificationProps | null>(null);
  // clean identifiers for rendering
  const [roundCardIds, setRoundCardIds] = useState<RoundCardIdentifier[]>([]);
  // full raw IDs including suffix, for submit
  const [rawRoundCardIds, setRawRoundCardIds] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lobbyId, setLobbyId] = useState<number | null>(null);
  const [isChooser, setIsChooser] = useState(false);

  const [stompConnected, setStompConnected] = useState(false);
  const stompClient = useRef<Client | null>(null);
  const gameSub = useRef<StompSubscription | null>(null);
  const stateSub = useRef<StompSubscription | null>(null);
  const errorSub = useRef<StompSubscription | null>(null);

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
      setLoading(false);
      return;
    }
    setLobbyId(parseInt(stored, 10));
  }, [user]);

  // 2) STOMP setup
  useEffect(() => {
    if (lobbyId == null || !user?.token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setStompConnected(true);

        // A) SCREEN_CHANGE
        gameSub.current = client.subscribe(`/topic/lobby/${lobbyId}/game`, (msg) => {
          const { type, payload } = JSON.parse(msg.body) as any;
          if (type === "SCREEN_CHANGE" && payload.screen === "ACTIONCARD") {
            router.push(`/games/${code}/actioncard`);
          }
        });

        // B) GAME_STATE
        stateSub.current = client.subscribe(`/user/queue/lobby/${lobbyId}/game/state`, (msg: IMessage) => {
          const { type, payload } = JSON.parse(msg.body);
          if (type === "GAME_STATE") {
            const rawIds: string[] = payload.inventory.roundCards;
            // keep raw for submission
            setRawRoundCardIds(rawIds);
            // derive clean identifiers
            const cleanIds = rawIds.map((raw) => raw.split("-")[0] as RoundCardIdentifier);
            setRoundCardIds(cleanIds);
            setSelectedIndex(0);
            // determine chooser by token prefix
            const myPrefix = user.token.split("-")[0];
            const turnPrefix = (payload.currentTurnPlayerToken || "").split("-")[0];
            setIsChooser(myPrefix === turnPrefix);
            setLoading(false);
          }
        });

        // pull initial state
        client.publish({
          destination: `/app/lobby/${lobbyId}/game/state`,
          body: "",
        });

        // C) ERROR
        errorSub.current = client.subscribe(`/user/queue/lobby/${lobbyId}/game`, (msg: IMessage) => {
          const { type, payload } = JSON.parse(msg.body);
          if (type === "ERROR") {
            setNotification({
              type: "error",
              message: payload as string,
              onClose: () => setNotification(null),
            });
          }
        });
      },
      onStompError: (frame) => {
        message.error(frame.headers["message"] as string);
      },
      onDisconnect: () => setStompConnected(false),
    });

    client.activate();
    stompClient.current = client;

    return () => {
      gameSub.current?.unsubscribe();
      stateSub.current?.unsubscribe();
      errorSub.current?.unsubscribe();
      client.deactivate();
    };
  }, [lobbyId, user?.token, code, router]);

  // 3) submit chosen full ID
  const handleSubmit = () => {
    if (!isChooser || !stompConnected || lobbyId == null) return;
    const chosenFullId = rawRoundCardIds[selectedIndex];
    stompClient.current!.publish({
      destination: `/app/lobby/${lobbyId}/game/select-round-card`,
      body: JSON.stringify({ roundCardId: chosenFullId }),
    });
  };

  // 4) render
  if (loading) {
    return (
      <GameContainer>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </GameContainer>
    );
  }
  if (!roundCardIds.length) {
    return (
      <GameContainer>
        <p style={{ color: "#fff", textAlign: "center" }}>No round cards available.</p>
      </GameContainer>
    );
  }
  if (isChooser) {
    return (
      <GameContainer leftHidden>
        {notification && <Notification {...notification} />}
        <h1 style={{ textAlign: "center" }}>Select your round card</h1>
        <section style={{ display: "flex", gap: 20, padding: 20, overflowX: "auto", height: 350 }}>
          {getRoundCards(roundCardIds).map((card, i) => (
            <RoundCardComponent key={i} selected={i === selectedIndex} {...card} onClick={() => setSelectedIndex(i)} />
          ))}
        </section>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Button type="primary" size="large" onClick={handleSubmit}>
            Play this card
          </Button>
        </div>
      </GameContainer>
    );
  }
  return (
    <GameContainer leftHidden>
      {notification && <Notification {...notification} />}
      <h1 style={{ textAlign: "center", padding: 30 }}>Waiting for the chooser to pick…</h1>
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%" }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    </GameContainer>
  );
}
