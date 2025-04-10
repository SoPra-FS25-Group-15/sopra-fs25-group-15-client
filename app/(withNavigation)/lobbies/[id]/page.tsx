"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  InputNumber,
  Button,
  List,
  Modal,
  Input,
  message,
  Card,
  Tag,
  Select,
  Divider,
  Typography,
} from "antd";
import { Flex } from "antd"; // Assumes Flex is available as in your round card page
import {
  UserAddOutlined,
  CopyOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import UserCard from "@/components/general/usercard";

const { Title, Text, Paragraph } = Typography;

// Helper function for allowed team sizes based on total players.
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

  // Token and Auth headers
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

  // Lobby state
  const [lobbyCode, setLobbyCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4); // Allowed range: 2–8
  const [playersPerTeam, setPlayersPerTeam] = useState(2);

  // Fetch friends from your API.
  const [friends, setFriends] = useState<
    Array<{ id: number; username: string; email?: string }>
  >([]);
  useEffect(() => {
    fetch("/friends")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch friends");
        return response.json();
      })
      .then((data) => setFriends(data))
      .catch((error) => console.error("Error fetching friends:", error));
  }, []);

  // Use URL parameter as lobby code.
  useEffect(() => {
    if (params.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      setLobbyCode(id);
    }
  }, [params.id]);

  // Reset playersPerTeam when maxPlayers changes.
  useEffect(() => {
    const allowed = getAllowedTeamSizes(maxPlayers);
    if (!allowed.includes(playersPerTeam)) {
      console.log(
        `Resetting playersPerTeam from ${playersPerTeam} to ${allowed[0]} for ${maxPlayers} players`
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

  // User lists state
  const [invitedUsers, setInvitedUsers] = useState<
    Array<{ username: string; status: string }>
  >([]);
  const [joinedUsers, setJoinedUsers] = useState<Array<{ username: string }>>([]);

  // Assume current user is admin.
  const [isAdmin] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [wsError, setWsError] = useState<string | null>(null);

  // Modal state for inviting friends.
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteInput, setInviteInput] = useState("");

  // WebSocket reference.
  const socketRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8080/ws/lobby");
    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
      setSocketConnected(true);
      if (!lobbyCode) setLobbyCode("12345");
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
            if (data.payload) {
              setInvitedUsers(data.payload.invitedUsers || []);
              setJoinedUsers(data.payload.joinedUsers || []);
            }
            break;
          case "INVITE_RESPONSE":
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

  // Handlers
  const handleMaxPlayersChange = (value: number | null) => {
    if (value !== null && value >= 2 && value <= 8) {
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

  const handlePlayersPerTeamChange = (value: number) => {
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
      message.error("Please enter a valid email or username.");
    }
  };
  const handleInviteCancel = () => {
    setInviteModalVisible(false);
    setInviteInput("");
  };

  const handleInviteFromFriend = (friend: { id: number; username: string; email?: string }) => {
    if (socketConnected && isAdmin && socketRef.current) {
      socketRef.current.send(
        JSON.stringify({
          type: "INVITE_FRIEND",
          payload: { email: friend.email || friend.username },
        })
      );
      setInvitedUsers((prev) => [
        ...prev,
        { username: friend.username, status: "pending" },
      ]);
      message.success(`Invitation sent to ${friend.username}.`);
    }
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

  const teamsAreBalanced = playersPerTeam === 1 || joinedUsers.length % playersPerTeam === 0;
  const canStartGame = joinedUsers.length >= 2 && teamsAreBalanced;
  const handleStartGame = async () => {
    try {
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

  return (
    <Flex vertical gap={20} style={{ width: "100%", minHeight: "100vh", padding: 30 }}>
      
      {/* Page Title and Lobby Code */}
      <Flex vertical align="center" gap={10} style={{ width: "100%" }}>
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
          <Text
            style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#8a2be2" }}
            copyable={{ text: lobbyCode, icon: <CopyOutlined style={{ color: "#8a2be2" }} /> }}
          >
            Lobby Code: {lobbyCode || "Loading..."}
          </Text>
        </div>
      </Flex>
      
      {/* Main Content: Three columns */}
      <Flex gap={20} style={{ width: "100%", flexGrow: 1 }}>
        {/* Left Column: Lobby Settings */}
        <Flex vertical gap={20} style={{ flex: "0 0 250px" }}>
          <Card style={{ borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <Flex align="center" gap={10}>
              <SettingOutlined style={{ fontSize: "1.5rem", color: "#fff" }} />
              <Text strong style={{ color: "#fff", fontSize: "1.2rem" }}>Lobby Settings</Text>
            </Flex>
            <Flex vertical gap={20} style={{ marginTop: 20 }}>
              <Flex vertical style={{ width: "100%" }}>
                <Text strong style={{ color: "#fff" }}>Number of Players</Text>
                <InputNumber
                  min={2}
                  max={8}
                  value={maxPlayers}
                  onChange={handleMaxPlayersChange}
                  disabled={!isAdmin}
                  style={{ marginTop: 10, width: "100%" }}
                />
              </Flex>
              <Flex vertical style={{ width: "100%" }}>
                <Text strong style={{ color: "#fff" }}>Players per Team</Text>
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
              </Flex>
            </Flex>
          </Card>
        </Flex>

        {/* Middle Column: Invited Users */}
        <Flex vertical gap={20} style={{ flex: 1 }}>
          <Card
            title={
              <Flex align="center" gap={5}>
                <UserOutlined style={{ fontSize: "1.2rem", color: "#fff" }} />
                <Text strong style={{ color: "#fff" }}>Invited Users</Text>
              </Flex>
            }
            extra={
              isAdmin && (
                <Button type="primary" icon={<UserAddOutlined />} onClick={openInviteModal}>
                  Invite Friend
                </Button>
              )
            }
            style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", flex: 1 }}
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
              <Text style={{ color: "#fff" }}>No invites sent yet.</Text>
            )}
          </Card>
        </Flex>

        {/* Right Column: Joined Users */}
        <Flex vertical gap={20} style={{ flex: 1 }}>
          <Card
            title={
              <Flex align="center" gap={5}>
                <TeamOutlined style={{ fontSize: "1.2rem", color: "#fff" }} />
                <Text strong style={{ color: "#fff" }}>Joined Users</Text>
              </Flex>
            }
            style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", flex: 1 }}
          >
            {joinedUsers.length > 0 ? (
              <List
                dataSource={joinedUsers}
                renderItem={(item) => (
                  <List.Item actions={isAdmin ? [<Button key={item.username} type="link" onClick={() => handleKick(item.username)}>Kick</Button>] : []}>
                    <UserCard username={item.username} />
                  </List.Item>
                )}
              />
            ) : (
              <Text style={{ color: "#fff" }}>No players have joined yet.</Text>
            )}
          </Card>
        </Flex>
      </Flex>
      
      {/* Start Game Button (below all columns) */}
      <Flex vertical align="center" gap={20} style={{ width: "100%" }}>
        <Button
          onClick={handleStartGame}
          type="primary"
          size="large"
          disabled={!canStartGame}
          style={{ padding: "0.5rem 2rem", fontSize: "1rem" }}
        >
          Start Game
        </Button>
        {joinedUsers.length > 0 && playersPerTeam > 1 && !teamsAreBalanced && (
          <Text type="warning" style={{ color: "#fff" }}>
            Teams are not balanced; total joined players must be evenly divisible by players per team.
          </Text>
        )}
      </Flex>
      
      {/* Invite Friend Modal */}
      <Modal
        title="Invite Friend"
        visible={inviteModalVisible}
        onCancel={handleInviteCancel}
        footer={null}
      >
        <Paragraph strong>Choose from your friends:</Paragraph>
        <List
          dataSource={friends}
          renderItem={(friend) => (
            <List.Item
              actions={[
                <Button key={friend.id} type="link" onClick={() => handleInviteFromFriend(friend)}>
                  Invite
                </Button>,
              ]}
            >
              <UserCard username={friend.username} />
            </List.Item>
          )}
        />
        <Divider />
        <Paragraph strong>Or invite by email:</Paragraph>
        <Input
          placeholder="Enter friend's email or username"
          value={inviteInput}
          onChange={(e) => setInviteInput(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <Button onClick={handleInviteOk} type="primary" style={{ width: "100%" }}>
          Invite by Email
        </Button>
      </Modal>
    </Flex>
  );
};

export default function Page() {
  return <LobbyCreatePage />;
}
