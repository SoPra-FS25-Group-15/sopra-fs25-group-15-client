"use client";

import { useApi } from "@/hooks/useApi";
import { PublicUser, UserAttributes } from "@/types/user";
import { Card, Empty, Flex, Spin, Statistic } from "antd";
import React, { useEffect, useState } from "react";
import UserCard from "./usercard";

interface PublicUserProfileProps {
  userId: number;
}

const PublicUserProfile: React.FC<PublicUserProfileProps> = ({ userId }) => {
  const apiService = useApi();
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [publicUserAttributes, setPublicUserAttributes] = useState<UserAttributes | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await apiService.get<PublicUser>(`/users/${userId}`);
        setPublicUser(userData);
        console.log("[PublicProfile] Fetched public user data:", userData);
      } catch (error) {
        console.error("[PublicProfile] Failed to fetch public user data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [apiService, userId]);

  useEffect(() => {
    const fetchUserAttributeData = async () => {
      try {
        const publicUserAttributesData = await apiService.get<UserAttributes>(`/users/${userId}/stats`);
        setPublicUserAttributes(publicUserAttributesData);
        console.log("[PublicProfile] Fetched public user attribute data:", publicUserAttributesData);
      } catch (error) {
        if (error instanceof Error && error.message.includes("403")) {
          console.info("[PublicProfile] Failed to fetch public user attribute data: User has private stats");
          setPublicUserAttributes(null);
        } else {
          console.error("[PublicProfile] Failed to fetch public user attribute data", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserAttributeData();
  }, [apiService, userId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <Spin />
      </div>
    );
  }

  if (!publicUser) {
    return (
      <Flex align="center" justify="center">
        <p>Profile not found.</p>
      </Flex>
    );
  }

  const overflowStyle: React.CSSProperties = {
    maxWidth: "100%",
    overflowX: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "#888 #111",
  };

  const statisticStyle: React.CSSProperties = {
    backgroundColor: "#444",
    borderColor: "#555",
    flexShrink: 0,
    minWidth: 200,
  };

  return (
    <Flex style={{ height: "100%" }} vertical gap={16}>
      <Flex
        style={{ padding: 20, backgroundColor: "#fff", color: "#000", borderRadius: 8 }}
        justify="space-between"
        align="center"
        gap={16}
      >
        <Flex align="center" gap={16}>
          <UserCard username={publicUser.username} iconOnly iconsize="large" />
          <Flex vertical gap={2}>
            <h2 style={{ lineHeight: 1.2 }}>{publicUser.username}</h2>
            {publicUserAttributes && <p style={{ lineHeight: 1 }}>{publicUserAttributes.xp} XP</p>}
          </Flex>
        </Flex>
      </Flex>

      <Card
        variant="borderless"
        styles={{ header: { padding: "16px 0" }, body: { padding: "16px 0" } }}
        style={{ padding: 0, backgroundColor: "transparent", width: "100%", boxShadow: "none" }}
        title={"Statistics"}
      >
        <Flex gap={8} style={overflowStyle}>
          {publicUserAttributes ? (
            Object.entries({
              "Games Won": publicUserAttributes.wins,
              "Games Played": publicUserAttributes.gamesPlayed,
            }).map(([key, value]) => (
              <Card key={key} style={statisticStyle}>
                <Statistic title={key} value={value} />
              </Card>
            ))
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={"User has set their stats to private"}
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </Flex>
      </Card>
    </Flex>
  );
};

export default PublicUserProfile;
