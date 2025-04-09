"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Typography,
  Slider,
  Button,
  List,
  Modal,
  Input,
  message,
  Card,
  Space,
  Tag,
} from "antd";
import { UserAddOutlined, CopyOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import UserCard from "@/components/general/usercard";

const { Title, Text } = Typography;

const maxPlayersMarks = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
};

// Helper function for allowed team sizes based on total players:
// - For 2, 3, 5, or 7 players, only 1 player per team is allowed.
// - For 4 players, 1 or 2 are allowed.
// - For 6 players, 1, 2 or 3 are allowed.
// - For 8 players, 1, 2 or 4 are allowed.
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

  // -------------------------
  // Token and Auth headers
  // -------------------------
  const [authToken, setAuthToken] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingToken, setLoadingToken] = useState<boolean>(true);

  useEffect(() => {
    let token = localStorage.getItem("token");
    if (!token) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          token = parsedUser.token;
        } catch (err) {
          console.error("Failed to parse user from localStorage:", err);
        }
      }
    }
    console.log("Token retrieved:", token);
    setAuthToken(token);
    setLoadingToken(false);
  }, []);

  const getAuthHeaders = () => ({
    Authorization: authToken || "",
    "Content-Type": "application/json",
  });

  // -------------------------
  // Lobby State and WebSocket
  // -------------------------
  // Lobby settings
  const [lobbyCode, setLobbyCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4); // Allowed range: 2–8
  const [playersPerTeam, setPlayersPerTeam] = useState(2); // Will be restricted by maxPlayers

  // Use URL parameter (if available) as lobby code.
  useEffect(() => {
    if (params.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      setLobbyCode(id);
    }
  }, [params.id]);

  // When maxPlayers changes, if the current playersPerTeam is not allowed, automatically reset it.
  useEffect(() => {
    const allowed = getAllowedTeamSizes(maxPlayers);
    if (!allowed.includes(playersPerTeam)) {
      console.log(
        `Setback triggered: resetting playersPerTeam from ${playersPerTeam} to ${allowed[0]} for ${maxPlayers} players`
      );
      setPlayersPerTeam(allowed[0]);
      if (socketConnected && socketRef.current && isAdmin) {
        socketRef.current.send(
          JSON.stringify({
            type: "UPDATE_CONFIG",
            payload: { playersPerTeam: allowed[0] },
          })
        );
      }
    }
  }, [maxPlayers, playersPerTeam]);

  // Users lists
  const [invitedUsers, setInvitedUsers] = useState<
    Array<{ username: string; status: string }>
  >([]);
  const [joinedUsers, setJoinedUsers] = useState<Array<{ username: string }>>([]);

  // For demonstration, assume current user is admin (lobby creator)
  const [isAdmin] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);

  // Modal state for inviting friends (by email)
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteInput, setInviteInput] = useState("");

  // WebSocket reference
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket – adjust URL as needed.
    socketRef.current = new WebSocket("ws://localhost:8080/ws/lobby");

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
      setSocketConnected(true);
      // Only set lobbyCode if not already set via URL
      if (!lobbyCode) {
        setLobbyCode("12345");
      }
      // Optionally send a CREATE_LOBBY message
      socketRef.current?.send(
        JSON.stringify({
          type: "CREATE_LOBBY",
          payload: { maxPlayers, playersPerTeam },
        })
      );
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "LOBBY_UPDATE":
            // Expected payload: { invitedUsers: [...], joinedUsers: [...] }
            if (data.payload) {
              setInvitedUsers(data.payload.invitedUsers || []);
              setJoinedUsers(data.payload.joinedUsers || []);
            }
            break;
          case "INVITE_RESPONSE":
            // Expected payload: { username, status }
            const { username, status } = data.payload;
            setInvitedUsers((prev) =>
              prev.map((user) =>
                user.username === username ? { ...user, status } : user
              )
            );
            break;
          default:
            console.warn("Unhandled message type:", data.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message", error);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error", error);
      setWsError("WebSocket encountered an error.");
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setSocketConnected(false);
    };

    return () => {
      socketRef.current?.close();
    };
  }, [maxPlayers, playersPerTeam, lobbyCode]);

  // Handler for max players slider (admin only)
  const handleMaxPlayersChange = (value: number) => {
    if (value >= 2 && value <= 8) {
      setMaxPlayers(value);
      if (socketConnected && socketRef.current && isAdmin) {
        socketRef.current.send(
          JSON.stringify({
            type: "UPDATE_CONFIG",
            payload: { maxPlayers: value },
          })
        );
      }
    }
  };

  // Handler for players per team slider (admin only)
  const handlePlayersPerTeamChange = (value: number) => {
    const allowed = getAllowedTeamSizes(maxPlayers);
    if (!allowed.includes(value)) {
      message.error(`Team size ${value} is not allowed for ${maxPlayers} players.`);
      return;
    }
    setPlayersPerTeam(value);
    if (socketConnected && socketRef.current && isAdmin) {
      socketRef.current.send(
        JSON.stringify({
          type: "UPDATE_CONFIG",
          payload: { playersPerTeam: value },
        })
      );
    }
  };

  const openInviteModal = () => setInviteModalVisible(true);

  // Updated: use email in payload and update placeholder text.
  const handleInviteOk = () => {
    if (inviteInput && socketConnected && isAdmin && socketRef.current) {
      socketRef.current.send(
        JSON.stringify({
          type: "INVITE_FRIEND",
          payload: { email: inviteInput },
        })
      );
      setInvitedUsers((prev) => [
        ...prev,
        { username: inviteInput, status: "pending" },
      ]);
      message.success("Invitation sent.");
      setInviteModalVisible(false);
      setInviteInput("");
    } else {
      message.error("Please enter a valid email.");
    }
  };

  const handleInviteCancel = () => {
    setInviteModalVisible(false);
    setInviteInput("");
  };

  const handleKick = (username: string) => {
    if (socketConnected && isAdmin && socketRef.current) {
      socketRef.current.send(
        JSON.stringify({
          type: "KICK_USER",
          payload: { username },
        })
      );
      setJoinedUsers((prev) =>
        prev.filter((user) => user.username !== username)
      );
      message.success(`Kicked ${username} from the lobby.`);
    }
  };

  const teamsAreBalanced =
    playersPerTeam === 1 || joinedUsers.length % playersPerTeam === 0;
  const canStartGame = joinedUsers.length >= 2 && teamsAreBalanced;

  const handleStartGame = async () => {
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ lobbyCode }),
      });
      if (!response.ok) {
        throw new Error("Failed to start game");
      }
      const data = await response.json();
      const gameId = data.gameId;
      router.push(`/game/games/${gameId}`);
    } catch (error) {
      console.error("Error starting game:", error);
      message.error("Failed to start game. Please try again later.");
    }
  };

  // Build slider marks for players per team based solely on allowed options.
  const allowedTeamOptions = getAllowedTeamSizes(maxPlayers);
  const teamMarks = Object.fromEntries(
    allowedTeamOptions.map((val) => [val, String(val)])
  );

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {wsError && <Text type="danger">{wsError}</Text>}

      {/* Header */}
      <Row justify="center" style={{ marginBottom: "2rem" }}>
        <Col>
          <Title level={2}>Create Lobby</Title>
          <Text
            strong
            style={{ fontSize: "1.5rem" }}
            copyable={{ text: lobbyCode, icon: <CopyOutlined style={{ color: "#8a2be2" }} /> }}
          >
            Lobby Code: {lobbyCode || "Loading..."}
          </Text>
        </Col>
      </Row>

      {/* Lobby Settings */}
      <Card
        style={{
          margin: "0 auto 2rem auto",
          maxWidth: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          borderRadius: "8px",
        }}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: "1rem" }}>
          Lobby Settings
        </Title>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Text strong>Number of Players</Text>
            <Slider
              min={2}
              max={8}
              step={1}
              marks={maxPlayersMarks}
              value={maxPlayers}
              onChange={handleMaxPlayersChange}
              tooltipVisible={false}
              style={{ marginTop: "1rem" }}
            />
          </div>
          <div>
            <Text strong>Players per Team</Text>
            <Slider
              min={Math.min(...allowedTeamOptions)}
              max={Math.max(...allowedTeamOptions)}
              marks={teamMarks}
              step={null}
              value={playersPerTeam}
              onChange={handlePlayersPerTeamChange}
              tooltipVisible={false}
              style={{ marginTop: "1rem" }}
            />
          </div>
        </Space>
      </Card>

      {/* Invite Section (admin only) */}
      {isAdmin && (
        <Row justify="center" style={{ marginBottom: "2rem" }}>
          <Button type="primary" icon={<UserAddOutlined />} onClick={openInviteModal}>
            Invite Friend
          </Button>
        </Row>
      )}

      {/* Users Panels */}
      <Row gutter={24} justify="center" style={{ marginBottom: "2rem" }}>
        <Col xs={24} md={10}>
          <Card
            title="Invited Users"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "4px" }}
          >
            {invitedUsers.length > 0 ? (
              <List
                dataSource={invitedUsers}
                renderItem={(item) => (
                  <List.Item>
                    <UserCard
                      username={item.username}
                      subview={<Tag color="purple">{item.status}</Tag>}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text>No invites sent yet.</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card
            title="Joined Users"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "4px" }}
          >
            {joinedUsers.length > 0 ? (
              <List
                dataSource={joinedUsers}
                renderItem={(item) => (
                  <List.Item
                    actions={
                      isAdmin
                        ? [
                            <Button
                              key={item.username}
                              type="link"
                              onClick={() => handleKick(item.username)}
                            >
                              Kick
                            </Button>,
                          ]
                        : []
                    }
                  >
                    <UserCard username={item.username} />
                  </List.Item>
                )}
              />
            ) : (
              <Text>No players have joined yet.</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Start Game Button */}
      <Row justify="center">
        <Button type="primary" size="large" disabled={!canStartGame} onClick={handleStartGame}>
          Start Game
        </Button>
      </Row>
      {joinedUsers.length > 0 && playersPerTeam > 1 && !teamsAreBalanced && (
        <Row justify="center" style={{ marginTop: "1rem" }}>
          <Text type="warning">
            Teams are not balanced; total joined players must be evenly divisible by players per team.
          </Text>
        </Row>
      )}

      {/* Invite Friend Modal */}
      <Modal
        title="Invite Friend"
        visible={inviteModalVisible}
        onOk={handleInviteOk}
        onCancel={handleInviteCancel}
        okText="Send Invite"
      >
        <Input
          placeholder="Enter friend's email"
          value={inviteInput}
          onChange={(e) => setInviteInput(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default function Page() {
  return <LobbyCreatePage />;
}
