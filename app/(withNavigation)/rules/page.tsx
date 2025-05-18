"use client";

import { Card, Typography, Table } from "antd";
import React from "react";
import { purple, yellow, red, green } from "@ant-design/colors";

const { Title, Paragraph, Text } = Typography;

interface RoundCard {
  cardName: string;
  description: string;
  modifiers: string;
}

interface ActionCard {
  cardName: string;
  effect: string;
}

const Rules: React.FC = () => {
  const roundCards: RoundCard[] = [
    {
      cardName: "World",
      description: "The round includes the full available coverage",
      modifiers: "Type of guess: Precise, Street View: Standard, Round time: 60s",
    },
    {
      cardName: "Flash",
      description: "The round includes the full available coverage, but the round time is halved",
      modifiers: "Type of guess: Precise, Street View: Standard, Round time: 30s",
    },
  ];

  const powerupCards: ActionCard[] = [
    {
      cardName: "7 Choices",
      effect: "Reveal the continent of the target location.",
    },
  ];

  const punishmentCards: ActionCard[] = [
    {
      cardName: "Bad sight",
      effect: "A player of your choice has their screen blurred for the first 15 seconds of the round.",
    },
  ];

  const columnsRoundCards = [
    { title: "Card Name", dataIndex: "cardName", key: "cardName" },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Modifiers", dataIndex: "modifiers", key: "modifiers" },
  ];

  const columnsActionCards = [
    { title: "Card Name", dataIndex: "cardName", key: "cardName" },
    { title: "Effect", dataIndex: "effect", key: "effect" },
  ];

  return (
    <Card>
      <Typography>
        <Title level={1}>Game Rules</Title>
        <Title level={4}>Objective</Title>
        <Paragraph>
          The first player to successfully discard all of their <span style={{ color: purple[3] }}>Round Cards</span>{" "}
          wins the game.
        </Paragraph>

        <Title level={4}>Preparation</Title>
        <Paragraph>
          Each player starts with 2 <span style={{ color: purple[3] }}>Round Cards</span> and no{" "}
          <span style={{ color: yellow[2] }}>Action Cards</span>.
        </Paragraph>

        <Title level={4}>Game Flow</Title>
        <Paragraph>Each round consists of the following steps:</Paragraph>
        <ul style={{ listStyleType: "number" }}>
          <li>
            <Text strong>
              Playing a <span style={{ color: purple[3] }}>Round Card</span>:
            </Text>
            <Paragraph>
              The winner of the previous round plays one of their <span style={{ color: purple[3] }}>Round Cards</span>,
              listed on the table below. In the first round, a starting player is chosen randomly.
            </Paragraph>
          </li>
          <li>
            <Text strong>
              Playing an <span style={{ color: yellow[2] }}>Action Card</span>:
            </Text>
            <Paragraph>
              Each player may play one <span style={{ color: yellow[2] }}>Action Card</span> per round.{" "}
              <span style={{ color: yellow[2] }}>Action Cards</span> have various effects that can help the player or
              disrupt opponents. For details, refer to the tables below.
            </Paragraph>
          </li>
          <li>
            <Text strong>Playing the Guessing Round:</Text>
            <Paragraph>
              The winner of the round is determined based on who guessed the closest to the target location. The winner
              will have the advantage of playing one of their <span style={{ color: purple[3] }}>Round Cards</span> in
              the next round.
            </Paragraph>
          </li>
          <li>
            <Text strong>
              Drawing New <span style={{ color: yellow[2] }}>Action Cards</span>:
            </Text>
            <Paragraph>
              At the end of the round, all players draw one <span style={{ color: yellow[2] }}>Action Card</span> from
              the deck.
            </Paragraph>
          </li>
          <li>
            <Text strong>Next Round Begins:</Text>
            <Paragraph>
              The game continues with another round until one player wins by playing their last{" "}
              <span style={{ color: purple[3] }}>Round Card</span>.
            </Paragraph>
          </li>
        </ul>

        <Title level={4}>Card Types</Title>
        <Title level={5} style={{ color: purple[3] }}>
          Round Cards
        </Title>
        <Paragraph>
          <Text strong>Round Cards</Text> are the main cards used in the game. They determine the type of guess and
          modifiers for each round.
        </Paragraph>
        <Table
          columns={columnsRoundCards}
          dataSource={roundCards}
          pagination={false}
          rowKey="cardName"
          style={{ marginBottom: 20 }}
        />

        <Title level={5} style={{ color: yellow[2] }}>
          Action Cards
        </Title>
        <Paragraph>
          <Text strong>Action Cards</Text> are special cards that can be played during a round. They have various
          effects that can help the player or disrupt opponents. The two types of <Text strong>Action Cards</Text> are
          Powerup and Punishment Cards.
        </Paragraph>
        <Paragraph>
          <Text style={{ color: green[3] }} strong>
            Powerup Cards
          </Text>
        </Paragraph>
        <Table
          columns={columnsActionCards}
          dataSource={powerupCards}
          pagination={false}
          rowKey="cardName"
          style={{ marginBottom: 20 }}
        />

        <Paragraph>
          <Text style={{ color: red[3] }} strong>
            Punishment Cards
          </Text>
        </Paragraph>
        <Table columns={columnsActionCards} dataSource={punishmentCards} pagination={false} rowKey="cardName" />
      </Typography>
    </Card>
  );
};

export default Rules;
