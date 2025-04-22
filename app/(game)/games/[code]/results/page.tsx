/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Content from "@/components/layout/content";
import { Flex } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { gold, purple } from "@ant-design/colors";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useGlobalUser } from "@/contexts/globalUser";
import { Button, Typography, message, Divider, Progress } from "antd";
import { useRouter, useParams } from "next/navigation";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import { getApiDomain } from "@/utils/domain";

const { Title, Text } = Typography;

// ─── STYLES ────────────────────────────────────────────────────────────────

const pageWrapper: React.CSSProperties = {
    background: purple[3],  
    minHeight: "100vh",
    padding: "2rem",
  };

const fullHeightCenter: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  flexDirection: "column",
};

const box: React.CSSProperties = {
  width: "100%",
  maxWidth: "500px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  padding: 48,
  borderRadius: 32,
  color: "#fff",
  backdropFilter: "blur(10px)",
  background: "rgba(0, 0, 0, 0.8)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const h2: React.CSSProperties = {
  fontSize: "clamp(28px, 5.8vw, 60px)",
  lineHeight: 1.2,
  margin: 0,
};

const p: React.CSSProperties = {
  fontSize: "clamp(16px, 2.5vw, 30px)",
  color: "#bbb",
  margin: 0,
};

// ───────────────────────────────────────────────────────────────────────────

interface RoundWinnerEvent {
  type: "ROUND_WINNER";
  winnerUsername: string;
  round: number;
}

interface GameWinnerEvent {
  type: "GAME_WINNER";
  winnerUsername: string;
}

const ResultsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useGlobalUser();

  const [lobbyCode, setLobbyCode] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<number | null>(null);
  const [roundWinner, setRoundWinner] = useState<RoundWinnerEvent | null>(null);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [count, setCount] = useState<number>(30);

  const lobbyStatusSub = useRef<StompSubscription | null>(null);
  const gameSub = useRef<StompSubscription | null>(null);

  // Demo mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const qp = new URLSearchParams(window.location.search);
    const drw = qp.get("demoRoundWinner");
    const rnd = qp.get("round") ?? "1";
    const dgw = qp.get("demoGameWinner");
    if (drw) setRoundWinner({ type: "ROUND_WINNER", winnerUsername: drw, round: parseInt(rnd, 10) });
    if (dgw) setGameWinner(dgw);
  }, []);

  // Pull [code] from URL
  useEffect(() => {
    if (!params.code) return;
    setLobbyCode(Array.isArray(params.code) ? params.code[0] : params.code);
  }, [params.code]);

  // Fetch numeric lobbyId
  useEffect(() => {
    // Wait if context hasn't yet loaded the user from localStorage
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("user") &&
      !user
    ) {
      return;
    }
    if (!user?.token || !lobbyCode) return;

    const apiDomain = getApiDomain()
    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiDomain}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        lobbyStatusSub.current = client.subscribe(
          `/app/lobby-manager/lobby/${lobbyCode}`,
          msg => {
            const { type, payload }: any = JSON.parse(msg.body);
            if (type === "LOBBY_STATUS" && payload.lobbyId) {
              setLobbyId(payload.lobbyId);
            }
          }
        );
      },
      onStompError: frame => {
        message.error(frame.headers["message"] || "Could not fetch lobby status");
      },
    });
    client.activate();
    return () => {
      lobbyStatusSub.current?.unsubscribe();
      client.deactivate();
    };
  }, [user?.token, lobbyCode]);

  // Subscribe to game events
  useEffect(() => {
    // Wait if context hasn't yet loaded the user from localStorage
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("user") &&
      !user
    ) {
      return;
    }
    if (!user?.token || lobbyId === null) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(`http://localhost:8080/ws/lobby?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        gameSub.current = client.subscribe(
          `/topic/lobby/${lobbyId}/game`,
          msg => {
            const evt: any = JSON.parse(msg.body);
            if (evt.type === "ROUND_WINNER") setRoundWinner(evt as RoundWinnerEvent);
            if (evt.type === "GAME_WINNER") setGameWinner((evt as GameWinnerEvent).winnerUsername);
          }
        );
      },
      onStompError: frame => {
        message.error(frame.headers["message"] || "Game connection error");
      },
    });
    client.activate();
    return () => {
      gameSub.current?.unsubscribe();
      client.deactivate();
    };
  }, [user?.token, lobbyId]);

  // Countdown for round redirect
  useEffect(() => {
    if (!roundWinner) return;
    setCount(30);
    const interval = setInterval(() => setCount(c => c - 1), 1000);
    return () => clearInterval(interval);
  }, [roundWinner]);

  // Auto-redirect after 30s
  useEffect(() => {
    if (!roundWinner) return;
    const timer = setTimeout(() => {
      router.push(`/games/${lobbyCode}/roundcard`);
    }, 30000);
    return () => clearTimeout(timer);
  }, [roundWinner, lobbyCode, router]);

  return (
    <div style={pageWrapper}>
      <Content>
        <Flex vertical align="center" justify="center" style={fullHeightCenter}>
          {gameWinner && <Confetti recycle={false} numberOfPieces={300} />}
          {gameWinner ? (
            <div style={box}>
              <Title level={2} style={h2}>
                {gameWinner} Wins the Game!
              </Title>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <TrophyOutlined
                  style={{
                    fontSize: "clamp(100px, 20vw, 200px)",
                    color: purple[3],
                    marginTop: "1rem",
                  }}
                />
              </motion.div>
              <Divider style={{ background: "rgba(255,255,255,0.3)", width: "60%" }} />
              <Button
                type="primary"
                size="large"
                onClick={() => router.push("/")}
                style={{ marginTop: "1.5rem" }}
              >
                Go Home
              </Button>
            </div>
          ) : roundWinner ? (
            <div style={box}>
              <Title level={2} style={h2}>
                Round {roundWinner.round} Winner
              </Title>
              <Text style={{ ...p, marginTop: "0.5rem", marginBottom: "1.5rem" }}>
                {roundWinner.winnerUsername}
              </Text>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <TrophyOutlined
                  style={{
                    fontSize: "clamp(100px, 20vw, 200px)",
                    color: purple[3],
                    marginTop: "1rem",
                  }}
                />
              </motion.div>
              <Divider style={{ background: "rgba(255,255,255,0.3)", width: "60%" }} />
              <Progress
                percent={Math.max(0, (30 - count) / 30 * 100)}
                showInfo={false}
                strokeColor="#8a2be2"
                style={{ width: "60%", marginTop: "1rem" }}
              />
              <Text type="secondary" style={{ marginTop: "0.5rem" }}>
                Redirecting in {count > 0 ? count : 0}s…
              </Text>
              <Button
                type="primary"
                size="large"
                onClick={() => router.push(`/games/${lobbyCode}/roundcard`)}
                style={{ marginTop: "1.5rem" }}
              >
                Next Round
              </Button>
            </div>
          ) : (
            <Text type="secondary">Waiting for the next round result...</Text>
          )}
        </Flex>
      </Content>
    </div>
  );
};

export default ResultsPage;
