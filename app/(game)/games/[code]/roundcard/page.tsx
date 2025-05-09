"use client";

import GameContainer from "@/components/game/gameContainer";
import RoundCardComponent from "@/components/game/roundCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalGameState } from "@/contexts/globalGameState";
import { useGlobalUser } from "@/contexts/globalUser";
import useLocalStorage from "@/hooks/useLocalStorage";
import useOnceWhenReady from "@/hooks/useOnceWhenReady";
import { GameState } from "@/types/game/game";
import { getRoundCards, RoundCardIdentifier } from "@/types/game/roundcard";
import { getApiDomain } from "@/utils/domain";
import { LoadingOutlined } from "@ant-design/icons";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { Button, Flex, message, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";

const RoundCardPageComponent: React.FC = () => {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user } = useGlobalUser();
  const { gameState } = useGlobalGameState();

  const { set: setGameState } = useLocalStorage<Partial<GameState> | null>("gameState", null);

  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [selectedId, setSelectedId] = useState<RoundCardIdentifier | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
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
      return;
    }
    setLobbyId(parseInt(stored));
  }, [user]);

  // 2) STOMP setup - run once when lobbyId and user are ready
  useOnceWhenReady([lobbyId, user], () => {
    if (!user || !lobbyId) return; // telling TypeScript that the values will not be null

    const client = new Client({
      webSocketFactory: () => new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        setStompConnected(true);

        // A) GAME_STATE
        stateSub.current = client.subscribe(`/user/queue/lobby/${lobbyId}/game/state`, (msg: IMessage) => {
          const { type, payload }: { type: string; payload: GameState } = JSON.parse(msg.body);
          if (type === "GAME_STATE") {
            console.log("[RoundCardPage] Received game state", payload);
            // persist game state in local storage
            setGameState(payload);

            if (payload.currentScreen === "ACTIONCARD") {
              router.push(`/games/${code}/actioncard`);
            }

            setSelectedId(payload.inventory.roundCards[0]);
            setIsChooser(user.username === payload.roundCardSubmitter);
          }
        });

        // B) INITIAL GAME STATE REQUEST
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
  });

  // 3) submit chosen full ID
  const handleSubmit = () => {
    if (!isChooser || !stompConnected || lobbyId == null) return;
    stompClient.current!.publish({
      destination: `/app/lobby/${lobbyId}/game/select-round-card`,
      body: JSON.stringify({ roundCardId: selectedId }),
    });
  };

  // 4) render
  if (isChooser && gameState) {
    return (
      <GameContainer showPickedRoundCardContainer={false}>
        {notification && <Notification {...notification} />}
        <h1 style={{ textAlign: "center" }}>Select your round card</h1>
        <section style={{ display: "flex", gap: 20, padding: 20, overflowX: "auto", height: 350 }}>
          {gameState.inventory &&
            getRoundCards(
              gameState.inventory.roundCards.map((rawId) => rawId.split("-")[0] as RoundCardIdentifier)
            ).map((card, i) => (
              <RoundCardComponent
                key={i}
                selected={i === selectedIndex}
                {...card}
                onClick={() => {
                  setSelectedId(gameState.inventory!.roundCards[i]);
                  setSelectedIndex(i);
                }}
              />
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
    <GameContainer showPickedRoundCardContainer={false}>
      {notification && <Notification {...notification} />}
      <h1 style={{ textAlign: "center", padding: 30 }}>Waiting for the chooser to pick…</h1>
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%" }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    </GameContainer>
  );
};

export default RoundCardPageComponent;
