import { getActionCards } from "@/types/game/actioncard";
import { Player } from "@/types/game/game";
import { Flex } from "antd";
import React from "react";
import UserCard from "../general/usercard";
import { MiniActionCardComponent } from "./actionCard";

interface PlayerListProps {
  players: Player[];
}

const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  return (
    <Flex vertical gap={16}>
      {players.map((player, index) => (
        <Flex
          vertical
          key={index}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            borderRadius: 9,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ boxShadow: "0 5px 10px rgba(0, 0, 0, 0.2)" }}>
            <UserCard username={player.username} subviewBottom={`${player.roundCardsLeft} Round Cards left`} />
          </div>
          <Flex gap={8} wrap="wrap" justify="center" style={{ padding: 8 }}>
            {getActionCards(player.activeActionCards).map((actionCard, index) => {
              return (
                <MiniActionCardComponent
                  key={index}
                  title={actionCard.title}
                  description={actionCard.description}
                  type={actionCard.type}
                />
              );
            })}
          </Flex>
        </Flex>
      ))}
    </Flex>
  );
};

export default PlayerList;
