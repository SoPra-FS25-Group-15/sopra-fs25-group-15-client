"use client";

import React, { useState } from "react";
import { Row, Col, Modal, Form, Input, Button, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import LargeCardButton from "@/components/general/LargeCardButton";
import { UserAddOutlined, LoginOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const PlayCasual: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

  // State for Lobby ID and Invite Code for joining a lobby.
  const [lobbyId, setLobbyId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [showJoinGameModal, setShowJoinGameModal] = useState(false);

  // Redirect immediately to the lobby creation page.
  const handleCreateLobby = () => {
    router.push("/lobbies/create");
  };

  // API call to join a lobby.
  const handleJoinGame = async () => {
    if (!lobbyId.trim() || !inviteCode.trim()) {
      setNotification({
        type: "error",
        message: "Both Lobby ID and Invite Code are required",
        onClose: () => setNotification(null)
      });
      return;
    }

    // Retrieve userId and token from localStorage.
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token") || "";
    // Endpoint and payload for joining the lobby.
    const endpoint = `/api/lobbies/${lobbyId}/join?userId=${userId}`;
    const payload = { 
      lobbyCode: inviteCode,
      mode: "solo",
      friendInvited: false
    };

    // Pass the token in the headers with the "Bearer" prefix.
    const headers = { Authorization: `Bearer ${token}` };

    try {
      interface JoinGameResponse {
        lobby: {
          lobbyId: string;
          lobbyCode: string;
          // other lobby fields...
        };
      }
      const response = await apiService.post<JoinGameResponse>(endpoint, payload, { headers });
      if (response && response.lobby && response.lobby.lobbyId) {
        router.push(`/lobbies/${response.lobby.lobbyId}`);
      }
    } catch (error) {
      console.error("Error joining lobby:", error);
      setNotification({
        type: "error",
        message: "Error joining lobby",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        onClose: () => setNotification(null)
      });
    } finally {
      setShowJoinGameModal(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      {notification && <Notification {...notification} />}
      <Row justify="center">
        <Col xs={24} md={12} style={{ textAlign: "center" }}>
          <Title level={2}>Play Casual</Title>
          <Paragraph>
            Host a game and invite your friends. This game mode will not affect your ranked rating.
          </Paragraph>
          <Paragraph style={{ margin: "1rem 0" }}>
            <span style={{ fontWeight: "bold", color: "#1890ff", fontSize: "1.2rem" }}>
              2-8 Players
            </span>
            <span style={{ margin: "0 0.5rem", color: "#aaa" }}>|</span>
            <span style={{ fontWeight: "bold", color: "#1890ff", fontSize: "1.2rem" }}>
              20-60 Minutes
            </span>
          </Paragraph>
        </Col>
      </Row>
      <Row justify="center" style={{ marginTop: "2rem" }} gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <LargeCardButton
            label="Create Lobby"
            onClick={handleCreateLobby}
            icon={<UserAddOutlined style={{ fontSize: "2rem" }} />}
          />
        </Col>
        <Col xs={24} md={6}>
          <LargeCardButton
            label="Join Lobby"
            onClick={() => setShowJoinGameModal(true)}
            icon={<LoginOutlined style={{ fontSize: "2rem" }} />}
          />
        </Col>
      </Row>

      {/* Join Lobby Modal */}
      <Modal
        title="Join Lobby"
        open={showJoinGameModal}
        onCancel={() => setShowJoinGameModal(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleJoinGame}>
          <Form.Item
            name="lobbyId"
            label="Lobby ID"
            rules={[{ required: true, message: "Lobby ID is required" }]}
          >
            <Input
              placeholder="Enter lobby ID"
              value={lobbyId}
              onChange={(e) => setLobbyId(e.target.value)}
            />
          </Form.Item>
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
              Join Lobby
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlayCasual;
