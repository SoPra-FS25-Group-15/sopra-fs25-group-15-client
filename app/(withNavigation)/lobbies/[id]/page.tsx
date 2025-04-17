/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { LobbyStatusPayload } from "@/types/websocket";

const { Title, Text } = Typography;

interface JoinedUser {
  username: string;
  userid: number;
}

const LobbyPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
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
  const statusSub = useRef<StompSubscription | null>(null);
  const updateSub = useRef<StompSubscription | null>(null);
  const usersSub = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (params.id) {
      setLobbyCode(Array.isArray(params.id) ? params.id[0] : params.id);
    }
  }, [params.id]);

  useEffect(() => {
    if (!user?.token) {
      setNotification({ type: "error", message: "Please log in to access the lobby." });
      setLoading(false);
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`http://localhost:8080/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        setLoading(false);

        // Listen for join result to catch full-lobby errors or success
        joinResultSub.current = client.subscribe(
          "/user/topic/lobby/join/result",
          (msg) => {
            const { type, payload } = JSON.parse(msg.body) as { type: string; payload: any };

            if (type === "JOIN_ERROR") {
              message.error(payload || "Unable to join lobby.");
              client.deactivate();
              router.push("/casual");
            }

            if (type === "JOIN_SUCCESS") {
              // Subscribe to initial lobby status
              statusSub.current = client.subscribe(
                `/app/lobby-manager/lobby/${lobbyCode}`,
                (statusMsg) => {
                  const { type: stype, payload: p } = JSON.parse(statusMsg.body) as {
                    type: string;
                    payload: LobbyStatusPayload;
                  };
                  if (stype !== "LOBBY_STATUS") return;

                  // Now that we've joined, we expect to be part of p.players or host
                  const inLobby =
                    p.host.username === user.username ||
                    p.players.some((pl) => pl.username === user.username);
                  if (!inLobby) {
                    message.error("Lobby is full");
                    client.deactivate();
                    router.push("/casual");
                    return;
                  }

                  // Initialize UI state
                  setLobbyIdNumber(p.lobbyId);
                  setJoinedUsers(p.players.map((u) => ({ username: u.username, userid: u.userid })));
                  setMaxPlayers(Number(p.maxPlayers));
                  setPlayersPerTeam(p.playersPerTeam);
                  setIsHost(p.host.username === user.username);

                  // Subscribe to live updates
                  subscribeToLobbyTopics(p.lobbyId);
                }
              );
            }
          }
        );

        // Send the join request
        client.publish({
          destination: `/app/lobby/join/${lobbyCode}`,
          body: JSON.stringify({ type: "JOIN", payload: null }),
        });
      },
      onStompError: (frame) => {
        setNotification({ type: "error", message: frame.headers["message"] });
        setLoading(false);
      },
      onDisconnect: () => setLoading(false),
    });

    stompClient.current = client;
    client.activate();

    return () => {
      client.deactivate();
      joinResultSub.current?.unsubscribe();
      statusSub.current?.unsubscribe();
      updateSub.current?.unsubscribe();
      usersSub.current?.unsubscribe();
    };
  }, [user?.token, lobbyCode]);

  const subscribeToLobbyTopics = (lobbyId: number) => {
    if (!stompClient.current) return;

    updateSub.current = stompClient.current.subscribe(
      `/topic/lobby/${lobbyId}`,
      (msg) => {
        const { type, payload } = JSON.parse(msg.body) as { type: string; payload: any };
        if (type === "UPDATE_SUCCESS") {
          if (payload.maxPlayers) setMaxPlayers(Number(payload.maxPlayers));
          if (payload.playersPerTeam !== undefined) setPlayersPerTeam(payload.playersPerTeam);
        }
        if (type === "LOBBY_DISBANDED") {
          message.warning("Lobby disbanded by host");
          router.push("/casual");
        }
      }
    );

    usersSub.current = stompClient.current.subscribe(
      `/topic/lobby/${lobbyId}/users`,
      (msg) => {
        const { type, payload } = JSON.parse(msg.body) as { type: string; payload: any };
        if (type === "USER_JOINED") {
          const { username, id } = payload;
          setJoinedUsers((curr) =>
            curr.some((u) => u.userid === id) ? curr : [...curr, { username, userid: id }]
          );
        }
        if (type === "USER_LEFT" || type === "USER_DISCONNECTED") {
          const toRemove = type === "USER_LEFT" ? payload.userId : payload;
          setJoinedUsers((curr) => curr.filter((u) => u.userid !== toRemove));
        }
      }
    );
  };

  const handleMaxPlayersChange = (val: number | null) => {
    if (val !== null && lobbyIdNumber !== null && stompClient.current && val >= playersPerTeam) {
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyIdNumber}/update`,
        body: JSON.stringify({ type: "UPDATE", payload: { maxPlayers: val } }),
      });
    }
  };

  const handleStartGame = () => {
    if (lobbyIdNumber !== null && stompClient.current && user) {
      stompClient.current.publish({
        destination: `/app/game/start`,
        body: JSON.stringify({ type: "START_GAME", token: user.token, code: lobbyCode }),
      });
    }
  };

  const handleLeaveLobby = () => {
    if (lobbyIdNumber !== null && stompClient.current) {
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
    <div style={{ padding: 24, backgroundColor: "#282c34", minHeight: "100vh" }}>
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
          <Text strong style={{ color: "#8a2be2", fontSize: "1.2rem" }}>Code: {lobbyCode}</Text>
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
          <Button danger block onClick={handleLeaveLobby}>
            Leave
          </Button>
        </Card>

        <Card
          title={<><TeamOutlined style={{ color: "#fff", marginRight: 8 }} /><Text style={{ color: "#fff" }}>Joined</Text></>}
          style={{ flex: 1, borderRadius: 8 }}
        >
          {joinedUsers.length
            ? joinedUsers.map((u) => <UserCard key={u.userid} username={u.username} />)
            : <Text style={{ color: "#fff" }}>No one joined yet.</Text>}
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
