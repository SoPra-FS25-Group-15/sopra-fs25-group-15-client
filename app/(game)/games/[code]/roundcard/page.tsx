"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Flex, Spin } from "antd";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import GameContainer from "@/components/game/gameContainer";
import RoundCardComponent from "@/components/game/roundCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalUser } from "@/contexts/globalUser";
import { useRouter, useParams } from "next/navigation";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getRoundCards, RoundCardIdentifier } from "@/types/game/roundcard";
import { getApiDomain } from "@/utils/domain";

interface RoundCardDTO {
  id: string;
  name: string;
  description: string;
  modifiers: {
    time: number;
    guessType?: string;
    streetView?: string;
  };
}

export default function RoundCardPageComponent() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const { user } = useGlobalUser();

  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [roundCards, setRoundCards] = useState<RoundCardIdentifier[]>([]);
  const [selectedId, setSelectedId] = useState<RoundCardIdentifier | null>(null);
  const [selectedState, setSelectedState] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lobbyIdNumber, setLobbyIdNumber] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [currentChooserToken, setCurrentChooserToken] = useState<string | null>(null);
  const gameSub = useRef<StompSubscription | null>(null);
  const stompClient = useRef<Client | null>(null);

  // 1) On mount: load chooser token, lobbyId, then fetch real round cards
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!localStorage.getItem("user")) {
        router.push("/login");
        return;
      }
      if (!user) {
        return; // wait for context
      }
    }

    // load & clear chooser token
    const chooser = localStorage.getItem("roundChooser");
    if (chooser) {
      setCurrentChooserToken(chooser);
      localStorage.removeItem("roundChooser");
    }

    // load numeric lobbyId
    const stored = localStorage.getItem("lobbyId");
    if (!stored) {
      setNotification({
        type: "error",
        message: "Lobby ID missing, please re‑join.",
        onClose: () => setNotification(null),
      });
      setLoading(false);
      return;
    }
    const lobbyId = parseInt(stored, 10);
    setLobbyIdNumber(lobbyId);

    // fetch actual round cards
    if (user?.token) {
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
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${text}`);
          }
          return JSON.parse(text) as { roundCards: RoundCardDTO[] };
        })
        .then((data) => {
          console.log("[RoundCardPage] parsed data:", data);
          const ids = data.roundCards.map((c) => c.id as RoundCardIdentifier);
          setRoundCards(ids);
          setSelectedId(ids[0] ?? null);
        })
        .catch((err) => {
          console.error("[RoundCardPage] error fetching game data", err);
          setFetchError(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [user, router]);

  // 2) STOMP subscription for SCREEN_CHANGE → ACTIONCARD
  useEffect(() => {
    if (loading || !user?.token || lobbyIdNumber === null) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
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
  }, [loading, user, lobbyIdNumber, code, router]);

  // 3) Handle “Select card”
  function handleSubmit() {
    if (!user) {
      setNotification({ type: "error", message: "Please log in first", onClose: () => setNotification(null) });
      return;
    }
    if (lobbyIdNumber === null) {
      setNotification({ type: "error", message: "Lobby ID not ready", onClose: () => setNotification(null) });
      return;
    }
    if (!selectedId) {
      setNotification({ type: "error", message: "Select a round card", onClose: () => setNotification(null) });
      return;
    }

    stompClient.current?.publish({
      destination: `/app/lobby/${lobbyIdNumber}/game/select-round-card`,
      body: JSON.stringify({ roundCardId: selectedId }),
    });
  }

  // 4) Render
  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    );
  }

  // Show fetch‐error or empty‐array message
  if (fetchError) {
    return (
      <GameContainer>
        <p style={{ color: "red", textAlign: "center" }}>Error loading round cards: {fetchError}</p>
      </GameContainer>
    );
  }
  if (roundCards.length === 0) {
    return (
      <GameContainer>
        <p style={{ color: "#fff", textAlign: "center" }}>
          No round cards received. Please check you’re still in the lobby.
        </p>
      </GameContainer>
    );
  }

  // chooser’s view
  if (user?.token === currentChooserToken) {
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
          {getRoundCards(roundCards).map((card, idx) => (
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
}
