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

  const [inviteCode, setInviteCode] = useState("");
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [showCreateLobbyModal, setShowCreateLobbyModal] = useState(false);
  const [showJoinGameModal, setShowJoinGameModal] = useState(false);

  // Function to handle create lobby (redirects to the create lobby page)
  const handleCreateLobby = () => {
    try {
      // Perform any necessary user state checks here (e.g. user is logged in, not in a game, etc.)
      router.push("/lobbies/create");
    } catch (error) {
      console.error("Error redirecting to create lobby:", error);
      setNotification({
        type: "error",
        message: "Error redirecting to create lobby",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        onClose: () => setNotification(null)
      });
    } finally {
      setShowCreateLobbyModal(false);
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
    const payload = { lobbyCode: inviteCode }; // Other parameters handled internally.
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
            onClick={() => setShowCreateLobbyModal(true)}
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

      {/* Create Lobby Modal */}
      <Modal
        title="Create Lobby"
        open={showCreateLobbyModal}
        onCancel={() => setShowCreateLobbyModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCreateLobbyModal(false)}>
            Cancel
          </Button>,
          <Button key="create" type="primary" onClick={handleCreateLobby}>
            Create Lobby
          </Button>
        ]}
      >
        <Paragraph>
          You will be redirected to the lobby creation page. Please ensure you are not currently in a game and are logged in.
        </Paragraph>
      </Modal>

      {/* Join Lobby Modal */}
      <Modal
        title="Join Lobby"
        open={showJoinGameModal}
        onCancel={() => setShowJoinGameModal(false)}
        footer={null}
      >
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
              Join Lobby
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlayCasual;
