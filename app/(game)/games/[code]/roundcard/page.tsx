"use client";

import GameContainer, { gameState } from "@/components/game/gameContainer";
import RoundCardComponent from "@/components/game/roundCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalUser } from "@/contexts/globalUser";
import { GameState } from "@/types/game/game";
import { getRoundCards, RoundCardIdentifier } from "@/types/game/roundcard";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import "@ant-design/v5-patch-for-react-19";
import { Button, Flex, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const RoundCardPageComponent: React.FC = () => {
  const { code } = useParams() as { code: string };
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedId, setSelectedId] = useState<RoundCardIdentifier | null>(null);
  const [selectedState, setSelectedState] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user } = useGlobalUser();

  useEffect(() => {
    // 1) Redirect if truly no user in localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (!stored) {
        router.push("/login");
        return;
      }
      // 2) Wait until context has loaded the stored user
      if (stored && !user) {
        return;
      }
    }

    // Safe to initialize once user is loaded
    setGame(gameState);
    setSelectedId(gameState.inventory.roundCards[0]);
    setLoading(false);
  }, [code, user, router]);

  async function handleSubmit() {
    console.info("Submitting round card:", selectedId);

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
    if (!selectedId) {
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
          <h1>It&apos;s on you to set the rules</h1>
          <h2>Play one of your round cards</h2>
        </Flex>
        <section
          style={{
            scrollSnapType: "x mandatory",
            overflow: "scroll visible",
            maxWidth: "100%",
            height: "50vh",
            padding: "30px 10px",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "nowrap",
            gap: 20,
          }}
        >
          {getRoundCards(game.inventory.roundCards).map((card, index) => (
            <RoundCardComponent
              key={index}
              selected={index === selectedState}
              {...card}
              onClick={() => {
                setSelectedId(card.identifier);
                setSelectedState(index);
              }}
            />
          ))}
        </section>
        <Flex align="center" justify="center" style={{ width: "100%" }}>
          <Button onClick={handleSubmit} type="primary" size="large">
            Select card
          </Button>
        </Flex>
      </GameContainer>
    );
  }

  return null;
};

export default RoundCardPageComponent;
