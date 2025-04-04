import { Palette } from "@ant-design/colors";
import Icon, { ClockCircleOutlined, DragOutlined, GlobalOutlined, QuestionOutlined } from "@ant-design/icons";
import { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import { Flex, Tag, Tooltip } from "antd";
import React, { ForwardRefExoticComponent } from "react";

export interface RoundCardProps {
  maxWidth?: number | string;
  maxHeight?: number | string;
  themeColor: Palette;
  icon: ForwardRefExoticComponent<Omit<AntdIconProps, "ref">>;
  title: string;
  description: string;
  modifiers: RoundCardModifiers;
  onClick: () => void;
}

export interface RoundCardModifiers {
  time: number;
  guesses: number;
  streetview: "Standard" | "No Move" | "NMPZ" | "Blurred" | "Hidden";
  map: "Standard" | "No Labels";
}

const RoundCard: React.FC<RoundCardProps> = ({
  maxWidth,
  maxHeight,
  themeColor,
  icon,
  title,
  description,
  modifiers,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: "63/88",
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        color: "#fff",
        background: "#222",
        borderColor: "#444",
        borderWidth: 2,
        padding: 20,
        borderRadius: 12,
        cursor: "pointer",
      }}
    >
      <Flex vertical justify="space-between" gap={40} style={{ height: "100%", padding: "5%" }}>
        <Flex vertical align="flex-start" gap={8} style={{ lineHeight: 1 }}>
          <Icon component={icon} style={{ color: themeColor[1], fontSize: "64px", paddingBottom: "15%" }}></Icon>
          <h2
            style={{
              fontSize: "1.2em",
              fontWeight: "600",
              color: themeColor[4],
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Round Card
          </h2>
          <h1 style={{ fontSize: "3em", color: "#fff", fontWeight: "800", textTransform: "uppercase", margin: 0 }}>
            {title}
          </h1>
          <p style={{ fontSize: "1em", color: themeColor[1], fontWeight: "600", lineHeight: 1.2 }}>{description}</p>
        </Flex>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Tooltip title="Time limit in seconds">
            <Tag bordered color="#333" style={{ borderColor: themeColor[5], margin: 0 }} icon={<ClockCircleOutlined />}>
              {modifiers.time}s
            </Tag>
          </Tooltip>
          <Tooltip title="Number of guesses">
            <Tag bordered color="#333" style={{ borderColor: themeColor[5], margin: 0 }} icon={<QuestionOutlined />}>
              {modifiers.guesses}
            </Tag>
          </Tooltip>
          <Tooltip title="Streetview modifier">
            <Tag bordered color="#333" style={{ borderColor: themeColor[5], margin: 0 }} icon={<DragOutlined />}>
              {modifiers.streetview}
            </Tag>
          </Tooltip>
          <Tooltip title="Map modifier">
            <Tag bordered color="#333" style={{ borderColor: themeColor[5], margin: 0 }} icon={<GlobalOutlined />}>
              {modifiers.map}
            </Tag>
          </Tooltip>
        </div>
      </Flex>
    </div>
  );
};

export default RoundCard;
