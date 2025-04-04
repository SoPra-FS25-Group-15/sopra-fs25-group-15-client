"use client";

import React, { useState } from "react";
import { Card, Row, Col, Input, Button, Form } from "antd";
import { useRouter } from "next/navigation";
import { PlusOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";

const PlayCasual: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

  const [inviteCode, setInviteCode] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  // Interface for create lobby form values
  interface CreateLobbyFormValues {
    lobbyName: string;
    hints: string;
  }

  // API call to create a lobby.
  // Only lobbyName and hints are user-provided.
  const onCreateLobbyFinish = async (values: CreateLobbyFormValues) => {
    try {
      const payload = {
        lobbyName: values.lobbyName,
        hintsEnabled: values.hints.split(",").map((hint: string) => hint.trim()),
        maxPlayersPerTeam: 4,      // Handled internally
        isPrivate: true,           // Handled internally
        gameType: "unranked",      // Handled internally
        mode: "solo",              // Handled internally
        teams: {}
      };

      interface CreateLobbyResponse {
        lobbyCode: string;
      }

      const response = await apiService.post<CreateLobbyResponse>("/lobbies", payload);
      if (response && response.lobbyCode) {
        router.push(`/lobbies/${response.lobbyCode}`);
      }
    } catch (error) {
      console.error("Error creating lobby:", error);
      setNotification({
        type: "error",
        message: "Error creating lobby",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        onClose: () => setNotification(null)
      });
    }
  };

  // API call to join a lobby.
  const handleJoinGame = async () => {
    if (!inviteCode.trim()) {
      setNotification({
        type: "error",
        message: "Invite code is required",
        onClose: () => setNotification(null)
      });
      return;
    }
    const endpoint = `/api/lobbies/${inviteCode}/join`;
    const payload = { lobbyCode: inviteCode }; // All other parameters are handled internally.
    try {
      interface JoinGameResponse {
        lobby: {
          lobbyCode: string;
        };
      }

      const response = await apiService.post<JoinGameResponse>(endpoint, payload);
      if (response && response.lobby && response.lobby.lobbyCode) {
        router.push(`/lobbies/${response.lobby.lobbyCode}`);
      }
    } catch (error) {
      console.error("Error joining lobby:", error);
      setNotification({
        type: "error",
        message: "Error joining lobby",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        onClose: () => setNotification(null)
      });
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      {notification && <Notification {...notification} />}
      <Card title="Play Casual">
        <p>
          Host a game and invite your friends. This game mode will not affect your ranked rating.
        </p>
        <p>2-8 Players, 20-60 Minutes</p>
      </Card>
      <Row gutter={[16, 16]} style={{ marginTop: "1rem" }}>
        <Col xs={24} md={12}>
          <Card title="Create lobby">
            <p>Start a new game and invite your friends</p>
            {showCreateForm ? (
              <Form layout="vertical" onFinish={onCreateLobbyFinish}>
                <Form.Item
                  name="lobbyName"
                  label="Lobby Name"
                  rules={[{ required: true, message: "Lobby name is required" }]}
                >
                  <Input placeholder="Enter lobby name" />
                </Form.Item>
                <Form.Item
                  name="hints"
                  label="Hints (comma separated)"
                  initialValue="card1, card2"
                >
                  <Input placeholder="Enter hints separated by commas" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    Create Lobby
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <div
                style={{ fontSize: "2rem", textAlign: "center", cursor: "pointer" }}
                onClick={() => setShowCreateForm(true)}
              >
                <PlusOutlined />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Join a game">
            <p>Join a game via an invite code</p>
            {showJoinForm ? (
              <Form layout="vertical" onFinish={handleJoinGame}>
                <Form.Item
                  name="inviteCode"
                  label="Invite Code"
                  rules={[{ required: true, message: "Invite code is required" }]}
                >
                  <Input
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    Join Game
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <div
                style={{ fontSize: "2rem", textAlign: "center", cursor: "pointer" }}
                onClick={() => setShowJoinForm(true)}
              >
                <PlusOutlined />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PlayCasual;
