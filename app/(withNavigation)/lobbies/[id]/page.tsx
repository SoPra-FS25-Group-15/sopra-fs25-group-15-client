/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/lobby/[id]/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { InputNumber, Button, message, Card, Typography } from "antd";
import { SettingOutlined, TeamOutlined, CopyOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useGlobalUser } from "@/contexts/globalUser";
import UserCard from "@/components/general/usercard";
import Notification, { NotificationProps } from "@/components/general/notification";
import type { LobbyStatusPayload, UserPublicDTO } from "@/types/websocket";
import { getApiDomain } from "@/utils/domain";

const { Title, Text } = Typography;

interface JoinedUser {
  username: string;
  userid: number;
}

const LobbyPage: React.FC = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useGlobalUser();

  const [lobbyCode, setLobbyCode] = useState<string>("");
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(1);
  const [joinedUsers, setJoinedUsers] = useState<JoinedUser[]>([]);
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [lobbyIdNumber, setLobbyIdNumber] = useState<number | null>(null);

  const stompClient = useRef<Client | null>(null);
  const joinResultSub = useRef<StompSubscription | null>(null);
  const statusSub     = useRef<StompSubscription | null>(null);
  const updateSub     = useRef<StompSubscription | null>(null);
  const usersSub      = useRef<StompSubscription | null>(null);
  const gameSub       = useRef<StompSubscription | null>(null);

  // Pull code from URL
  useEffect(() => {
    if (params.id) {
      setLobbyCode(params.id);
    }
  }, [params.id]);

  // When we have a token & code, connect
  useEffect(() => {
    if (!lobbyCode) return;

    if (!user?.token) {
      setNotification({ type: "error", message: "Please log in to access the lobby." });
      setLoading(false);
      return;
    }

    console.log("[STOMP] initializing client for lobby:", lobbyCode);
    const apiDomain = getApiDomain();
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${apiDomain}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("[STOMP] connected");
        setLoading(false);

        // Subscribe to JOIN result
        joinResultSub.current = client.subscribe(
          "/user/topic/lobby/join/result",
          (msg) => {
            console.log("[joinResultSub] message:", msg.body);
            const { type, payload } = JSON.parse(msg.body);
            if (type === "JOIN_ERROR") {
              console.error("[joinResultSub] JOIN_ERROR:", payload);
              message.error(payload || "Unable to join lobby.");
              client.deactivate();
              router.push("/casual");
            }
            if (type === "JOIN_SUCCESS") {
              console.log("[joinResultSub] JOIN_SUCCESS payload:", payload);
            }
          }
        );
        console.log("[STOMP] subscribed to /user/topic/lobby/join/result");

        // Subscribe to lobby status (one‑time)
        statusSub.current = client.subscribe(
          `/app/lobby-manager/lobby/${lobbyCode}`,
          (msg) => {
            console.log("[statusSub] message:", msg.body);
            const { type, payload: p } = JSON.parse(msg.body) as {
              type: string;
              payload: LobbyStatusPayload;
            };
            if (type !== "LOBBY_STATUS") {
              console.warn("[statusSub] ignoring type:", type);
              return;
            }

            console.log("[statusSub] LOBBY_STATUS received:", p);
            setLobbyIdNumber(p.lobbyId);
            // ← NEW: persist numeric lobbyId for RoundCard page
            localStorage.setItem("lobbyId", String(p.lobbyId));

            setJoinedUsers(
              p.players.map((u: UserPublicDTO) => ({
                username: u.username,
                userid: (u as any).userid ?? (u as any).id,
              }))
            );
            setMaxPlayers(Number(p.maxPlayers));
            setPlayersPerTeam(p.playersPerTeam);
            setIsHost(p.host.username === user.username);

            // Wire up live‑topic subscriptions
            subscribeToLobbyTopics(p.lobbyId);

            // Now publish the JOIN request
            console.log("[STOMP] publishing JOIN to /app/lobby/join/" + lobbyCode);
            client.publish({
              destination: `/app/lobby/join/${lobbyCode}`,
              body: JSON.stringify({ type: "JOIN", payload: null }),
            });
          }
        );
        console.log("[STOMP] subscribed to /app/lobby-manager/lobby/" + lobbyCode);
      },
      onStompError: (frame) => {
        console.error("[STOMP ERROR]", frame.headers["message"]);
        setNotification({ type: "error", message: frame.headers["message"] });
        setLoading(false);
      },
      onDisconnect: () => {
        console.log("[STOMP] disconnected");
        setLoading(false);
      },
    });

    stompClient.current = client;
    client.activate();

    return () => {
      console.log("[STOMP] tearing down");
      client.deactivate();
      joinResultSub.current?.unsubscribe();
      statusSub.current?.unsubscribe();
      updateSub.current?.unsubscribe();
      usersSub.current?.unsubscribe();
      gameSub.current?.unsubscribe();
    };
  }, [user?.token, lobbyCode, router]);

  // once we get status, hook up these topics
  const subscribeToLobbyTopics = (lobbyId: number) => {
    console.log("[subscribeToLobbyTopics] lobbyId =", lobbyId);
    if (!stompClient.current) return;

    // config updates & disbanded
    updateSub.current = stompClient.current.subscribe(
      `/topic/lobby/${lobbyId}`,
      (msg) => {
        console.log("[updateSub] msg:", msg.body);
        const { type, payload } = JSON.parse(msg.body);
        if (type === "UPDATE_SUCCESS") {
          if (payload.maxPlayers) setMaxPlayers(Number(payload.maxPlayers));
          if (payload.playersPerTeam !== undefined)
            setPlayersPerTeam(payload.playersPerTeam);
        }
        if (type === "LOBBY_DISBANDED") {
          message.warning("Lobby disbanded by host");
          router.push("/casual");
        }
      }
    );
    console.log("[STOMP] subscribed to /topic/lobby/" + lobbyId);

    // user join/leave
    usersSub.current = stompClient.current.subscribe(
      `/topic/lobby/${lobbyId}/users`,
      (msg) => {
        console.log("[usersSub] msg:", msg.body);
        const { type, payload } = JSON.parse(msg.body);
        if (type === "USER_JOINED") {
          const { username, userid, id } = payload;
          const newId = userid ?? id;
          setJoinedUsers((curr) =>
            curr.some((u) => u.userid === newId)
              ? curr
              : [...curr, { username, userid: newId }]
          );
        }
        if (type === "USER_LEFT" || type === "USER_DISCONNECTED") {
          const removeId = type === "USER_LEFT" ? payload.userId : payload;
          setJoinedUsers((curr) => curr.filter((u) => u.userid !== removeId));
        }
      }
    );
    console.log("[STOMP] subscribed to /topic/lobby/" + lobbyId + "/users");

    // game start
    gameSub.current = stompClient.current.subscribe(
      `/topic/lobby/${lobbyId}/game`,
      (msg) => {
        console.log("[gameSub] msg:", msg.body);
        const { type, payload } = JSON.parse(msg.body) as { type: string; payload: any };
        if (type === "GAME_START") {
          console.log("[gameSub] GAME_START → routing to roundcard");
          // persist chooser token
          localStorage.setItem("roundChooser", payload.startingPlayerToken);
          router.push(`/games/${lobbyCode}/roundcard`);
        }
      }
    );
    console.log("[STOMP] subscribed to /topic/lobby/" + lobbyId + "/game");
  };

  const handleMaxPlayersChange = (val: number | null) => {
    if (
      val !== null &&
      lobbyIdNumber !== null &&
      stompClient.current &&
      val >= playersPerTeam
    ) {
      console.log("[action] publishing UPDATE maxPlayers=", val);
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyIdNumber}/update`,
        body: JSON.stringify({ type: "UPDATE", payload: { maxPlayers: val } }),
      });
      setMaxPlayers(val);
    }
  };

  const handleStartGame = () => {
    if (lobbyIdNumber !== null && stompClient.current && user) {
      console.log("[action] publishing START_GAME");
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyIdNumber}/game/start`,
        body: JSON.stringify({
          type: "START_GAME",
          payload: { code: lobbyCode },
        }),
      });
      // wait for GAME_START broadcast; no immediate router.push
    }
  };

  const handleLeaveLobby = () => {
    if (lobbyIdNumber !== null && stompClient.current) {
      console.log("[action] publishing LEAVE");
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyIdNumber}/leave`,
        body: JSON.stringify({ type: "LEAVE", payload: {} }),
      });
    }
    router.push("/casual");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    message.success("Lobby code copied!");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4" />
          <div>Loading lobby…</div>
        </div>
      </div>
    );
  }

  const canStartGame = joinedUsers.length >= 2 && isHost;

  return (
    <div style={{ padding: 24, minHeight: "100vh" }}>
      {notification && <Notification {...notification} />}

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title style={{ color: "#fff" }}>Lobby</Title>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: 20,
            cursor: "pointer",
          }}
          onClick={handleCopyCode}
        >
          <Text strong style={{ color: "#8a2be2", fontSize: "1.2rem" }}>
            Code: {lobbyCode}
          </Text>
          <CopyOutlined style={{ marginLeft: 8, color: "#8a2be2" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <Card style={{ flex: "0 0 240px", borderRadius: 8 }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
            <SettingOutlined style={{ color: "#fff", marginRight: 8 }} />
            <Text strong style={{ color: "#fff" }}>Settings</Text>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ color: "#fff" }}>Players</Text>
            <InputNumber
              min={2}
              max={8}
              value={maxPlayers}
              onChange={handleMaxPlayersChange}
              disabled={!isHost}
              style={{ width: "100%" }}
            />
          </div>
          <Button danger block onClick={handleLeaveLobby}>Leave</Button>
        </Card>

        <Card
          title={
            <>
              <TeamOutlined style={{ color: "#fff", marginRight: 8 }} />
              <Text style={{ color: "#fff" }}>Joined</Text>
            </>
          }
          style={{ flex: 1, borderRadius: 8 }}
        >
          {joinedUsers.length > 0 ? (
            joinedUsers.map((u) => <UserCard key={u.userid} username={u.username} />)
          ) : (
            <Text style={{ color: "#fff" }}>No one joined yet.</Text>
          )}
        </Card>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button type="primary" size="large" disabled={!canStartGame} onClick={handleStartGame}>
          Start Game
        </Button>
      </div>
    </div>
  );
};

export default function Page() {
  return <LobbyPage />;
}
