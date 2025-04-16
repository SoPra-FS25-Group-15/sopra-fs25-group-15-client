"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  InputNumber,
  Button,
  Modal,
  Input,
  message,
  Card,
  Tag,
  Select,
  Typography,
} from "antd";
import {
  UserAddOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useGlobalUser } from "@/contexts/globalUser";
import UserCard from "@/components/general/usercard";
import Notification, { NotificationProps } from "@/components/general/notification";

const { Title, Text, Paragraph } = Typography;

interface JoinedUser {
  username: string;
  userid: number;
}

interface InvitedUser {
  username: string;
  status: string;
}

interface LobbyStatusPayload {
  lobbyId: number;
  code: string;
  host?: { id: number; username: string };
  mode: string;
  maxPlayers: string;
  playersPerTeam: number;
  roundCardsStartAmount: number;
  private: boolean;
  status: string;
  players?: Array<{ id: number; username: string; status: string }>;
}

interface WebSocketMessage<T> {
  type: string;
  payload: T;
}

// Determine valid team sizes
const getAllowedTeamSizes = (players: number): number[] => {
  switch (players) {
    case 2:
    case 3:
    case 5:
    case 7:
      return [1];
    case 4:
      return [1, 2];
    case 6:
      return [1, 2, 3];
    case 8:
      return [1, 2, 4];
    default:
      return [1];
  }
};

const LobbyPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useGlobalUser();

  // UI state
  const [lobbyCode, setLobbyCode] = useState<string>("");
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(1);
  const [joinedUsers, setJoinedUsers] = useState<JoinedUser[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [notification, setNotification] = useState<NotificationProps | null>(
    null
  );
  const [inviteModalVisible, setInviteModalVisible] = useState<boolean>(
    false
  );
  const [inviteInput, setInviteInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isHost, setIsHost] = useState<boolean>(false);

  // STOMP client + subscriptions
  const stompClient = useRef<Client | null>(null);
  const statusSubscription = useRef<StompSubscription | null>(null);
  const updateSubscription = useRef<StompSubscription | null>(null);
  const usersSubscription = useRef<StompSubscription | null>(null);
  const [lobbyIdNumber, setLobbyIdNumber] = useState<number | null>(null);

  // grab code from URL
  useEffect(() => {
    if (params.id) {
      const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
      setLobbyCode(idParam);
    }
  }, [params.id]);

  // initialize STOMP
  useEffect(() => {
    if (!user?.token) {
      setNotification({
        type: "error",
        message: "Please log in to access the lobby.",
      });
      setLoading(false);
      return;
    }

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(
          `http://localhost:8080/ws/lobby-manager?token=${user.token}`
        ),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        setLoading(false);
        if (!lobbyCode) return;

        // 1) Send JOIN so server adds us and emits USER_JOINED
        client.publish({
          destination: `/app/lobby/join/${lobbyCode}`,
          body: JSON.stringify({ type: "JOIN", payload: null }),
        });

        // 2) Subscribe for initial status
        statusSubscription.current = client.subscribe(
          `/app/lobby-manager/lobby/${lobbyCode}`,
          (msg) => {
            const wsMsg = JSON.parse(msg.body) as WebSocketMessage<
              LobbyStatusPayload
            >;
            if (wsMsg.type !== "LOBBY_STATUS") return;

            // --- GUARDS AGAINST undefined host / players ---
            const p = wsMsg.payload;
            const lobbyId = p.lobbyId;
            const players = p.players ?? [];
            const host = p.host;

            setLobbyIdNumber(lobbyId);

            setJoinedUsers(
              players.map((u) => ({
                username: u.username,
                userid: u.id,
              }))
            );

            setMaxPlayers(parseInt(p.maxPlayers, 10));
            setPlayersPerTeam(p.playersPerTeam);
            setIsHost(host?.username === user.username);
            // -------------------------------------------------

            subscribeToLobbyTopics(lobbyId);
          }
        );
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"], frame.body);
        setNotification({
          type: "error",
          message: frame.headers["message"],
        });
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

  // subscribe to /topic/lobby/{id} & /topic/lobby/{id}/users
  const subscribeToLobbyTopics = (lobbyId: number) => {
    if (!stompClient.current) return;

    updateSubscription.current = stompClient.current.subscribe(
      `/topic/lobby/${lobbyId}`,
      (msg) => {
        const data = JSON.parse(
          msg.body
        ) as WebSocketMessage<Partial<LobbyStatusPayload>>;
        if (data.type === "UPDATE_SUCCESS" && data.payload) {
          if (data.payload.maxPlayers) {
            setMaxPlayers(Number(data.payload.maxPlayers));
          }
          if (data.payload.playersPerTeam !== undefined) {
            setPlayersPerTeam(data.payload.playersPerTeam);
          }
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
        const data = JSON.parse(msg.body) as WebSocketMessage<any>;

        if (data.type === "USER_JOINED") {
          const { username, id } = data.payload;
          const userId = id as number;
          setJoinedUsers((curr) =>
            curr.some((u) => u.userid === userId)
              ? curr
              : [...curr, { username, userid: userId }]
          );
        }
        if (data.type === "USER_LEFT") {
          setJoinedUsers((curr) =>
            curr.filter((u) => u.userid !== data.payload.userId)
          );
        }
        if (data.type === "USER_DISCONNECTED") {
          setJoinedUsers((curr) =>
            curr.filter((u) => u.userid !== data.payload)
          );
        }
      }
    );
  };

  // settings handlers
  const handleMaxPlayersChange = (value: number | null) => {
    if (
      value !== null &&
      lobbyIdNumber !== null &&
      stompClient.current &&
      value >= playersPerTeam
    ) {
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyIdNumber}/update`,
        body: JSON.stringify({ type: "UPDATE", payload: { maxPlayers: value } }),
      });
    }
  };

  const handlePlayersPerTeamChange = (value: number) => {
    if (lobbyIdNumber !== null && stompClient.current) {
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyIdNumber}/update`,
        body: JSON.stringify({
          type: "UPDATE",
          payload: { playersPerTeam: value },
        }),
      });
    }
  };

  // invite
  const handleInviteUser = () => {
    if (!inviteInput.trim() || !stompClient.current) {
      message.error("Enter a username");
      return;
    }
    stompClient.current.publish({
      destination: "/app/lobby-manager/invite",
      body: JSON.stringify({
        type: "INVITE",
        payload: { toUsername: inviteInput.trim() },
      }),
    });
    setInvitedUsers((curr) => [
      ...curr,
      { username: inviteInput.trim(), status: "pending" },
    ]);
    setInviteModalVisible(false);
    setInviteInput("");
  };

  // leave
  const handleLeaveLobby = () => {
    if (lobbyIdNumber !== null && stompClient.current) {
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyIdNumber}/leave`,
        body: JSON.stringify({ type: "LEAVE", payload: {} }),
      });
    }
    router.push("/casual");
  };

  // copy code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    message.success("Lobby code copied!");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4" />
          <div>Loading lobby…</div>
        </div>
      </div>
    );
  }

  const allowedTeamOptions = getAllowedTeamSizes(maxPlayers);
  const teamsAreBalanced =
    playersPerTeam === 1 || joinedUsers.length % playersPerTeam === 0;
  const canStartGame =
    joinedUsers.length >= 2 && teamsAreBalanced && isHost;

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
        {/* Settings */}
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
          <div style={{ marginBottom: 12 }}>
            <Text style={{ color: "#fff" }}>Per Team</Text>
            <Select
              value={playersPerTeam}
              onChange={handlePlayersPerTeamChange}
              disabled={!isHost}
              style={{ width: "100%" }}
            >
              {allowedTeamOptions.map((opt) => (
                <Select.Option key={`teamOpt-${opt}`} value={opt}>
                  {opt}
                </Select.Option>
              ))}
            </Select>
          </div>
          <Button danger block onClick={handleLeaveLobby}>Leave</Button>
        </Card>

        {/* Invited */}
        <Card
          title={
            <>
              <UserOutlined style={{ color: "#fff", marginRight: 8 }} />
              <Text style={{ color: "#fff" }}>Invited</Text>
            </>
          }
          extra={
            <Button icon={<UserAddOutlined />} onClick={() => setInviteModalVisible(true)}>
              Invite
            </Button>
          }
          style={{ flex: 1, borderRadius: 8 }}
        >
          {invitedUsers.length ? (
            invitedUsers.map((u) => (
              <UserCard
                key={`invited-${u.username}`}
                username={u.username}
                subview={
                  <Tag key={`tag-${u.username}`} color="purple">
                    {u.status}
                  </Tag>
                }
              />
            ))
          ) : (
            <Text key="no-invites" style={{ color: "#fff" }}>
              No invites sent.
            </Text>
          )}
        </Card>

        {/* Joined */}
        <Card
          title={
            <>
              <TeamOutlined style={{ color: "#fff", marginRight: 8 }} />
              <Text style={{ color: "#fff" }}>Joined</Text>
            </>
          }
          style={{ flex: 1, borderRadius: 8 }}
        >
          {joinedUsers.length ? (
            joinedUsers.map((u) => (
              <UserCard
                key={`joined-${u.userid}`}
                username={u.username}
              />
            ))
          ) : (
            <Text key="no-joined" style={{ color: "#fff" }}>
              No one joined yet.
            </Text>
          )}
        </Card>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button
          type="primary"
          size="large"
          disabled={!canStartGame}
          onClick={() => message.info("Game start not yet implemented")}
        >
          Start Game
        </Button>
      </div>

      {!teamsAreBalanced && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Text style={{ color: "#fff" }}>
            Teams must be evenly balanced.
          </Text>
        </div>
      )}

      <Modal
        title="Invite by Username"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
      >
        <Paragraph>Enter username to invite:</Paragraph>
        <Input
          placeholder="Username"
          value={inviteInput}
          onChange={(e) => setInviteInput(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Button type="primary" block onClick={handleInviteUser}>
          Send
        </Button>
      </Modal>
    </div>
  );
};

export default function Page() {
  return <LobbyPage />;
}
