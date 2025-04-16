'use client';

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
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import UserCard from "@/components/general/usercard";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useGlobalUser } from "@/contexts/globalUser";

const { Title, Text, Paragraph } = Typography;

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

const LobbyCreatePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useGlobalUser();
  const [isAdmin] = useState(true);
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${user?.token ?? ""}`,
    "Content-Type": "application/json",
  });

  const [lobbyCode, setLobbyCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [playersPerTeam, setPlayersPerTeam] = useState(2);
  const [invitedUsers, setInvitedUsers] = useState<
    Array<{ username: string; status: string }>
  >([]);
  const [joinedUsers, setJoinedUsers] = useState<Array<{ username: string }>>([]);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteInput, setInviteInput] = useState("");

  // Local STOMP connection for lobby creation, join, and updates.
  const stompClient = useRef<Client | null>(null);
  const [stompConnected, setStompConnected] = useState(false);
  const lobbySubscription = useRef<unknown>(null);
  const inviteSubscription = useRef<unknown>(null);

  useEffect(() => {
    if (params.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      setLobbyCode(id);
      console.log("Lobby code from URL:", id);
    }
  }, [params.id]);

  useEffect(() => {
    const allowed = getAllowedTeamSizes(maxPlayers);
    if (!allowed.includes(playersPerTeam)) {
      console.log(
        `Resetting playersPerTeam from ${playersPerTeam} to ${allowed[0]} for ${maxPlayers} players`
      );
      setPlayersPerTeam(allowed[0]);
      if (stompConnected && stompClient.current && lobbyCode) {
        stompClient.current.publish({
          destination: `/app/lobby/${lobbyCode}/update`,
          body: JSON.stringify({ playersPerTeam: allowed[0] }),
        });
      }
    }
  }, [maxPlayers, playersPerTeam, stompConnected, lobbyCode]);

  useEffect(() => {
    console.log("User token:", user?.token);
    stompClient.current = new Client({
      webSocketFactory: () =>
        new SockJS(`http://localhost:8080/ws/lobby-manager?token=${user?.token ?? ""}`),
      connectHeaders: {
        Authorization: `Bearer ${user?.token ?? ""}`,
      },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Local STOMP connected");
        setStompConnected(true);

        // Subscribe for lobby creation result.
        stompClient.current?.subscribe(
          "/user/topic/lobby/create/result",
          (msg) => {
            console.log("Received lobby create result:", msg.body);
            try {
              const response = JSON.parse(msg.body);
              if (response.type === "LOBBY_CREATED") {
                console.log("Lobby created:", response.payload);
                setLobbyCode(response.payload.code);
                if (!lobbySubscription.current) {
                  lobbySubscription.current = stompClient.current?.subscribe(
                    `/topic/lobby/${response.payload.code}`,
                    (updateMsg) => {
                      console.log("Received lobby update:", updateMsg.body);
                      const data = JSON.parse(updateMsg.body);
                      if (data.type === "LOBBY_UPDATE") {
                        setInvitedUsers(data.payload.invitedUsers || []);
                        setJoinedUsers(data.payload.joinedUsers || []);
                      }
                    }
                  );
                }
              } else if (response.type === "LOBBY_CREATE_ERROR") {
                message.error(response.payload);
              }
            } catch (err) {
              console.error("Error processing lobby creation response:", err);
            }
          }
        );

        // Subscribe for invite responses (for sent invites).
        inviteSubscription.current = stompClient.current?.subscribe(
          "/user/topic/lobby-manager/invite/result",
          (msg) => {
            console.log("Received invite response:", msg.body);
            try {
              const response = JSON.parse(msg.body);
              if (response.type === "INVITE_RESPONSE") {
                const { username, status } = response.payload;
                setInvitedUsers((prev) =>
                  prev.map((u) =>
                    u.username === username ? { ...u, status } : u
                  )
                );
              }
            } catch (err) {
              console.error("Error processing invite response:", err);
            }
          }
        );

        // Subscribe for lobby updates if a lobbyCode exists.
        if (lobbyCode && !lobbySubscription.current) {
          lobbySubscription.current = stompClient.current!.subscribe(
            `/topic/lobby/${lobbyCode}`,
            (updateMsg) => {
              console.log("Received lobby update (post-connect):", updateMsg.body);
              const data = JSON.parse(updateMsg.body);
              if (data.type === "LOBBY_UPDATE") {
                setInvitedUsers(data.payload.invitedUsers || []);
                setJoinedUsers(data.payload.joinedUsers || []);
              }
            }
          );
        }

        // If no lobby code exists, create a lobby.
        if (!lobbyCode) {
          console.log("No lobbyCode present, publishing lobby creation request.");
          stompClient.current!.publish({
            destination: "/app/lobby/create",
            body: JSON.stringify({ maxPlayers, playersPerTeam }),
          });
        }
      },
      onStompError: (frame) => {
        console.error("Local STOMP error:", frame.headers["message"]);
        console.error("Details:", frame.body);
      },
      onDisconnect: () => {
        console.log("Local STOMP disconnected");
        setStompConnected(false);
      },
    });

    stompClient.current.activate();

    return () => {
      stompClient.current?.deactivate();
    };
  }, [lobbyCode, maxPlayers, playersPerTeam, user?.token]);

  const handleMaxPlayersChange = (value: number | null) => {
    if (value !== null && value >= 2 && value <= 8) {
      setMaxPlayers(value);
      if (stompConnected && stompClient.current && lobbyCode) {
        console.log("Publishing lobby update: maxPlayers:", value);
        stompClient.current.publish({
          destination: `/app/lobby/${lobbyCode}/update`,
          body: JSON.stringify({ maxPlayers: value }),
        });
      }
    }
  };

  const handlePlayersPerTeamChange = (value: number) => {
    setPlayersPerTeam(value);
    if (stompConnected && stompClient.current && lobbyCode) {
      console.log("Publishing lobby update: playersPerTeam:", value);
      stompClient.current.publish({
        destination: `/app/lobby/${lobbyCode}/update`,
        body: JSON.stringify({ playersPerTeam: value }),
      });
    }
  };

  const openInviteModal = () => {
    console.log("Opening invite modal");
    setInviteModalVisible(true);
  };

  // Updated handleInviteOk to send the message with both a "type" and a "payload" property.
  const handleInviteOk = () => {
    if (inviteInput && stompConnected && stompClient.current) {
      console.log("Publishing invitation for username:", inviteInput);
      stompClient.current.publish({
        destination: "/app/lobby-manager/invite",
        body: JSON.stringify({
          type: "INVITE",
          payload: { toUsername: inviteInput },
        }),
      });
      setInvitedUsers((prev) => [
        ...prev,
        { username: inviteInput, status: "pending" },
      ]);
      message.success("Invitation sent.");
      setInviteModalVisible(false);
      setInviteInput("");
    } else {
      message.error("Please enter a valid username.");
    }
  };

  const handleInviteCancel = () => {
    console.log("Cancelling invite modal");
    setInviteModalVisible(false);
    setInviteInput("");
  };

  const handleStartGame = async () => {
    try {
      console.log("Starting game with lobbyCode:", lobbyCode);
      const response = await fetch("/games", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ lobbyCode }),
      });
      if (!response.ok) throw new Error("Failed to start game");
      const data = await response.json();
      const gameId = data.gameId;
      router.push(`/game/games/${gameId}`);
    } catch (error) {
      console.error("Error starting game:", error);
      message.error("Failed to start game. Please try again later.");
    }
  };

  const allowedTeamOptions = getAllowedTeamSizes(maxPlayers);
  const teamsAreBalanced =
    playersPerTeam === 1 || joinedUsers.length % playersPerTeam === 0;
  const canStartGame = joinedUsers.length >= 2 && teamsAreBalanced;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: 30,
        backgroundColor: "#282c34",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Title level={2} style={{ color: "#fff", fontWeight: 600 }}>
          Create Lobby
        </Title>
        <div
          style={{
            background: "#fff",
            padding: "0.5rem 1rem",
            borderRadius: "20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <Text style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#8a2be2" }} copyable={{ text: lobbyCode }}>
            Lobby Code: {lobbyCode || "Loading..."}
          </Text>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, width: "100%", marginTop: 30 }}>
        <div style={{ flex: "0 0 250px" }}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SettingOutlined style={{ fontSize: "1.5rem", color: "#fff" }} />
              <Text strong style={{ color: "#fff", fontSize: "1.2rem" }}>
                Lobby Settings
              </Text>
            </div>
            <div style={{ marginTop: 20 }}>
              <Text strong style={{ color: "#fff" }}>
                Number of Players
              </Text>
              <InputNumber
                min={2}
                max={8}
                value={maxPlayers}
                onChange={handleMaxPlayersChange}
                disabled={!isAdmin}
                style={{ marginTop: 10, width: "100%" }}
              />
              <div style={{ marginTop: 20 }}>
                <Text strong style={{ color: "#fff" }}>
                  Players per Team
                </Text>
                <Select
                  value={playersPerTeam}
                  onChange={handlePlayersPerTeamChange}
                  disabled={!isAdmin}
                  style={{ marginTop: 10, width: "100%" }}
                >
                  {allowedTeamOptions.map((option) => (
                    <Select.Option key={option} value={option}>
                      {option}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <Card
            title={
              <>
                <UserOutlined style={{ fontSize: "1.2rem", color: "#fff" }} />
                <Text strong style={{ color: "#fff", marginLeft: 8 }}>
                  Invited Users
                </Text>
              </>
            }
            extra={
              isAdmin && (
                <Button type="primary" icon={<UserAddOutlined />} onClick={openInviteModal}>
                  Invite by Username
                </Button>
              )
            }
            style={{ borderRadius: 8 }}
          >
            {invitedUsers.length > 0 ? (
              invitedUsers.map((item) => (
                <UserCard key={item.username} username={item.username} subview={<Tag color="purple">{item.status}</Tag>} />
              ))
            ) : (
              <Text style={{ color: "#fff" }}>No invites sent yet.</Text>
            )}
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <Card
            title={
              <>
                <TeamOutlined style={{ fontSize: "1.2rem", color: "#fff" }} />
                <Text strong style={{ color: "#fff", marginLeft: 8 }}>
                  Joined Users
                </Text>
              </>
            }
            style={{ borderRadius: 8 }}
          >
            {joinedUsers.length > 0 ? (
              joinedUsers.map((item) => (
                <UserCard key={item.username} username={item.username} />
              ))
            ) : (
              <Text style={{ color: "#fff" }}>No players have joined yet.</Text>
            )}
          </Card>
        </div>
      </div>

      <div style={{ display: "flex", marginTop: 30, justifyContent: "center" }}>
        <Button onClick={handleStartGame} type="primary" size="large" disabled={!canStartGame}>
          Start Game
        </Button>
      </div>

      {joinedUsers.length > 0 && playersPerTeam > 1 && !teamsAreBalanced && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Text style={{ color: "#fff" }}>
            Teams are not balanced; total joined players must be evenly divisible by players per team.
          </Text>
        </div>
      )}

      <Modal title="Invite by Username" open={inviteModalVisible} onCancel={handleInviteCancel} footer={null}>
        <Paragraph strong>Enter username to invite:</Paragraph>
        <Input
          placeholder="Enter username"
          value={inviteInput}
          onChange={(e) => setInviteInput(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <Button onClick={handleInviteOk} type="primary" style={{ width: "100%" }}>
          Send Invitation
        </Button>
      </Modal>
    </div>
  );
};

export default function Page() {
  return <LobbyCreatePage />;
}
