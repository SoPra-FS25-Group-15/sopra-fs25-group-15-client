"use client";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from "react";
import { Row, Col, Modal, Typography } from "antd";
import { useRouter } from "next/navigation";
import { InfoCircleOutlined, TrophyOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import LargeCardButton from "@/components/general/LargeCardButton";

const { Title, Paragraph } = Typography;

const PlayCompetitive: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const apiService = useApi();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [joinQueueModalVisible, setJoinQueueModalVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isInQueue, setIsInQueue] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [queueTime, setQueueTime] = useState(0);

  // Timer for queue waiting state.
//   useEffect(() => {
//     let timer: NodeJS.Timeout;
//     if (isInQueue) {
//       timer = setInterval(() => {
//         setQueueTime((prev) => prev + 1);
//       }, 1000);
//     } else {
//       setQueueTime(0);
//     }
//     return () => clearInterval(timer);
//   }, [isInQueue]);

  // API call to join the competitive queue.
  // Now replaced with a modal pop up indicating that the function is coming soon.
  const onJoinQueue = async () => {
    setJoinQueueModalVisible(true);
  };

  // Open modal with explanations for competitive mode.
  const openInfoModal = () => {
    setModalVisible(true);
  };

  const closeInfoModal = () => {
    setModalVisible(false);
  };

  const closeJoinQueueModal = () => {
    setJoinQueueModalVisible(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      {notification && <Notification {...notification} />}

      <Row justify="center">
        <Col xs={24} md={12} style={{ textAlign: "center", marginBottom: "1rem" }}>
          <Title level={2}>Play Competitive</Title>
        </Col>
      </Row>

      <Row justify="center">
        <Col xs={24} md={12} style={{ textAlign: "center" }}>
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
        </Col>
      </Row>

      <Row justify="center" style={{ marginTop: "1rem" }}>
        <Col xs={24} md={12} style={{ textAlign: "center" }}>
          <LargeCardButton
            label="Join Queue"
            onClick={onJoinQueue}
            disabled={isInQueue}
            icon={<TrophyOutlined style={{ fontSize: "2rem" }} />}
          />
          {isInQueue && (
            <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
              <span>Waiting in queue: {queueTime} seconds</span>
            </div>
          )}
        </Col>
      </Row>

      <Modal
        title="Competitive Mode Explained"
        open={modalVisible}
        onCancel={closeInfoModal}
        footer={null}
      >
        <Paragraph>
          In competitive mode, your ranking is updated based on your game performance.
          Wins earn you points, while losses may lower your rank. Your rank helps match you
          with opponents of similar skill. Detailed game statistics and previous results all play a role.
        </Paragraph>
      </Modal>

      <Modal
        title="Coming Soon"
        open={joinQueueModalVisible}
        onCancel={closeJoinQueueModal}
        footer={null}
      >
        <Paragraph>This functionality is coming soon. Until then you can use the casual game mode.</Paragraph>
      </Modal>
    </div>
  );
};

export default PlayCompetitive;
