"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  InputNumber,
  Button,
  message,
  Card,
  Typography,
} from "antd";
import {
  SettingOutlined,
  TeamOutlined,
  CopyOutlined,
} from "@ant-design/icons";
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

  // Debug
  console.log("[LobbyPage] useGlobalUser() →", user);
  if (typeof window !== "undefined") {
    console.log("[LobbyPage] localStorage.user →", window.localStorage.getItem("user"));
    console.log("[LobbyPage] localStorage.token →", window.localStorage.getItem("token"));
  }

  const [lobbyCode, setLobbyCode] = useState<string>("");
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(1);
  const [joinedUsers, setJoinedUsers] = useState<JoinedUser[]>([]);
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [lobbyIdNumber, setLobbyIdNumber] = useState<number | null>(null);

  const stompClient = useRef<Client | null>(null);
  const statusSubscription = useRef<StompSubscription | null>(null);
  const updateSubscription = useRef<StompSubscription | null>(null);
  const usersSubscription = useRef<StompSubscription | null>(null);

  // Grab code from URL
  useEffect(() => {
    if (params.id) {
      const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
      setLobbyCode(idParam);
    }
  }, [params.id]);

  // STOMP setup
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
        console.log("[LobbyPage] STOMP connected as", user.username);
        setLoading(false);
        if (!lobbyCode) return;

        client.publish({
          destination: `/app/lobby/join/${lobbyCode}`,
          body: JSON.stringify({ type: "JOIN", payload: null }),
        });

        statusSubscription.current = client.subscribe(
          `/app/lobby-manager/lobby/${lobbyCode}`,
          (msg) => {
            const wsMsg = JSON.parse(msg.body) as { type: string; payload: LobbyStatusPayload };
            if (wsMsg.type !== "LOBBY_STATUS") return;

            const p = wsMsg.payload;
            console.log("[LobbyPage] LOBBY_STATUS payload:", p);
            console.log("[LobbyPage] payload.host:", p.host);
            console.log("[LobbyPage] current user.userid:", user.userid);

            setLobbyIdNumber(p.lobbyId);
            setJoinedUsers(p.players.map(u => ({ username: u.username, userid: u.userid })));
            setMaxPlayers(Number(p.maxPlayers));
            setPlayersPerTeam(p.playersPerTeam);

            // **FIX** compare host.userid to user.userid
            setIsHost(p.host.userid === user.userid);

            subscribeToLobbyTopics(p.lobbyId);
          }
        );
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
      statusSubscription.current?.unsubscribe();
      updateSubscription.current?.unsubscribe();
      usersSubscription.current?.unsubscribe();
    };
  }, [user?.token, lobbyCode]);

  // Subscribe to in‑lobby topics
  const subscribeToLobbyTopics = (lobbyId: number) => {
    if (!stompClient.current) return;

    updateSubscription.current = stompClient.current.subscribe(
      `/topic/lobby/${lobbyId}`,
      (msg) => {
        const data = JSON.parse(msg.body) as { type: string; payload: Partial<LobbyStatusPayload> };
        if (data.type === "UPDATE_SUCCESS" && data.payload) {
          if (data.payload.maxPlayers) setMaxPlayers(Number(data.payload.maxPlayers));
          if (data.payload.playersPerTeam !== undefined) setPlayersPerTeam(data.payload.playersPerTeam);
        }
        if (data.type === "LOBBY_DISBANDED") {
          message.warning("Lobby disbanded by host");
          router.push("/casual");
        }
      }
    );

    usersSubscription.current = stompClient.current.subscribe(
      `/topic/lobby/${lobbyId}/users`,
      (msg) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = JSON.parse(msg.body) as { type: string; payload: any };
        if (data.type === "USER_JOINED") {
          const { username, id } = data.payload;
          setJoinedUsers(curr => curr.some(u => u.userid === id) ? curr : [...curr, { username, userid: id }]);
        }
        if (data.type === "USER_LEFT" || data.type === "USER_DISCONNECTED") {
          const toRemove = data.type === "USER_LEFT" ? data.payload.userId : data.payload;
          setJoinedUsers(curr => curr.filter(u => u.userid !== toRemove));
        }
      }
    );
  };

  // Handlers
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
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}>
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
          <Button danger block onClick={handleLeaveLobby}>
            Leave
          </Button>
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
            joinedUsers.map(u => <UserCard key={u.userid} username={u.username} />)
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
