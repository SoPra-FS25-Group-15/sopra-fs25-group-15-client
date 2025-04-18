/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useGlobalUser } from "@/contexts/globalUser";
import { Card, Typography, Button, message } from "antd";

const { Title, Text } = Typography;

interface RoundWinnerEvent {
  type: "ROUND_WINNER";
  winnerUsername: string;
  round: number;
}

interface GameWinnerEvent {
  type: "GAME_WINNER";
  winnerUsername: string;
}

const GamePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useGlobalUser();

  const [lobbyCode, setLobbyCode] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<number | null>(null);
  const [roundWinner, setRoundWinner] = useState<RoundWinnerEvent | null>(null);
  const [gameWinner, setGameWinner] = useState<string | null>(null);

  const lobbyStatusSub = useRef<StompSubscription | null>(null);
  const gameSub = useRef<StompSubscription | null>(null);
  const wsManagerClient = useRef<Client | null>(null);
  const wsGameClient = useRef<Client | null>(null);

  // extract lobby code from URL (/lobbies/[code]/game)
  useEffect(() => {
    if (params.id) {
      setLobbyCode(Array.isArray(params.id) ? params.id[0] : params.id);
    }
  }, [params.id]);

  // connect to lobby‑manager to fetch numeric lobbyId
  useEffect(() => {
    if (!user?.token || !lobbyCode) return;
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`http://localhost:8080/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        lobbyStatusSub.current = client.subscribe(
          `/app/lobby-manager/lobby/${lobbyCode}`,
          (msg) => {
            const { type, payload }: any = JSON.parse(msg.body);
            if (type === "LOBBY_STATUS" && payload.lobbyId) {
              setLobbyId(payload.lobbyId);
            }
          }
        );
      },
      onStompError: (frame) => {
        message.error(frame.headers["message"] || "Could not connect to lobby status");
      },
    });
    wsManagerClient.current = client;
    client.activate();
    return () => {
      lobbyStatusSub.current?.unsubscribe();
      client.deactivate();
    };
  }, [user?.token, lobbyCode]);

  // once we have lobbyId, connect to game endpoint and listen for winners
  useEffect(() => {
    if (!user?.token || lobbyId === null) return;
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`http://localhost:8080/ws/lobby?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        gameSub.current = client.subscribe(
          `/topic/lobby/${lobbyId}/game`,
          (msg) => {
            const evt: any = JSON.parse(msg.body);
            if (evt.type === "ROUND_WINNER") {
              setRoundWinner(evt as RoundWinnerEvent);
            }
            if (evt.type === "GAME_WINNER") {
              setGameWinner((evt as GameWinnerEvent).winnerUsername);
            }
          }
        );
      },
      onStompError: (frame) => {
        message.error(frame.headers["message"] || "Game connection error");
      },
    });
    wsGameClient.current = client;
    client.activate();
    return () => {
      gameSub.current?.unsubscribe();
      client.deactivate();
    };
  }, [user?.token, lobbyId]);

  // after showing the round‐winner, wait 30 s then go back to your roundcard page
  useEffect(() => {
    if (!roundWinner) return;
    const timer = setTimeout(() => {
      router.push(`/games/${lobbyCode}/roundcard`);
    }, 30_000);
    return () => clearTimeout(timer);
  }, [roundWinner, router, lobbyCode]);

  // If game has ended, show the overall winner
  if (gameWinner) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Title level={1} style={{ color: "#FFD700", marginBottom: 16 }}>
          🏆 {gameWinner} Wins the Game! 🏆
        </Title>
        <Button type="primary" size="large" onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  // If a round just ended, show the round winner
  if (roundWinner) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
        <Card
          style={{
            border: "3px solid #FFD700",
            borderRadius: 12,
            textAlign: "center",
            maxWidth: 400,
            width: "100%",
          }}
        >
          <Title level={2} style={{ color: "#FFD700", marginBottom: 8 }}>
            Round {roundWinner.round} Winner
          </Title>
          <Text style={{ fontSize: "1.6rem", fontWeight: 600 }}>
            {roundWinner.winnerUsername}
          </Text>
        </Card>
      </div>
    );
  }

  // Default: waiting for next round
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <Text type="secondary">Waiting for the next round result...</Text>
    </div>
  );
};

export default GamePage;
