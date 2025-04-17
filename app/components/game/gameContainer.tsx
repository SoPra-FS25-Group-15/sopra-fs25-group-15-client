"use client";

import PlayerList from "@/components/game/playerList";
import { useGlobalUser } from "@/contexts/globalUser";
import { GameState } from "@/types/game/game";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import "@ant-design/v5-patch-for-react-19";
import { Flex, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getRoundCards } from "@/types/game/roundcard";
import RoundCardComponent from "./roundCard";
import UserCard from "../general/usercard";

interface GameContainerProps {
  children: React.ReactNode;
}

export const gameState: GameState = {
  currentRound: 3,
  currentScreen: "ACTIONCARD",
  roundCardSubmitter: "Player1",
  activeRoundCard: "standard",
  inventory: {
    roundCards: ["standard", "radio", "blitz"],
    actionCards: ["7choices", "badsight"],
  },
  players: [
    {
      username: "Player1",
      roundCardsLeft: 3,
      actionCardsLeft: 2,
      activeActionCards: ["7choices", "badsight"],
    },
    {
      username: "Player2",
      roundCardsLeft: 3,
      actionCardsLeft: 4,
      activeActionCards: ["7choices"],
    },
    {
      username: "Player3",
      roundCardsLeft: 2,
      actionCardsLeft: 1,
      activeActionCards: ["badsight"],
    },
  ],
};

const GameContainer: React.FC<GameContainerProps> = ({ children }) => {
  const { code } = useParams() as { code: string };
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user } = useGlobalUser();

  useEffect(() => {
    if (localStorage.getItem("user") === null) {
      router.push("/login");
      return;
    }

    // TODO: Remove and handle after fetching from websocket
    setLoading(false);
  }, [code, user, router]);

  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    );
  }

  return (
    <Flex gap={10} style={{ width: "100%", height: "100%", padding: 30 }}>
      <div style={{ width: "25vw", minWidth: "300px", height: "100%" }}>
        <PlayerList players={gameState.players} />
      </div>

      <Flex
        vertical
        align="center"
        justify="center"
        style={{
          width: "25vw",
          minWidth: "300px",
          height: "100%",
          padding: 40,
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(0, 0, 0, 0.1)",
        }}
        gap={40}
      >
        <Flex
          gap={8}
          vertical
          style={{
            width: "100%",
          }}
        >
          {gameState.currentScreen == "ACTIONCARD" ? (
            <Flex vertical gap={40} align="center">
              <Flex vertical gap={8} style={{ width: "100%" }}>
                <h1>Round {gameState.currentRound}</h1>
                <Flex gap={10} align="center">
                  <h3 style={{ textTransform: "uppercase", color: "rgba(255, 255, 255, 0.8)" }}>Played by</h3>
                  <span>
                    <UserCard borderless iconsize="small" username={gameState.roundCardSubmitter}></UserCard>
                  </span>
                </Flex>
              </Flex>
              {getRoundCards([gameState.activeRoundCard]).map((card, index) => {
                return <RoundCardComponent key={index} {...card} selected={false} onClick={() => {}} />;
              })}
            </Flex>
          ) : (
            <Flex vertical gap={80} align="center">
              <Flex vertical gap={16} align="center">
                <p style={{ lineHeight: 1.2, textAlign: "center", maxWidth: "70%", color: "rgba(255, 255, 255, 0.6)" }}>
                  Waiting for submission from
                </p>
                <span>
                  <UserCard borderless iconsize="small" username={gameState.roundCardSubmitter}></UserCard>
                </span>
              </Flex>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex
        vertical
        gap={20}
        justify="space-between"
        align="center"
        style={{
          width: "100%",
          height: "100%",
          padding: "40px 0",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.2)",
          background: "#222",
        }}
      >
        {children}
      </Flex>
    </Flex>
  );
};

export default GameContainer;
