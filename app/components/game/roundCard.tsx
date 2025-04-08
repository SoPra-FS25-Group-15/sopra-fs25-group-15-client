import { RoundCard } from "@/types/roundcard";
import { purple } from "@ant-design/colors";
import Icon from "@ant-design/icons";
import { Button, Flex, List, Popover } from "antd";
import React from "react";

const bounce = "150ms cubic-bezier(1, 0, 0.5, 1)";

const RoundCardComponent: React.FC<RoundCard & { style?: React.CSSProperties }> = ({
  themeColor = purple,
  icon,
  title,
  description,
  modifiers,
  selected = false,
  onClick,
  style = {},
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: "63/88",
        width: "100%",
        height: "100%",
        color: "#fff",
        background: "#222",
        border: selected ? "2px solid #fff" : "1px solid #444",
        transform: selected ? "scale(1.05)" : "scale(1)",
        zIndex: selected ? 20 : 10,
        transition: `transform ${bounce}, box-shadow ${bounce}, border ${bounce}, z-index ${bounce}`,
        padding: 20,
        borderRadius: 12,
        cursor: "pointer",
        userSelect: "none",
        ...style,
      }}
    >
      <Flex vertical justify="space-between" gap={40} style={{ height: "100%" }}>
        <Flex vertical align="flex-start" gap={8} style={{ lineHeight: 1 }}>
          <Icon component={icon} style={{ color: themeColor[1], fontSize: "64px", paddingBottom: "15%" }} />
          <h2
            style={{
              fontSize: "1.1em",
              fontWeight: "600",
              color: themeColor[4],
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Round Card
          </h2>
          <h1
            style={{
              fontSize: "2.2em",
              color: "#fff",
              fontWeight: "800",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: "1em",
              color: themeColor[1],
              fontWeight: "600",
              lineHeight: 1.2,
            }}
          >
            {description}
          </p>
        </Flex>
        <Flex justify="right" style={{ width: "100%" }}>
          <Popover
            content={
              <List
                style={{
                  width: "100%",
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  backgroundColor: "transparent",
                  color: "#fff",
                }}
                dataSource={[
                  { key: "time", title: "Time limit in seconds", value: `${modifiers.time}s` },
                  { key: "guesses", title: "Number of guesses", value: modifiers.guesses },
                  { key: "streetview", title: "Streetview modifier", value: modifiers.streetview },
                  { key: "map", title: "Map modifier", value: modifiers.map },
                ]}
                renderItem={(item) => (
                  <List.Item style={{ display: "flex", width: "100%", padding: 0 }}>
                    <div style={{ flex: 1, fontWeight: 600, padding: "4px 8px" }}>{item.title}</div>
                    <div
                      style={{ flex: 0, color: themeColor[3], fontWeight: 800, textAlign: "right", padding: "4px 8px" }}
                    >
                      {item.value}
                    </div>
                  </List.Item>
                )}
              />
            }
            trigger="hover"
          >
            <Button disabled type="dashed" shape="circle" style={{ cursor: "help", color: "#fff" }}>
              ?
            </Button>
          </Popover>
        </Flex>
      </Flex>
    </div>
  );
};

export default RoundCardComponent;
