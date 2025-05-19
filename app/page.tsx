"use client";

import { ArrowRightOutlined, CompassOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Card, Collapse, Flex } from "antd";
import Link from "next/link";
import React, { FC } from "react";
import NavigationLayout from "./(withNavigation)/layout";
import { purple, green, red, yellow } from "@ant-design/colors";
import RoundCardComponent from "./components/game/roundCard";
import ActionCardComponent from "./components/game/actionCard";

const section: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const items = [
  {
    key: "1",
    label: "What is ActionGuessr?",
    children: (
      <p>
        ActionGuessr is a turn-based game based on the hit game GeoGuessr, where you guess your the location solely
        based of a Google Street view image. Mark your guess on the world map and see who out of your friends had the
        best one!
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
      <p>If you have an account, you can create a lobby. Then simply invite your friends via the invite code.</p>
    ),
  },
];

const Home: FC = () => {
  return (
    <NavigationLayout>
      <Flex vertical align="center" gap={16}>
        <section style={section}>
          <Flex
            vertical
            align="center"
            justify="center"
            style={{
              textAlign: "center",
              width: "100%",
              height: "100%",
              aspectRatio: "16 / 9",
              minWidth: 600,
              minHeight: 300,
              maxHeight: "80vh",
              padding: "32px",
              borderRadius: 16,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundImage: `radial-gradient(circle farthest-corner at 50% 0%, ${purple[9]}, #000)`,
            }}
          >
            <Flex>
              <h1
                style={{
                  letterSpacing: "-3px",
                  textShadow: "0 2px 12px rgba(255, 255, 255, 0.5), 0 0px 32px rgba(255, 255, 255, 0.2)",
                  WebkitTextStroke: "0.5px rgba(0, 0, 0, 0.5)",
                  fontSize: "clamp(58px, 12vw, 160px)",
                  fontWeight: 500,
                }}
              >
                Action
              </h1>
              <h1
                style={{
                  textShadow: "0 2px 12px rgba(255, 255, 255, 0.5), 0 0px 32px rgba(255, 255, 255, 0.2)",
                  WebkitTextStroke: "0.5px rgba(0, 0, 0, 0.2)",
                  fontSize: "clamp(58px, 12vw, 160px)",
                }}
              >
                Guessr
              </h1>
            </Flex>
            <Flex vertical style={{ fontSize: "clamp(18px, 3vw, 42px)" }}>
              <span style={{ whiteSpace: "nowrap" }}>Find out where you are on the world. Now</span>
              <span style={{ whiteSpace: "nowrap" }}>as a turn based game with friends.</span>
            </Flex>
            <Button type="primary" size="large" style={{ flexShrink: 0, marginTop: 64 }} href="/register">
              Sign up now
            </Button>
          </Flex>
        </section>
        <section style={section}>
          <div style={{ display: "grid", gridTemplateColumns: "1", gap: 16 }}>
            <FeatureCard
              title="Round Cards"
              description="On your turn, play one of your Round Cards. If you win the round, discard it. The first player to discard all of their Round Cards wins."
              scale={1.1}
              componentShowcase={
                <Flex>
                  <div style={{ zIndex: 9, height: 350, transform: "translateX(-40px) translateY(15%)" }}>
                    <RoundCardComponent
                      identifier={"world"}
                      icon={CompassOutlined}
                      title={"World"}
                      description={"A standard round with no restrictions."}
                      modifiers={{ time: 60, guesses: 1, streetview: "None", map: "None" }}
                      themeColor={purple}
                    />
                  </div>

                  <div
                    style={{
                      zIndex: 10,
                      height: 350,
                      transform: "translateX(-50%)",
                      boxShadow: "-10px 10px 50px rgb(0, 0, 0, 0.7)",
                    }}
                  >
                    <RoundCardComponent
                      identifier={"flash"}
                      icon={ThunderboltOutlined}
                      title={"Flash"}
                      description={"A standard round with half the time."}
                      modifiers={{ time: 60, guesses: 1, streetview: "None", map: "None" }}
                      themeColor={yellow}
                    />
                  </div>
                </Flex>
              }
            />
            <FeatureCard
              title="Powerup Cards"
              description="Powerup Cards give yourself an advantage for this round, like revealing the continent of the location. Will it be enough to secure the round win?"
              scale={1.25}
              componentShowcase={
                <ActionCardComponent
                  selected={true}
                  identifier={"7choices"}
                  type={"powerup"}
                  title={"7 Choices"}
                  playerList={[]}
                  description={"Reveal the continent of the target location."}
                  onChange={() => {}}
                />
              }
            />
            <FeatureCard
              title="Punishment Cards"
              description="Punishment Cards hinder one specific opponent. Will it be enough to stop them from winning the round?"
              scale={1.25}
              componentShowcase={
                <ActionCardComponent
                  selected={true}
                  identifier={"badsight"}
                  type={"punishment"}
                  title={"Bad Sight"}
                  description={
                    "A player of your choice has their screen blurred for the first 15 seconds of the round."
                  }
                  playerList={[
                    { label: "George", value: "p1" },
                    { label: "Celine", value: "p2" },
                    { label: "Venn", value: "p3" },
                  ]}
                  onChange={() => {}}
                />
              }
            />
          </div>
          <Flex vertical align="center" justify="center" style={{ marginTop: 32 }}>
            <Link href={"/rules"}>
              <Button iconPosition="end" icon={<ArrowRightOutlined />} type="link" size="large">
                See the full game rules
              </Button>
            </Link>
          </Flex>
        </section>
        <section style={{ ...section, marginTop: 120, padding: "0 32px" }}>
          <h2 style={{ textAlign: "center", fontSize: 32, marginBottom: 32 }}>Frequently Asked Questions</h2>
          <Collapse
            items={items}
            expandIcon={({ isActive }) => <PlusOutlined rotate={isActive ? 45 : 0} />}
            style={{ fontSize: 18, width: "100%" }}
          />
        </section>
      </Flex>
      <footer style={{ marginTop: 120, padding: 32, textAlign: "center" }}>
        <Card>
          <Flex vertical align="center" justify="center" gap={8} style={{ fontWeight: 600 }}>
            <Flex style={{ fontSize: 24, color: "#fff" }}>
              <span style={{ fontWeight: "500" }}>Action</span>
              <span style={{ fontWeight: "800" }}>Guessr</span>
            </Flex>
            <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Made by Group 15 of Sopra FS25</span>
          </Flex>
        </Card>
      </footer>
    </NavigationLayout>
  );
};

