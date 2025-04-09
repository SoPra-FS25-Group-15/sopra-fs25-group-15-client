"use client";

import React, { useState, useEffect } from "react";
import { Row, Col, Modal, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import LargeCardButton from "@/components/general/LargeCardButton";
import { UserAddOutlined, LoginOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const PlayCasual: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [showJoinGameModal, setShowJoinGameModal] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState<boolean>(true);

  // Retrieve token from localStorage on mount.
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

  // Handler: call backend API to create a lobby and reroute to /lobbies/{lobbyCode}
  const handleCreateLobby = async () => {
    if (loadingToken) {
      setNotification({ type: "error", message: "Loading token, please try again." });
      return;
    }
    try {
      // Payload to create a casual lobby (unranked solo mode)
      const payload = {
        isPrivate: true,
        mode: "solo",
        maxPlayers: 8,
      };

      // Define the expected response type (note: using lobbyCode, not lobbyId)
      interface LobbyResponse {
        lobbyCode: string;
      }

      const headers = getAuthHeaders();

      // Make POST request with auth headers.
      const response = (await apiService.post("/lobbies", payload, { headers })) as LobbyResponse;
      const lobbyCode = response.lobbyCode;
      if (!lobbyCode) {
        setNotification({ type: "error", message: "Lobby creation failed: no lobby code returned." });
        return;
      }
      // Redirect to the lobby page using the lobby code
      router.push(`/lobbies/${lobbyCode}`);
    } catch (error: unknown) {
      console.error("Error creating lobby:", error);
      if (error instanceof Error) {
        setNotification({ type: "error", message: error.message || "Failed to create lobby." });
      } else {
        setNotification({ type: "error", message: "Failed to create lobby." });
      }
    }
  };

  const handleJoinGame = () => {
    setShowJoinGameModal(true);
  };

  const closeJoinGameModal = () => {
    setShowJoinGameModal(false);
  };

  // Define a common style for both buttons to ensure equal size.
  const buttonStyle = { width: "100%", height: "150px" };

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
            <span style={{ fontWeight: "bold", color: "#8a2be2", fontSize: "1.2rem" }}>
              2-8 Players
            </span>
            <span style={{ margin: "0 0.5rem", color: "#aaa" }}>|</span>
            <span style={{ fontWeight: "bold", color: "#8a2be2", fontSize: "1.2rem" }}>
              20-60 Minutes
            </span>
          </Paragraph>
        </Col>
      </Row>
      <Row justify="center" style={{ marginTop: "2rem" }} gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <LargeCardButton
            style={buttonStyle}
            label="Create Lobby"
            onClick={handleCreateLobby}
            icon={<UserAddOutlined style={{ fontSize: "2rem" }} />}
          />
        </Col>
        <Col xs={24} md={6}>
          <LargeCardButton
            style={buttonStyle}
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
