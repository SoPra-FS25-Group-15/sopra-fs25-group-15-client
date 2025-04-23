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
import { getRoundCards, RoundCardIdentifier, RoundCard } from "@/types/game/roundcard";

interface ServerRoundCardDTO {
  id: string;
  name: string;
  description: string;
  modifiers: {
    time: number;
    guessType?: string | null;
    streetView?: string | null;
  };
}

export default function RoundCardPageComponent() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user } = useGlobalUser();

  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [serverRoundCards, setServerRoundCards] = useState<ServerRoundCardDTO[]>([]);
  const [selectedState, setSelectedState] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lobbyIdNumber, setLobbyIdNumber] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentChooserToken, setCurrentChooserToken] = useState<string | null>(null);

  const stompClient = useRef<Client | null>(null);
  const gameSub     = useRef<StompSubscription | null>(null);

  // 1) Read chooser & lobbyId, then have *only* the chooser fetch the data
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;

    const chooser = localStorage.getItem("roundChooser");
    setCurrentChooserToken(chooser);

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

    // Only the chooser actually fetches the card-list
    if (user.token !== chooser) {
      setLoading(false);
      return;
    }

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
        return JSON.parse(text);
      })
      .then((data: { roundCards: ServerRoundCardDTO[] }) => {
        console.log("[RoundCardPage] parsed data:", data);
        setServerRoundCards(data.roundCards);
        setSelectedState(0);
      })
      .catch((err) => {
        console.error("[RoundCardPage] error fetching game data", err);
        setFetchError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  // 2) STOMP → listen for SCREEN_CHANGE → ACTIONCARD
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
        gameSub.current = client.subscribe(
          `/topic/lobby/${lobbyIdNumber}/game`,
          (msg) => {
            const { type: gType, payload: gPayload } = JSON.parse(msg.body);
            if (gType === "SCREEN_CHANGE" && gPayload.screen === "ACTIONCARD") {
              router.push(`/games/${code}/actioncard`);
            }
          }
        );
      },
      onStompError: (frame) =>
        setNotification({
          type: "error",
          message: frame.headers["message"],
          onClose: () => setNotification(null),
        }),
    });

    stompClient.current = client;
    client.activate();
    return () => {
      stompClient.current?.deactivate();
      gameSub.current?.unsubscribe();
    };
  }, [loading, user?.token, lobbyIdNumber, code, router]);

  // 3) Submit the chosen card
  function handleSubmit() {
    if (!user) {
      setNotification({
        type: "error",
        message: "Please log in first",
        onClose: () => setNotification(null),
      });
      return;
    }
    if (lobbyIdNumber === null) {
      setNotification({
        type: "error",
        message: "Lobby ID not ready",
        onClose: () => setNotification(null),
      });
      return;
    }
    if (serverRoundCards.length === 0) {
      setNotification({
        type: "error",
        message: "No round cards available",
        onClose: () => setNotification(null),
      });
      return;
    }

    const chosenId = serverRoundCards[selectedState].id;
    stompClient.current?.publish({
      destination: `/app/lobby/${lobbyIdNumber}/game/select-round-card`,
      body: JSON.stringify({ roundCardId: chosenId }),
    });
  }

  // 4) Render phases
  if (loading) {
    return (
      <GameContainer>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </GameContainer>
    );
  }

  // non-choosers just wait
  if (user?.token !== currentChooserToken) {
    return (
      <GameContainer>
        <div style={{ textAlign: "center", padding: 30 }}>
          <h1>Waiting for the round card to be chosen…</h1>
        </div>
      </GameContainer>
    );
  }

  if (fetchError) {
    return (
      <GameContainer>
        <p style={{ color: "red", textAlign: "center" }}>
          Error loading round cards: {fetchError}
        </p>
      </GameContainer>
    );
  }

  if (serverRoundCards.length === 0) {
    return (
      <GameContainer>
        <p style={{ color: "#fff", textAlign: "center" }}>
          No round cards received. Please check you’re still in the lobby.
        </p>
      </GameContainer>
    );
  }

  // Merge server data (name/description/time) with your static mapping (for icons, guesses/map defaults)
  const staticCards = getRoundCards(
    serverRoundCards.map((c) => c.id as RoundCardIdentifier)
  );
  const combinedCards: RoundCard[] = staticCards.map((staticCard) => {
    const serverCard = serverRoundCards.find((c) => c.id === staticCard.identifier);
    return serverCard
      ? {
          ...staticCard,
          title: serverCard.name,
          description: serverCard.description,
          modifiers: {
            ...staticCard.modifiers,
            time: serverCard.modifiers.time,
            streetview:
              serverCard.modifiers.streetView ?? staticCard.modifiers.streetview,
          },
        }
      : staticCard;
  });

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
          gap: 20,
          padding: "30px 10px",
          height: "50vh",
        }}
      >
        {combinedCards.map((card, idx) => (
          <RoundCardComponent
            key={card.identifier}
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
