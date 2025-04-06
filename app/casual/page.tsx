"use client";

import React, { useState } from "react";
import { Row, Col, Modal, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import LargeCardButton from "@/components/general/LargeCardButton";
import { UserAddOutlined, LoginOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const PlayCasual: React.FC = () => {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const apiService = useApi();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [showJoinGameModal, setShowJoinGameModal] = useState(false);

  // Redirect to lobby creation page.
  const handleCreateLobby = () => {
    router.push("/lobbies/create");
  };

  // Instead of joining a lobby, display a pop-up message.
  const handleJoinGame = () => {
    setShowJoinGameModal(true);
  };

  const closeJoinGameModal = () => {
    setShowJoinGameModal(false);
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
            onClick={handleJoinGame}
            icon={<LoginOutlined style={{ fontSize: "2rem" }} />}
          />
        </Col>
      </Row>

      {/* Join Lobby Modal Pop-up */}
      <Modal
        title="Join Lobby"
        open={showJoinGameModal}
        onCancel={closeJoinGameModal}
        footer={null}
      >
        <Paragraph>
          Join Lobby functionality is coming soon. Please come back later.
        </Paragraph>
      </Modal>
    </div>
  );
};

export default PlayCasual;