export default Home;

interface FeatureCardProps {
  title: string;
  description: string;
  componentShowcase: React.ReactNode;
  scale?: number;
  translateY?: string;
}

const HIGHLIGHTS: Record<string, string> = {
  "Round Cards": purple[3],
  "Powerup Cards": green[3],
  "Punishment Cards": red[3],
};

function highlightText(text: string) {
  const keys = Object.keys(HIGHLIGHTS).join("|");
  const re = new RegExp(`(${keys})`, "g");
  const parts = text.split(re);
  return parts.map((part, i) =>
    HIGHLIGHTS[part] ? (
      <span key={i} style={{ color: HIGHLIGHTS[part] }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

const FeatureCard: FC<FeatureCardProps> = ({ title, description, componentShowcase, scale = 1, translateY = 0 }) => (
  <Flex
    justify="space-between"
    align="center"
    gap={16}
    style={{
      height: 350,
      overflow: "hidden",
      position: "relative",
      fontWeight: 600,
      padding: 48,
      borderRadius: 16,
      color: "#fff",
      backgroundColor: "#000",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    }}
  >
    <Flex vertical gap={16} style={{ width: "60%", flexShrink: 0 }}>
      <h2 style={{ fontSize: "clamp(28px, 5.8vw, 60px)", lineHeight: 1 }}>{title}</h2>
      <p style={{ fontSize: "clamp(18px, 2.5vw, 30px)", color: "#888" }}>{highlightText(description)}</p>
    </Flex>
    <Flex
      justify="start"
      align="center"
      style={{
        perspective: "800px",
        perspectiveOrigin: "center",
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          height: 275,
          flexShrink: 0,
          display: "inline-block",
          transform: `translateY(${translateY}) translateX(20%) rotateX(16deg) rotateZ(10deg)`,
        }}
      >
        <div style={{ height: "100%", width: "100%" }}>{componentShowcase}</div>
      </div>
    </Flex>
  </Flex>
);
