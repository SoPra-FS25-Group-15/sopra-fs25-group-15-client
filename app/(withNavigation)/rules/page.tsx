"use client";

import { Card, Typography, Table } from "antd";
import React from "react";

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
    {
      cardName: "Radio",
      description:
        "The round includes the full available coverage of countries, but instead of a street view image, a local radio station is played",
      modifiers: "Type of guess: Country, Street View: Not shown, Round time: 60s",
    },
    {
      cardName: "No Move",
      description:
        "The round includes the full available coverage, but the player cannot move. Looking around and zooming is still possible",
      modifiers: "Type of guess: Precise, Street View: No Move, Round time: 60s",
    },
    {
      cardName: "No Move, Pan, Zoom",
      description:
        "The round includes the full available coverage, but the player cannot move, cannot look around and cannot zoom in",
      modifiers: "Type of guess: Precise, Street View: NMPZ, Round time: 60s",
    },
    {
      cardName: "Hangover",
      description:
        "The round includes the full available coverage, but the street view image is slightly blurred/distorted",
      modifiers: "Type of guess: Precise, Street View: Slightly blurred, Round time: 60s",
    },
    {
      cardName: "Lost in Transmission",
      description:
        "The round includes the full available coverage, but the map to lock in your guess has no labels for countries, cities and streets",
      modifiers: "Type of guess: Precise, Street View: Standard, Map: No Labels, Round time: 60s",
    },
    {
      cardName: "Double",
      description:
        "The round includes the full available coverage, but the player has two guesses. The better one counts.",
      modifiers: "Type of guess: 2x Precise, Street View: Standard, Round time: 60s",
    },
  ];

  const powerupCards: ActionCard[] = [
    {
      cardName: "7 Choices",
      effect: "Reveal the continent of the target location.",
    },
    {
      cardName: "High hopes",
      effect: "Reveal the height in meters above sea level of the location.",
    },
    {
      cardName: "Temperature",
      effect: "Reveal the average winter and summer temperature at the location.",
    },
    {
      cardName: "Draw again",
      effect: "Discard 2 powerup cards (this card included) and draw a powerup card of your choice.",
    },
    {
      cardName: "Swap",
      effect: "Switch this card with the powerup card of another player.",
    },
    {
      cardName: "Clear Vision",
      effect: "Keep your screen unblurred for the whole round.",
    },
    {
      cardName: "Cheat Code",
      effect: "Your distance from the target location is halved for scoring.",
    },
    {
      cardName: "One More",
      effect: "Have an additional guess this round.",
    },
    {
      cardName: "Time is ticking",
      effect: "Add 15 seconds to your timer.",
    },
    {
      cardName: "Study time",
      effect: "Reveals the distance from the UZH Building to your target location.",
    },
  ];

  const punishmentCards: ActionCard[] = [
    {
      cardName: "+1",
      effect: "A player of your choice needs to pick up one round card at the beginning of the next round.",
    },
    {
      cardName: "No Action",
      effect: "A player of your choice does not receive an action card at the beginning of the next round.",
    },
    {
      cardName: "No Labels",
      effect:
        "A player of your choice plays this round with a map that has no labels for countries, cities and streets.",
    },
    {
      cardName: "Trashcan",
      effect: "A player of your choice has to discard an action card of their choice, if they have any.",
    },
    {
      cardName: "Bad sight",
      effect: "A player of your choice has their screen blurred for the first 15 seconds of the round.",
    },
    {
      cardName: "Rooted",
      effect: "A player of your choice cannot move around for the first 15 seconds of the round.",
    },
    {
      cardName: "Bad guess",
      effect: "A player of your choice has their distance from the target location doubled for scoring.",
    },
    {
      cardName: "Restricted",
      effect: "A player of your choice has a maximum of 1 guess this round under any circumstance.",
    },
    {
      cardName: "Time runs out",
      effect: "A player of your choice has 15 seconds removed from their timer.",
    },
    {
      cardName: "No help",
      effect: "A player of your choice cannot play any action cards this round.",
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
    <Card title="Game Rules">
      <Typography>
        <Title level={2}>Objective</Title>
        <Paragraph>The first player to successfully play all of their Round Cards wins the game.</Paragraph>

        <Title level={2}>Preparation</Title>
        <Paragraph>
          Each player starts with 3, 5 or 7 randomly assigned action cards, depending on how long the game should go.
        </Paragraph>

        <Title level={2}>Game Flow</Title>
        <Paragraph>Each round consists of the following steps:</Paragraph>
        <ul>
          <li>
            <Text strong>Playing a Round Card:</Text> The winner of the previous round plays one of their Round Cards,
            listed on the table below. In the first round, a starting player is chosen randomly.
          </li>
          <li>
            <Text strong>Playing an Action Card:</Text> Each player may play one Action Card per round. Action Cards
            have various effects that can help the player or disrupt opponents. For details, refer to the tables below.
            Players can only hold up to 5 Action Cards in their hand at any time. If they have 5, they must discard one
            before drawing a new card.
          </li>
          <li>
            <Text strong>Playing the Guessing Round:</Text> The winner of the round is determined based on who guessed
            the closest to the target location. The winner will have the advantage of playing one of their Round Cards
            in the next round.
          </li>
          <li>
            <Text strong>Drawing New Action Cards:</Text> At the end of the round, all players draw one Action Card from
            the deck.
          </li>
          <li>
            <Text strong>Next Round Begins:</Text> The game continues with another round until one player wins by
            playing their last action card.
          </li>
        </ul>

        <Title level={2}>Card Types</Title>
        <Paragraph>
          <Text strong>Round Cards</Text> determine the rules of the round played.
        </Paragraph>

        <Paragraph>
          <Text strong>Round Cards Table</Text>
        </Paragraph>
        <Table
          columns={columnsRoundCards}
          dataSource={roundCards}
          pagination={false}
          rowKey="cardName"
          style={{ marginBottom: 20 }}
        />

        <Paragraph>
          <Text strong>Action Cards (Powerup Cards)</Text>
        </Paragraph>
        <Table
          columns={columnsActionCards}
          dataSource={powerupCards}
          pagination={false}
          rowKey="cardName"
          style={{ marginBottom: 20 }}
        />

        <Paragraph>
          <Text strong>Punishment Cards</Text>
        </Paragraph>
        <Table columns={columnsActionCards} dataSource={punishmentCards} pagination={false} rowKey="cardName" />
      </Typography>
    </Card>
  );
};

export default Rules;
