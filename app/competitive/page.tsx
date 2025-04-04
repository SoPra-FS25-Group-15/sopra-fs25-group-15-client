"use client";

import React, { useState } from "react";
import { Card, Row, Col } from "antd";
import { useRouter } from "next/navigation";
import { PlusOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";

const PlayCompetitive: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  // API call to start a competitive game automatically.
  const onStartGame = async () => {
    try {
      const payload = {
        lobbyId: "auto-match", // Internally handled default value
        settings: {
          map: "random",
          rounds: 5
        }
      };

      interface StartGameResponse {
        gameId: string;
      }

      const response = await apiService.post<StartGameResponse>("/api/games", payload);
      if (response && response.gameId) {
        router.push(`/games/${response.gameId}`);
      }
    } catch (error) {
      console.error("Error starting game:", error);
      setNotification({
        type: "error",
        message: "Error starting game",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        onClose: () => setNotification(null)
      });
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      {notification && <Notification {...notification} />}
      <Card title="Play Competitive">
        <p>You will be automatically matched based on your rank.</p>
        <p>Get ready to compete!</p>
      </Card>
      <Row gutter={[16, 16]} style={{ marginTop: "1rem" }}>
        <Col xs={24} md={12}>
          <Card title="Start Game">
            <p>Click below to join a competitive game</p>
            <div
              style={{ fontSize: "2rem", textAlign: "center", cursor: "pointer" }}
              onClick={onStartGame}
            >
              <PlusOutlined />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PlayCompetitive;
