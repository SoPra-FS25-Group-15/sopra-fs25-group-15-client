/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useRef } from "react";
import GameContainer from "@/components/game/gameContainer";
import RoundCardComponent from "@/components/game/roundCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { Button, Spin, Flex, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Client, StompSubscription } from "@stomp/stompjs";
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
  const [roundCardIds, setRoundCardIds] = useState<RoundCardIdentifier[]>([]);
  const [selectedState, setSelectedState] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lobbyIdNumber, setLobbyIdNumber] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // FIRST‐ROUND chooser is a **token** stored by the lobby page under “roundChooser”
  // LATER‐ROUND chooser is a **username** stored by the results page under “roundChooserUsername”
  const [chooserToken, setChooserToken] = useState<string | null>(null);
  const [chooserUsername, setChooserUsername] = useState<string | null>(null);

  const [stompConnected, setStompConnected] = useState(false);
  const stompClient = useRef<Client | null>(null);
  const gameSub = useRef<StompSubscription | null>(null);
  const errorSub = useRef<StompSubscription | null>(null);

  // 1) Load initial chooserToken & chooserUsername, then fetch the cards :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("roundChooser");
    const username = localStorage.getItem("roundChooserUsername");
    setChooserToken(token);
    setChooserUsername(username);

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

    fetch(`${getApiDomain()}/games/data?lobbyId=${lobbyId}`, {
      headers: { "Content-Type": "application/json", Authorization: user.token },
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
        return JSON.parse(text) as { roundCards: { id: string }[] };
      })
      .then((data) => {
        setRoundCardIds(data.roundCards.map((c) => c.id as RoundCardIdentifier));
        setSelectedState(0);
      })
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  // 2) STOMP → SCREEN_CHANGE / ERROR :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3}
  useEffect(() => {
    if (loading || !user?.token || lobbyIdNumber === null) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setStompConnected(true);

        gameSub.current = client.subscribe(
          `/topic/lobby/${lobbyIdNumber}/game`,
          (msg) => {
            const { type: gType, payload } = JSON.parse(msg.body);
            if (gType === "SCREEN_CHANGE" && payload.screen === "ACTIONCARD") {
              router.push(`/games/${code}/actioncard`);
            }
          }
        );

        errorSub.current = client.subscribe(
          `/user/queue/lobby/${lobbyIdNumber}/game`,
          (msg) => {
            const { type, payload } = JSON.parse(msg.body);
            if (type === "ERROR") {
              setNotification({ type: "error", message: payload as string, onClose: () => setNotification(null) });
            }
          }
        );
      },
      onStompError: (frame) => message.error(frame.headers["message"] as string),
      onDisconnect: () => setStompConnected(false),
    });

    client.activate();
    stompClient.current = client;
    return () => {
      gameSub.current?.unsubscribe();
      errorSub.current?.unsubscribe();
      client.deactivate();
    };
  }, [loading, user?.token, lobbyIdNumber, code, router]);

  // 3) Only the chooser (token OR username) can submit
  const isFirstChooser = chooserToken === user?.token;
  const isLaterChooser = chooserUsername === user?.username;
  const isChooser = isFirstChooser || isLaterChooser;

  const handleSubmit = () => {
    if (!stompConnected || lobbyIdNumber === null) return;
    const type = roundCardIds[selectedState];
    const prefix = user!.token.substring(0, 8);
    const chosenId = `${type}-${prefix}`;
    stompClient.current!.publish({
      destination: `/app/lobby/${lobbyIdNumber}/game/select-round-card`,
      body: JSON.stringify({ roundCardId: chosenId }),
    });
  };

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
        <p style={{ color: "#fff", textAlign: "center" }}>
          No round cards received. Please check you’re still in the lobby.
        </p>
      </GameContainer>
    );
  }

  if (isChooser) {
    return (
      <GameContainer>
        {notification && <Notification {...notification} />}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1>It’s on you to set the rules</h1>
          <h2>Play one of your round cards</h2>
        </div>
        <section
          style={{
            overflowX: "auto",
            display: "flex",
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

  return (
    <GameContainer>
      {notification && <Notification {...notification} />}
      <div style={{ textAlign: "center", padding: 30 }}>
        <h1>Waiting for the round card to be chosen…</h1>
      </div>
    </GameContainer>
  );
}
