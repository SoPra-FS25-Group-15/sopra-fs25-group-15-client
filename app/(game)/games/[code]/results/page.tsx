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
import useLocalStorage from "@/hooks/useLocalStorage";
import { GameState } from "@/types/game/game";
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

  const { set: setGameState } = useLocalStorage<Partial<GameState> | null>("gameState", null);

  const [lobbyId, setLobbyId] = useState<number | null>(null);
  const [roundWinner, setRoundWinner] = useState<RoundWinnerEvent | null>(null);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [count, setCount] = useState(30);

  const gameSub = useRef<StompSubscription | null>(null);

  // 0) Hydrate any stored ROUND_WINNER event after user is ready
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("roundWinnerEvent");
    console.log("[ResultsPage] 🔄 hydrating roundWinnerEvent:", stored);
    if (stored) {
      try {
        const payload = JSON.parse(stored);
        console.log("[ResultsPage] ✅ parsed payload:", payload);
        setRoundWinner({
          type: "ROUND_WINNER",
          winnerUsername: payload.winnerUsername,
          round: payload.round,
          distance: payload.distance,
        });

        // Persist next chooser username to gameState
        setGameState({ ...gameState, roundCardSubmitter: payload.winnerUsername });
      } catch (err) {
        console.error("[ResultsPage] ❌ parse error:", err);
      } finally {
        localStorage.removeItem("roundWinnerEvent");
      }
    }
  }, [gameState, setGameState, user]);

  // 0b) Hydrate any stored GAME_WINNER event after user is ready
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("gameWinnerEvent");
    console.log("[ResultsPage] 🔄 hydrating gameWinnerEvent:", stored);
    if (stored) {
      try {
        const payload: GameWinnerEvent = JSON.parse(stored);
        console.log("[ResultsPage] ✅ parsed gameWinner payload:", payload);
        setGameWinner(payload.winnerUsername);
      } catch (err) {
        console.error("[ResultsPage] ❌ parse error for gameWinnerEvent:", err);
      } finally {
        localStorage.removeItem("gameWinnerEvent");
      }
    }
  }, [user]);

  // 1) Load lobbyId
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("lobbyId");
    if (!stored) return;
    setLobbyId(parseInt(stored));
  }, [user]);

  // 2) Game-events STOMP subscription
  useOnceWhenReady([user?.token, lobbyId, setGameState, gameState], () => {
    if (!lobbyId || !user?.token || !gameState) return;

    console.log(`[ResultsPage] ▶ connecting to STOMP for game-events (lobbyId=${lobbyId}) at /ws/lobby-manager`);
    const client = new Client({
      webSocketFactory: () => new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      reconnectDelay: 5000,
      onConnect: (frame: Frame) => {
        console.log("[ResultsPage] 🟢 game-events STOMP connected:", frame.headers);
        console.log(`[ResultsPage] 🔍 subscribing to /topic/lobby/${lobbyId}/game`);
        gameSub.current = client.subscribe(`/topic/lobby/${lobbyId}/game`, (msg: IMessage) => {
          console.log("[ResultsPage] ← gameSub raw message:", msg.body);
          try {
            const evt = JSON.parse(msg.body);
            console.log("[ResultsPage] ← gameSub parsed:", evt);

            if (evt.type === "ROUND_WINNER") {
              setRoundWinner(evt as RoundWinnerEvent);
              console.log("[ResultsPage] ⇒ roundWinner set by STOMP:", evt);

              // Update the game state
              setGameState({ ...gameState, roundCardSubmitter: evt.winnerUsername });
              console.log("[ResultsPage] ⇒ gameState updated with roundCardSubmitter:", evt.winnerUsername);
            }
            if (evt.type === "GAME_WINNER") {
              setGameWinner((evt as GameWinnerEvent).winnerUsername);
              console.log("[ResultsPage] ⇒ gameWinner set by STOMP:", (evt as GameWinnerEvent).winnerUsername);
            }
          } catch (err) {
            console.error("[ResultsPage] ✖ error parsing gameSub message:", err, msg.body);
          }
        });
      },
      onStompError: (frame) => {
        console.error("[ResultsPage] ⚠ game-events STOMP error:", frame.headers["message"], frame.body);
        message.error(frame.headers["message"] || "Game connection error");
      },
      onDisconnect: () => {
        console.log("[ResultsPage] 🔴 game-events STOMP disconnected");
      },
    });

    client.activate();
    console.log("[ResultsPage] game-events STOMP client activated");

    return () => {
      console.log("[ResultsPage] 🧹 tearing down game-events STOMP client");
      gameSub.current?.unsubscribe();
      client.deactivate();
    };
  });

  // Unified countdown and auto-redirect logic
  useEffect(() => {
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
  }, [roundWinner, gameWinner, code, router]);

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
