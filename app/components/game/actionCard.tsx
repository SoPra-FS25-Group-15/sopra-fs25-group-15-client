import { ActionCard, ActionCardType } from "@/types/game/actioncard";
import { green, red } from "@ant-design/colors";
import { ConfigProvider, Flex, Select, SelectProps, Tooltip } from "antd";
import React from "react";

const bounce = "150ms cubic-bezier(1, 0, 0.5, 1)";

const ActionCardComponent: React.FC<
  ActionCard & { onChange: (username: string) => void; playerList: SelectProps["options"] }
> = ({ title, description, type, selected = false, onClick, onChange, playerList }) => {
  return (
    <div
      onClick={onClick}
      style={{
        scrollSnapAlign: "center",
        aspectRatio: "1/1",
        maxWidth: "100%",
        height: "100%",
        color: "#fff",
        background: type == "powerup" ? green[9] : red[9],
        border: selected ? "2px solid #fff" : "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: selected ? "0 7px 15px rgba(0, 0, 0, 0.3)" : "0 5px 10px rgba(0, 0, 0, 0.2)",
        transform: selected ? "scale(1.05)" : "scale(1)",
        zIndex: selected ? 20 : 10,
        transition: `transform ${bounce}, box-shadow ${bounce}, border ${bounce}, z-index ${bounce}`,
        padding: 20,
        borderRadius: 12,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <Flex vertical align="flex-start" justify="center" gap={16} style={{ height: "100%", lineHeight: 1 }}>
        <Flex gap={8} vertical style={{ width: "100%" }}>
          <h2
            style={{
              fontSize: "1.1em",
              fontWeight: "600",
              color: type == "powerup" ? green[4] : red[4],
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {type}
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
              color: type == "powerup" ? green[1] : red[1],
              fontWeight: "600",
              lineHeight: 1.2,
            }}
          >
            {description}
          </p>
        </Flex>
        {type == "punishment" && (
          <Flex
            vertical
            gap={8}
            style={{
              width: "100%",
              opacity: selected ? 1.0 : 0.0,
              maxHeight: selected ? "100%" : "0px",
              overflow: "hidden",
              transition: `max-height ${bounce}, opacity ${bounce}`,
            }}
          >
            <h2
              style={{
                fontSize: "1em",
                fontWeight: "600",
                color: red[4],
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Apply to
            </h2>
            <ConfigProvider
              theme={{
                components: {
                  Select: {
                    selectorBg: red[7],
                    colorBgElevated: red[7],
                    colorText: "#fff",
                    colorTextPlaceholder: "rgba(255, 255, 255, 0.8)",
                    colorBorder: "rgba(255, 255, 255, 0)",
                    activeBorderColor: "rgba(255, 255, 255, 0.3)",
                    hoverBorderColor: "rgba(255, 255, 255, 0.3)",
                    optionSelectedBg: "rgba(255, 255, 255, 0.2)",
                    optionActiveBg: "rgba(255, 255, 255, 0.1)",
                    optionFontSize: 18,
                  },
                },
              }}
            >
              <Select
                size="large"
                placeholder="Select a player"
                options={playerList}
                onChange={onChange}
                style={{ fontWeight: 500, fontSize: "16px" }}
                dropdownStyle={{
                  fontWeight: 500,
                  fontSize: "20px",
                }}
              />
            </ConfigProvider>
          </Flex>
        )}
      </Flex>
    </div>
  );
};

export default ActionCardComponent;

// Smaller version of the ActionCardComponent for display purposes only
export const MiniActionCardComponent: React.FC<{
  title: string;
  description: string;
  type: ActionCardType;
  onClick?: () => void;
}> = ({ title, description, type, onClick }) => {
  return (
    <Tooltip
      title={description}
      autoAdjustOverflow
      placement="bottomLeft"
      color={type === "powerup" ? green[8] : red[8]}
    >
      <div
        onClick={onClick}
        style={{
          height: "100%",
          color: "#fff",
          background: type === "powerup" ? green[9] : red[9],
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: "4px 8px",
          borderRadius: 4,
          cursor: "pointer",
          userSelect: "none",
          position: "relative",
        }}
      >
        <h1
          style={{
            fontSize: "12px",
            fontWeight: "800",
            textTransform: "uppercase",
            color: type == "powerup" ? green[4] : red[4],
            margin: 0,
            padding: 0,
          }}
        >
          {title}
        </h1>
      </div>
    </Tooltip>
  );
};
