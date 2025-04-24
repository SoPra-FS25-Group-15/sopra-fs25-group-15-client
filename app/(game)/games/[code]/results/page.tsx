// /games/[code]/results/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Content from "@/components/layout/content";
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

  const [lobbyId, setLobbyId]         = useState<number | null>(null);
  const [roundWinner, setRoundWinner] = useState<RoundWinnerEvent | null>(null);
  const [gameWinner, setGameWinner]   = useState<string | null>(null);
  const [count, setCount]             = useState(30);

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
        // Persist next chooser username
        localStorage.setItem("roundChooserUsername", payload.winnerUsername);
        console.log("[ResultsPage] ➡ set roundChooserUsername:", payload.winnerUsername);
        // If current user is the winner, also persist their token for chooser
        if (payload.winnerUsername === user.username) {
          localStorage.setItem("roundChooser", user.token);
          console.log("[ResultsPage] ➡ set roundChooser (token) for current user");
        }
      } catch (err) {
        console.error("[ResultsPage] ❌ parse error:", err);
      } finally {
        localStorage.removeItem("roundWinnerEvent");
      }
    }
  }, [user]);

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

  // 1) Pull lobbyId out of localStorage so we can subscribe to game-events
  useEffect(() => {
    const stored = localStorage.getItem("lobbyId");
    console.log("[ResultsPage] ▶ reading lobbyId from localStorage:", stored);
    if (stored) {
      const id = parseInt(stored, 10);
      if (!isNaN(id)) {
        setLobbyId(id);
        console.log("[ResultsPage] ⇒ setLobbyId:", id);
      } else {
        console.error("[ResultsPage] ✖ invalid lobbyId in localStorage:", stored);
      }
    } else {
      console.error("[ResultsPage] ✖ no lobbyId in localStorage");
      message.error("Missing lobbyId—please rejoin the lobby.");
    }
  }, []);

  // 2) Game-events STOMP subscription
  useEffect(() => {
    if (!user?.token) {
      console.log("[ResultsPage] ⏸ skipping game-events STOMP (no token)");
      return;
    }
    if (lobbyId == null) {
      console.log("[ResultsPage] ⏸ skipping game-events STOMP (lobbyId not set)");
      return;
    }

    console.log(
      `[ResultsPage] ▶ connecting to STOMP for game-events (lobbyId=${lobbyId}) at /ws/lobby-manager`
    );
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      reconnectDelay: 5000,
      onConnect: (frame: Frame) => {
        console.log("[ResultsPage] 🟢 game-events STOMP connected:", frame.headers);
        console.log(`[ResultsPage] 🔍 subscribing to /topic/lobby/${lobbyId}/game`);
        gameSub.current = client.subscribe(
          `/topic/lobby/${lobbyId}/game`,
          (msg: IMessage) => {
            console.log("[ResultsPage] ← gameSub raw message:", msg.body);
            try {
              const evt = JSON.parse(msg.body);
              console.log("[ResultsPage] ← gameSub parsed:", evt);

              if (evt.type === "ROUND_WINNER") {
                setRoundWinner(evt as RoundWinnerEvent);
                console.log("[ResultsPage] ⇒ roundWinner set by STOMP:", evt);
                localStorage.setItem("roundChooserUsername", evt.winnerUsername);
              }
              if (evt.type === "GAME_WINNER") {
                setGameWinner((evt as GameWinnerEvent).winnerUsername);
                console.log(
                  "[ResultsPage] ⇒ gameWinner set by STOMP:",
                  (evt as GameWinnerEvent).winnerUsername
                );
              }
            } catch (err) {
              console.error("[ResultsPage] ✖ error parsing gameSub message:", err, msg.body);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error(
          "[ResultsPage] ⚠ game-events STOMP error:",
          frame.headers["message"],
          frame.body
        );
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
  }, [user?.token, lobbyId]);

  // 3) Countdown & auto-redirect for next round (only if roundWinner)
  useEffect(() => {
    if (!roundWinner) return;
    setCount(30);
    const iv = setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(iv);
  }, [roundWinner]);

  useEffect(() => {
    if (!roundWinner) return;
    const to = setTimeout(() => router.push(`/games/${code}/roundcard`), 30000);
    return () => clearTimeout(to);
  }, [roundWinner, code, router]);

  return (
    <div style={{ background: purple[3], minHeight: "100vh", padding: "2rem" }}>
        <Flex
          vertical
          align="center"
          justify="center"
          style={{ width: "100%", height: "100%" }}
        >
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
              <Text style={{ margin: "1rem 0", display: "block" }}>
                {roundWinner.winnerUsername}
              </Text>
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
                percent={Math.max(0, ((30 - count) / 30) * 100)}
                showInfo={false}
              />
              <Text>Redirecting in {count > 0 ? count : 0}s…</Text>
              <Button
                style={{ marginTop: 16 }}
                type="primary"
                size="large"
                onClick={() => router.push(`/games/${code}/roundcard`)}
              >
                Next Round
              </Button>
            </div>
          ) : (
            <Text style={{ color: "#fff" }}>Waiting for the next round result…</Text>
          )}
        </Flex>
    </div>
  );
}
