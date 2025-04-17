"use client";

import ActionCardComponent from "@/components/game/actionCard";
import GameContainer, { gameState } from "@/components/game/gameContainer";
import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalUser } from "@/contexts/globalUser";
import { ActionCard, getActionCards } from "@/types/game/actioncard";
import { GameState } from "@/types/game/game";
import { LoadingOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Flex, SelectProps, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { green } from "@ant-design/colors";

const RoundCardPageComponent: React.FC = () => {
  const { code } = useParams() as { code: string };
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<ActionCard | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user } = useGlobalUser();

  useEffect(() => {
    if (localStorage.getItem("user") === null) {
      router.push("/login");
      return;
    }

    setGame(gameState);
    setSelectedCard(getActionCards(gameState.inventory.actionCards)[0]);

    //TODO: Remove and handle after fetching from websocket
    setLoading(false);
  }, [code, user, router]);

  async function handleSubmit() {
    if (!selectedCard) {
      setNotification({
        type: "error",
        message: "Please select a round card",
        onClose: () => setNotification(null),
      });
      return;
    }

    if (selectedCard.type === "punishment" && !selectedUsername) {
      setNotification({
        type: "error",
        message: "Please select a player to punish",
        onClose: () => setNotification(null),
      });
      return;
    }

    console.info("Submitting action card:", selectedCard.identifier);
    console.info("Selected username:", selectedUsername);

    if (!user) {
      setNotification({
        type: "error",
        message: "User data is not available",
        onClose: () => setNotification(null),
      });
      return;
    }
    if (!game) {
      setNotification({
        type: "error",
        message: "Game data is not available",
        onClose: () => setNotification(null),
      });
      return;
    }
  }

  async function handleSkip() {
    console.info("Skipping");

    if (!user) {
      setNotification({
        type: "error",
        message: "User data is not available",
        onClose: () => setNotification(null),
      });
      return;
    }
    if (!game) {
      setNotification({
        type: "error",
        message: "Game data is not available",
        onClose: () => setNotification(null),
      });
      return;
    }
    if (!selectedCard) {
      setNotification({
        type: "error",
        message: "Please select a round card",
        onClose: () => setNotification(null),
      });
      return;
    }
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    );
  }

  if (game) {
    return (
      <GameContainer>
        {notification && <Notification {...notification} />}
        <Flex vertical align="center" justify="center" gap={10} style={{ width: "100%" }}>
          <h1>Choose an action card</h1>
          <h2>Or skip to keep them for later</h2>
        </Flex>
        <Flex vertical align="center" justify="center" gap={10} style={{ width: "100%" }}>
          <section
            style={{
              scrollSnapAlign: "center",
              scrollSnapType: "x mandatory",
              overflow: "scroll visible",
              maxWidth: "100%",
              height: "40vh",
              padding: "30px 10px",
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "nowrap",
              gap: 20,
            }}
          >
            {getActionCards(game.inventory.actionCards).map((card, index) => (
              <ActionCardComponent
                playerList={
                  game.players.map((player) => ({
                    label: player.username,
                    value: player.username,
                  })) as SelectProps["options"]
                }
                key={index}
                selected={index === selectedState}
                {...card}
                onClick={() => {
                  setSelectedCard({
                    identifier: card.identifier,
                    type: card.type,
                    title: card.title,
                    description: card.description,
                  } as ActionCard);
                  setSelectedState(index);
                }}
                onChange={(username: string) => {
                  setSelectedUsername(username);
                }}
              />
            ))}
          </section>
          <Flex
            align="center"
            justify="center"
            gap={4}
            style={{
              padding: "8px 16px",
              borderRadius: 4,
              background: "#333",
              color: "#fff",
              lineHeight: 1,
              fontWeight: 600,
              fontSize: 16,
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <span style={{ fontSize: 28, color: green[5] }}>{game.inventory.actionCards.length}</span>
            <span style={{ paddingBottom: 1, fontSize: 13, color: "rgba(255, 255, 255, 0.5)" }}>/</span>
            <span>5</span>
          </Flex>
        </Flex>
        <Flex align="center" justify="center" gap={8} style={{ width: "100%" }}>
          <Button onClick={handleSubmit} type="primary" size="large">
            Select card
          </Button>
          <Button onClick={handleSkip} type="default" size="large">
            Skip
          </Button>
        </Flex>
      </GameContainer>
    );
  }
};

export default RoundCardPageComponent;
