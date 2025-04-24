"use client";

import React, { useState, useEffect } from "react";
import { Row, Col, Modal, Typography, Input, message } from "antd";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import LargeCardButton from "@/components/general/LargeCardButton";
import { UserAddOutlined, LoginOutlined } from "@ant-design/icons";
import { useGlobalUser } from "@/contexts/globalUser";

const { Title, Paragraph } = Typography;

const PlayCasual: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { user } = useGlobalUser();
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [showJoinLobbyModal, setShowJoinLobbyModal] = useState(false);
  const [joinLobbyCode, setJoinLobbyCode] = useState("");
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);

  // Wait for globalUser to load from localStorage before proceeding
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (!stored) {
        router.push("/login");
        return;
      }
      if (stored && !user) {
        // still waiting for context to initialize
        return;
      }
    }
  }, [user, router]);
  
  const getAuthHeaders = () => ({
    Authorization: user?.token || "",
    "Content-Type": "application/json",
  });

  // Handler to create a lobby via the backend API.
  // On success, redirect to the lobby page with the returned lobby code.
  const handleCreateLobby = async () => {
    if (!user) {
      setNotification({ type: "error", message: "User not logged in. Please log in to create a lobby." });
      return;
    }
    
    try {
      setIsCreatingLobby(true);
      
      // Payload to create a casual lobby (e.g., unranked solo mode)
      const payload = {
        isPrivate: true,
        mode: "solo",
        maxPlayers: 8,
      };

      // Expected response should contain a lobbyCode (as per your REST API documentation)
      const response = (await apiService.post("/lobbies", payload, { headers: getAuthHeaders() })) as { lobbyCode: string };
      const lobbyCode = response.lobbyCode;
      
      if (!lobbyCode) {
        setNotification({ type: "error", message: "Lobby creation failed: no lobby code returned." });
        return;
      }
      
      router.push(`/lobbies/${lobbyCode}`);
    } catch (error: unknown) {
      console.error("Error creating lobby:", error);
      if (error instanceof Error) {
        setNotification({ type: "error", message: error.message || "Failed to create lobby." });
      } else {
        setNotification({ type: "error", message: "Failed to create lobby." });
      }
    } finally {
      setIsCreatingLobby(false);
    }
  };

  // Handler to join a lobby.
  // The user inputs a lobby code, and on confirmation we redirect to /lobbies/{lobbyCode}.
  const handleJoinLobby = () => {
    if (!joinLobbyCode || joinLobbyCode.trim() === "") {
      message.error("Please enter a valid lobby code");
      return;
    }
    
    // Redirect to the lobby page.
    // The LobbyPage will handle the STOMP join process (or use an API join endpoint) using the lobby code.
    router.push(`/lobbies/${joinLobbyCode.trim()}`);
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
            <span style={{ fontWeight: "bold", color: "#8a2be2", fontSize: "1.2rem" }}>2-8 Players</span>
            <span style={{ margin: "0 0.5rem", color: "#aaa" }}>|</span>
            <span style={{ fontWeight: "bold", color: "#8a2be2", fontSize: "1.2rem" }}>20-60 Minutes</span>
          </Paragraph>
        </Col>
      </Row>
      <Row justify="center" style={{ marginTop: "2rem" }} gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <LargeCardButton
            style={{ width: "100%", height: "150px" }}
            label="Create Lobby"
            onClick={handleCreateLobby}
            icon={<UserAddOutlined style={{ fontSize: "2rem" }} />}
            disabled={isCreatingLobby}
          />
        </Col>
        <Col xs={24} md={6}>
          <LargeCardButton
            style={{ width: "100%", height: "150px" }}
            label="Join Lobby"
            onClick={() => setShowJoinLobbyModal(true)}
            icon={<LoginOutlined style={{ fontSize: "2rem" }} />}
          />
        </Col>
      </Row>

      <Modal
        title="Join Lobby"
        open={showJoinLobbyModal}
        onOk={handleJoinLobby}
        onCancel={() => setShowJoinLobbyModal(false)}
      >
        <Paragraph>Please enter the lobby code provided by your friend:</Paragraph>
        <Input
          placeholder="Lobby Code"
          value={joinLobbyCode}
          onChange={(e) => setJoinLobbyCode(e.target.value)}
          onPressEnter={handleJoinLobby}
        />
      </Modal>
    </div>
  );
};

export default PlayCasual;