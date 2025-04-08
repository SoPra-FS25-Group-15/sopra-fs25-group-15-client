"use client";

import RoundCardComponent from "@/components/game/roundCard";
import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalUser } from "@/contexts/globalUser";
import { useApi } from "@/hooks/useApi";
import { getRoundCards, RoundCardIdentifier } from "@/types/roundcard";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import "@ant-design/v5-patch-for-react-19";
import { Button, Flex, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface GameResponse {
  gameId: string;
  players: {
    userId: string;
    username: string;
    team?: string;
  }[];
  currentRound: number;
  status: string;
}

//TODO: Fetching the players cards from the server as an array of identifiers
const roundCardIdentifiers: RoundCardIdentifier[] = ["blitz", "standard", "standard", "radio", "blitz", "radio"];

const RoundCardPageComponent: React.FC = () => {
  const { gameId } = useParams() as { gameId: string };
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [game, setGame] = useState<GameResponse | null>(null);
  const [selected, setSelected] = useState<RoundCardIdentifier | null>(null);
  const [selectedState, setSelectedState] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const apiService = useApi();
  const router = useRouter();
  const { user } = useGlobalUser();

  useEffect(() => {
    if (localStorage.getItem("user") === null) {
      router.push("/login");
      return;
    }

    async function fetchGameData() {
      try {
        const response = await apiService.get<GameResponse>(`/api/games/${gameId}`);
        setGame(response);
      } catch (error) {
        if (error instanceof Error) {
          setNotification({
            type: "error",
            message: `${error.name}: ${error.message}`,
            onClose: () => setNotification(null),
          });
        } else {
          console.error("An unknown error occurred while fetching the game data.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchGameData();
  }, [gameId, apiService, user, router]);

  async function handleSubmit() {
    console.info("Submitting round card:", selected);
    if (!game) {
      setNotification({
        type: "error",
        message: "Game data is not available",
        onClose: () => setNotification(null),
      });
      return;
    }
    if (!selected) {
      setNotification({
        type: "error",
        message: "Please select a round card",
        onClose: () => setNotification(null),
      });
      return;
    }
    try {
      await apiService.post(`/games/${gameId}/round-type`, {
        userId: user?.userid,
        roundType: "standard",
      });
    } catch (error) {
      if (error instanceof Error) {
        setNotification({
          type: "error",
          message: `${error.name}: ${error.message}`,
          onClose: () => setNotification(null),
        });
      } else {
        console.error("An unknown error occurred during the submission of your round card.");
      }
    }
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    );
  }

  return (
    <Flex
      vertical
      gap={20}
      justify="space-between"
      align="center"
      style={{ width: "100%", height: "100%", padding: 30 }}
    >
      {notification && <Notification {...notification} />}
      <Flex vertical align="center" justify="center" gap={10} style={{ width: "100%" }}>
        <h1>It&apos;s your turn!</h1>
        <h2>Play one of your round cards</h2>
      </Flex>
      <section
        style={{
          scrollSnapType: "x mandatory",
          overflow: "scroll visible",
          width: "100%",
          height: "50vh",
          padding: "30px 10px",
          display: "flex",
          flexWrap: "nowrap",
          gap: 20,
        }}
      >
        {getRoundCards(roundCardIdentifiers).map((card, index) => (
          <RoundCardComponent
            style={{ scrollSnapAlign: "center" }}
            key={index}
            selected={index === selectedState}
            {...card}
            onClick={() => {
              setSelected(card.identifier);
              setSelectedState(index);
            }}
          />
        ))}
      </section>
      <Flex align="center" justify="center" style={{ width: "100%" }}>
        <Button onClick={handleSubmit} type="primary">
          Select card
        </Button>
      </Flex>
    </Flex>
  );
};

export default RoundCardPageComponent;
