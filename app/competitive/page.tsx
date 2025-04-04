"use client";

import React, { useState, useEffect } from "react";
import { Card, Row, Col, Modal, Typography } from "antd";
import { useRouter } from "next/navigation";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import LargeCardButton from "@/components/layout/LargeCardButton";

const { Paragraph } = Typography;

const PlayCompetitive: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);

  // Timer for queue waiting state.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInQueue) {
      timer = setInterval(() => {
        setQueueTime((prev) => prev + 1);
      }, 1000);
    } else {
      setQueueTime(0);
    }
    return () => clearInterval(timer);
  }, [isInQueue]);

  // API call to join the competitive queue.
  const onJoinQueue = async () => {
    try {
      if (isInQueue) return;

      const payload = {
        lobbyId: "auto-match", // Internally handled default value
        settings: {
          map: "random",
          rounds: 5,
        },
      };

      interface StartGameResponse {
        gameId: string;
      }

      const response = await apiService.post<StartGameResponse>("/api/games", payload);
      if (response && response.gameId) {
        router.push(`/games/${response.gameId}`);
      }
      // Set waiting state if game is not started immediately.
      setIsInQueue(true);
    } catch (error) {
      console.error("Error joining queue:", error);
      setNotification({
        type: "error",
        message: "Error joining queue",
        description:
          error instanceof Error ? error.message : "An unexpected error occurred.",
        onClose: () => setNotification(null),
      });
    }
  };

  // Open modal with explanations for competitive mode.
  const openInfoModal = () => {
    setModalVisible(true);
  };

  const closeInfoModal = () => {
    setModalVisible(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      {notification && <Notification {...notification} />}

      <Row justify="center">
        <Col xs={24} md={12}>
          <Card bordered={false}>
            <Paragraph>
              In competitive mode, you will be matched with players of a similar rank.
              Your rank is determined by your performance in previous games. Wins, losses, and game statistics
              all contribute to your overall ranking. The higher your rank, the tougher the competition.
            </Paragraph>
            <Paragraph>
              Click the info icon for more details on how ranking works.
              <InfoCircleOutlined
                onClick={openInfoModal}
                style={{ fontSize: "1.5rem", marginLeft: "0.5rem", cursor: "pointer" }}
              />
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Row justify="center" style={{ marginTop: "1rem" }}>
        <Col xs={24} md={12}>
          <LargeCardButton label="Join Queue" onClick={onJoinQueue} disabled={isInQueue} />
          {isInQueue && (
            <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
              <span>Waiting in queue: {queueTime} seconds</span>
            </div>
          )}
        </Col>
      </Row>

      <Modal
        title="Competitive Mode Explained"
        visible={modalVisible}
        onCancel={closeInfoModal}
        footer={null}
      >
        <Paragraph>
          In competitive mode, your ranking is updated based on your game performance.
          Wins earn you points, while losses may lower your rank. Your rank helps match you
          with opponents of similar skill. Detailed game statistics and previous results all play a role.
        </Paragraph>
      </Modal>
    </div>
  );
};

export default PlayCompetitive;
