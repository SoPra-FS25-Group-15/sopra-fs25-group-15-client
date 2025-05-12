// /games/[code]/results/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Flex, Button, Typography, Divider, Progress, message } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { purple } from "@ant-design/colors";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import { Client, StompSubscription, Frame, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useGlobalUser } from "@/contexts/globalUser";
import { useRouter, useParams } from "next/navigation";
import { getApiDomain } from "@/utils/domain";
import { useGlobalGameState } from "@/contexts/globalGameState";
import useOnceWhenReady from "@/hooks/useOnceWhenReady";

const { Title, Text } = Typography;

interface RoundWinnerEvent {
  type: "ROUND_WINNER";
  winnerUsername: string;
  round: number;
  distance?: number;
}
interface GameWinnerEvent {
  type: "GAME_WINNER";
  winnerUsername: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user } = useGlobalUser();
  const { gameState } = useGlobalGameState();

  const [lobbyId, setLobbyId] = useState<number | null>(null);
  const [roundWinner, setRoundWinner] = useState<RoundWinnerEvent | null>(null);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [count, setCount] = useState(30);

  const gameSub = useRef<StompSubscription | null>(null);

  // 0) get stored events from localStorage
  useOnceWhenReady([user], () => {
    if (!user) return;

    const storedRoundWinnerEvent = localStorage.getItem("roundWinnerEvent");
    const storedGameWinnerEvent = localStorage.getItem("gameWinnerEvent");

    if (storedGameWinnerEvent) {
      console.log("[ResultsPage] Loading stored game winner event:", storedGameWinnerEvent);
      try {
        const { winnerUsername } = JSON.parse(storedGameWinnerEvent);
        setGameWinner(winnerUsername);
      } catch (error) {
        console.error("[ResultsPage] Error parsing stored game winner event:", error);
      }
      localStorage.removeItem("gameWinnerEvent");
    } else if (storedRoundWinnerEvent) {
      console.log("[ResultsPage] Loading stored round winner event:", storedRoundWinnerEvent);
      try {
        const { winnerUsername, round, distance } = JSON.parse(storedRoundWinnerEvent);
        setRoundWinner({ type: "ROUND_WINNER", winnerUsername, round, distance });
      } catch (error) {
        console.error("[ResultsPage] Error parsing stored round winner event:", error);
      }
      localStorage.removeItem("roundWinnerEvent");
    }
  });

  // 1) Load lobbyId
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("lobbyId");
    if (!stored) return;
    setLobbyId(parseInt(stored));
  }, [user]);

  // 2) Game-events STOMP subscription
  useOnceWhenReady([lobbyId, user?.token, gameState], () => {
    if (!lobbyId || !user?.token || !gameState) return;

    console.log(`[ResultsPage] Connecting to STOMP for game-events (lobbyId=${lobbyId}) at /ws/lobby-manager`);
    const client = new Client({
      webSocketFactory: () => new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      reconnectDelay: 5000,
      onConnect: (frame: Frame) => {
        console.log("[ResultsPage] Game-events STOMP connected:", frame.headers);

        gameSub.current = client.subscribe(`/topic/lobby/${lobbyId}/game`, (msg: IMessage) => {
          console.log("[ResultsPage] Received raw gameSub message:", msg.body);
          try {
            const evt = JSON.parse(msg.body);
            console.log("[ResultsPage] Parsed gameSub event:", evt);

            if (evt.type === "ROUND_WINNER") {
              setRoundWinner(evt as RoundWinnerEvent);
              console.log("[ResultsPage] Round winner set from STOMP:", evt);
            }
            if (evt.type === "GAME_WINNER") {
              setGameWinner((evt as GameWinnerEvent).winnerUsername);
              console.log("[ResultsPage] Game winner set from STOMP:", evt);
            }
          } catch (err) {
            console.error("[ResultsPage] Error parsing gameSub message:", err, msg.body);
          }
        });
      },
      onStompError: (frame) => {
        console.error("[ResultsPage] Game-events STOMP error:", frame.headers["message"], frame.body);
        message.error(frame.headers["message"] || "Game connection error");
      },
      onDisconnect: () => {
        console.log("[ResultsPage] Game-events STOMP disconnected");
      },
    });

    client.activate();
    console.log("[ResultsPage] Game-events STOMP client activated");

    return () => {
      console.log("[ResultsPage] Tearing down game-events STOMP client");
      gameSub.current?.unsubscribe();
      client.deactivate();
    };
  });

  // Unified countdown and auto-redirect logic
  useOnceWhenReady([roundWinner], () => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (roundWinner) {
      if (!gameWinner) {
        setCount(10);
        timeoutId = setTimeout(() => router.push(`/games/${code}/roundcard`), 10000);
      } else {
        setCount(30);
        timeoutId = setTimeout(() => router.push("/"), 30000);
      }
      intervalId = setInterval(() => {
        setCount((prev) => Math.max(0, prev - 1));
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  });

  return (
    <div style={{ background: purple[3], minHeight: "100vh", padding: "2rem" }}>
      <Flex vertical align="center" justify="center" style={{ width: "100%", height: "100%" }}>
        {gameWinner && <Confetti recycle={false} numberOfPieces={300} />}

        {gameWinner ? (
          <div
            style={{
              maxWidth: 500,
              padding: 48,
              borderRadius: 32,
              background: "rgba(0,0,0,0.8)",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <Title level={2}>{gameWinner} Wins the Game!</Title>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <TrophyOutlined
                style={{
                  fontSize: "clamp(100px,20vw,200px)",
                  color: purple[3],
                }}
              />
            </motion.div>
            <Divider />
            <Button type="primary" size="large" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </div>
        ) : roundWinner ? (
          <div
            style={{
              maxWidth: 500,
              padding: 48,
              borderRadius: 32,
              background: "rgba(0,0,0,0.8)",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <Title level={2}>Round {roundWinner.round} Winner</Title>
            <Text style={{ margin: "1rem 0", display: "block" }}>{roundWinner.winnerUsername}</Text>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <TrophyOutlined
                style={{
                  fontSize: "clamp(100px,20vw,200px)",
                  color: purple[3],
                }}
              />
            </motion.div>
            <Divider />
            <Progress
              percent={Math.max(0, (((gameWinner ? 30 : 10) - count) / (gameWinner ? 30 : 10)) * 100)}
              showInfo={false}
            />
            <Text>Redirecting in {count > 0 ? count : 0}s…</Text>
          </div>
        ) : (
          <Text style={{ color: "#fff" }}>Waiting for the next round result…</Text>
        )}
      </Flex>
    </div>
  );
}
