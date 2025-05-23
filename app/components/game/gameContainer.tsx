"use client";

import PlayerList from "@/components/game/playerList";
import { useGlobalUser } from "@/contexts/globalUser";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import "@ant-design/v5-patch-for-react-19";
import { purple } from "@ant-design/colors";
import { Flex, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { getRoundCards, RoundCardIdentifier } from "@/types/game/roundcard";
import RoundCardComponent from "./roundCard";
import UserCard from "../general/usercard";
import { useGlobalGameState } from "@/contexts/globalGameState";

interface GameContainerProps {
  children: React.ReactNode;
  showPickedRoundCardContainer?: boolean;
}

const GameContainer: React.FC<GameContainerProps> = ({ children, showPickedRoundCardContainer = true }) => {
  const [loading, setLoading] = useState(true);

  const { user } = useGlobalUser();
  const { gameState } = useGlobalGameState();

  useEffect(() => {
    if (!user) return;
    if (!gameState) return;

    setLoading(false);
  }, [user, gameState]);

  if (loading || !gameState) {
    return (
      <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </Flex>
    );
  }

  return (
    <Flex gap={10} style={{ width: "100%", height: "100%", minHeight: 600, padding: 8 }}>
      <div style={{ width: "20vw", minWidth: "250px", height: "100%" }}>
        {gameState.players ? (
          <PlayerList players={gameState.players} />
        ) : (
          <Flex justify="center" align="center" style={{ width: "100%", height: "100%" }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          </Flex>
        )}
      </div>

      {showPickedRoundCardContainer && (
        <Flex
          vertical
          align="center"
          justify="center"
          style={{
            width: "20vw",
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
            <Flex vertical gap={40} align="center">
              <Flex vertical gap={16} style={{ width: "100%" }}>
                <Flex vertical gap={0} align="left">
                  <p style={{ textTransform: "uppercase", fontWeight: "bold", color: purple[4] }}>
                    Round {gameState.currentRound}
                  </p>
                  <h1 style={{ textTransform: "uppercase" }}>Round Card</h1>
                </Flex>
                <Flex gap={8} align="left" vertical>
                  <h3
                    style={{
                      textTransform: "uppercase",
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    played by
                  </h3>
                  <span>
                    <UserCard borderless iconsize="small" username={gameState.roundCardSubmitter}></UserCard>
                  </span>
                </Flex>
              </Flex>
              {gameState.activeRoundCard && (
                <div style={{ height: 350 }}>
                  {getRoundCards([gameState.activeRoundCard.split("-")[0] as RoundCardIdentifier]).map(
                    (card, index) => {
                      return <RoundCardComponent key={index} {...card} selected={false} onClick={() => {}} />;
                    }
                  )}
                </div>
              )}
            </Flex>
          </Flex>
        </Flex>
      )}
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
          overflow: "hidden",
        }}
      >
        {children}
      </Flex>
    </Flex>
  );
};

export default GameContainer;
