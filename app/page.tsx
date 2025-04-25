"use client";

import { green, purple, red } from "@ant-design/colors";
import { ArrowRightOutlined, PlusOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Collapse, Flex } from "antd";
import Link from "next/link";
import React, { FC } from "react";
import NavigationLayout from "./(withNavigation)/layout";

const box: React.CSSProperties = {
  height: "calc(100vh - (2 * 96px) - 120px)",
  overflow: "hidden",
  position: "relative",
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-end",
  justifyContent: "flex-start",
  fontWeight: 600,
  padding: 48,
  borderRadius: 32,
  color: "#fff",
  backgroundColor: "#000",
};

const section: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const h2: React.CSSProperties = {
  fontSize: "clamp(28px, 5.8vw, 60px)",
  lineHeight: 1,
};

const p: React.CSSProperties = {
  fontSize: "clamp(16px, 2.5vw, 30px)",
  color: "#888",
};

const items = [
  {
    key: "1",
    label: "What is ActionGuessr?",
    children: (
      <p>
        ActionGuessr is a turn-based game based on the hit game GeoGuessr, where you guess your the location solely
        based of a Google Street view image or other clues. Mark your guess on the world map and see who out of your
        friends had the best one!
      </p>
    ),
  },
  {
    key: "2",
    label: "What is different from GeoGuessr?",
    children: (
      <p>
        With the addition of Round Cards, a player can modify the rules of their round to try to have the best shot at
        winning and discarding their card. Powerup and Punishment Cards either help you with your guess or can prevent
        an opponent from winning your round. Use them strategically to win the most rounds!
      </p>
    ),
  },
  {
    key: "3",
    label: "How do I play?",
    children: (
      <p>
        If you have an account, you can create a lobby. Then simply invite your friends from the friends list. Not
        friends with a player? They can still join your lobby with an invite code.
      </p>
    ),
  },
];

const Home: FC = () => {
  return (
    <NavigationLayout>
      <Flex vertical align="center" gap={120}>
        <section style={section}>
          <Flex
            vertical
            align="center"
            justify="center"
            style={{
              textAlign: "center",
              marginTop: "120px",
              width: "100%",
              height: "calc(100vh - (2 * 96px) - 120px)",
            }}
          >
            <h1 style={{ fontSize: "clamp(32px, 12vw, 160px)" }}>ActionGuessr</h1>
            <Flex vertical style={{ fontSize: "clamp(16px, 4vw, 80px)" }}>
              <span style={{ whiteSpace: "nowrap" }}>Find out where you are on the world. Now</span>
              <span style={{ whiteSpace: "nowrap" }}>as a turn based game with friends.</span>
            </Flex>
            <Button type="primary" size="large" style={{ marginTop: 64 }} href="/game">
              Sign up now
            </Button>
          </Flex>
        </section>
        <section style={section}>
          <div style={{ display: "grid", gridTemplateColumns: "1", gap: 16 }}>
            <div style={{ ...box, gridColumn: "1 / -1" }}>
              <Flex vertical gap={16} style={{ width: "35%" }}>
                <h2 style={h2}>Determine the rules</h2>
                <p style={p}>
                  On your turn, play one of your <span style={{ color: purple[3] }}>Round Cards</span>. If you win the
                  round, discard it. The first player to discard all of their round cards wins.
                </p>
              </Flex>
              <div
                style={{
                  position: "absolute",
                  top: "-50%",
                  right: "-10%",
                  background: "no-repeat center / contain url('/round-card-render.webp')",
                  height: "200%",
                  width: "70%",
                }}
              ></div>
            </div>
            <div style={box}>
              <Flex vertical gap={16} style={{ width: "35%" }}>
                <h2 style={h2}>Power up</h2>
                <p style={p}>
                  <span style={{ color: green[3] }}>Powerup Cards</span> give yourself an advantage for this round, like
                  extra time or more guesses. Will it be enough to secure the round win?
                </p>
              </Flex>
            </div>
            <div style={box}>
              <Flex vertical gap={16} style={{ width: "35%" }}>
                <h2 style={h2}>Sabotage your friends</h2>
                <p style={p}>
                  <span style={{ color: red[3] }}>Punishment Cards</span> hinder one specific opponent. Will it be
                  enough to stop them from winning the round?
                </p>
              </Flex>
            </div>
          </div>
          <Flex vertical align="center" justify="center" style={{ marginTop: 32 }}>
            <Link href={"/rules"}>
              <Button iconPosition="end" icon={<ArrowRightOutlined />} type="link" size="large">
                See the full game rules
              </Button>
            </Link>
          </Flex>
        </section>
        <section style={section}>
          <h2 style={{ textAlign: "center", fontSize: 32, marginBottom: 32 }}>Frequently Asked Questions</h2>
          <Collapse
            items={items}
            expandIcon={({ isActive }) => <PlusOutlined rotate={isActive ? 45 : 0} />}
            style={{ fontSize: 18, width: "100%" }}
          />
        </section>
      </Flex>
      <footer style={{ marginTop: 120, padding: 32, textAlign: "center", backgroundColor: "#222" }}>
        <Flex vertical align="center" justify="center" gap={8} style={{ fontWeight: 600 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: "rgba(255, 255, 255, 0.8)" }}>ActionGuessr</span>
          <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Made by Group 15 of Sopra FS25</span>
        </Flex>
      </footer>
    </NavigationLayout>
  );
};

export default Home;
