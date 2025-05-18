"use client";

import React, { useState, useEffect } from "react";
import { Modal, Typography, Input, Flex, Spin } from "antd";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import LargeCardButton from "@/components/general/LargeCardButton";
import { UserAddOutlined, LoginOutlined, LoadingOutlined } from "@ant-design/icons";
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
  const [loading, setLoading] = useState(true);

  // Wait for globalUser to load from localStorage before proceeding
  useEffect(() => {
    if (localStorage.getItem("user") === null) {
      router.push("/login");
    }
    if (user && user.token) setLoading(false);
  }, [router, user]);

  const getAuthHeaders = () => ({
    Authorization: user?.token || "",
    "Content-Type": "application/json",
  });

  // Handler to create a lobby via the backend API.
  // On success, redirect to the lobby page with the returned lobby code.
  const handleCreateLobby = async () => {
    if (!user) {
      setNotification({
        type: "error",
        message: "You need to be signed in to create a lobby",
        onClose: () => setNotification(null),
      });
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
      const response = (await apiService.post("/lobbies", payload, { headers: getAuthHeaders() })) as {
        lobbyCode: string;
      };
      const lobbyCode = response.lobbyCode;

      if (!lobbyCode) {
        setNotification({
          type: "error",
          message: "An error occured while creating the lobby: The server did not return a lobby code",
          onClose: () => setNotification(null),
        });
        return;
      }

      router.push(`/lobbies/${lobbyCode}`);
    } catch (error: unknown) {
      console.error("An error occured while creating the lobby:", error);
      setNotification({
        type: "error",
        message: "An error occured while creating the lobby. Check the console for details",
        onClose: () => setNotification(null),
      });
    } finally {
      setIsCreatingLobby(false);
    }
  };

  // Handler to join a lobby.
  // The user inputs a lobby code, and on confirmation we redirect to /lobbies/{lobbyCode}.
  const handleJoinLobby = () => {
    if (!joinLobbyCode || joinLobbyCode.trim() === "") {
      setNotification({
        type: "error",
        message: "The lobby code cannot be empty",
        onClose: () => setNotification(null),
      });
      return;
    }

    // Redirect to the lobby page.
    // The LobbyPage will handle the STOMP join process (or use an API join endpoint) using the lobby code.
    router.push(`/lobbies/${joinLobbyCode.trim()}`);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    );
  }

  return (
    <Flex vertical justify="center" align="center" gap={40} style={{ width: "100%", height: "100%", padding: 40 }}>
      {notification && <Notification {...notification} />}
      <Flex vertical justify="center" align="center" style={{ width: "100%", textAlign: "center" }}>
        <Title level={2}>Play a Game</Title>
        <Paragraph>Host a game and invite your friends. Or join an existing game with a code.</Paragraph>
        <Flex gap={12}>
          <span style={{ fontWeight: "bold", color: "#8a2be2", fontSize: "1.2rem" }}>2-8 Players</span>
          <span style={{ color: "#aaa", fontSize: "1rem" }}>|</span>
          <span style={{ fontWeight: "bold", color: "#8a2be2", fontSize: "1.2rem" }}>20-60 Minutes</span>
        </Flex>
      </Flex>
      <Flex wrap justify="center" align="center" gap={16} style={{ width: "100%", maxWidth: 800 }}>
        <LargeCardButton
          style={{ flexGrow: 1, flexBasis: 330, height: "150px" }}
          label="Create Lobby"
          onClick={handleCreateLobby}
          icon={<UserAddOutlined style={{ fontSize: "2rem" }} />}
          disabled={isCreatingLobby}
        />
        <LargeCardButton
          style={{ flexGrow: 1, flexBasis: 330, height: "150px" }}
          label="Join Lobby"
          onClick={() => setShowJoinLobbyModal(true)}
          icon={<LoginOutlined style={{ fontSize: "2rem" }} />}
        />
      </Flex>

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
    </Flex>
  );
};

export default PlayCasual;
