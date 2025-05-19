/* eslint-disable @typescript-eslint/no-explicit-any */
// page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, Flex, Spin, Typography } from "antd";
import { getApiDomain } from "@/utils/domain";
import { useGlobalUser } from "@/contexts/globalUser";
import UserCard from "@/components/general/usercard";
import { LoadingOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

interface Entry {
  rank: number;
  username: string;
  xp: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useGlobalUser();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (localStorage.getItem("user") === null) {
      setLoading(false);
      setSignedIn(false);
      return;
    }
    if (!user) return;
    setSignedIn(true);
    fetch(`${getApiDomain()}/leaderboard/top?count=10`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        return res.json();
      })
      .then((dto: { entries: any[] }) =>
        setEntries(
          dto.entries.map((e) => ({
            rank: e.rank,
            username: e.username,
            xp: e.xp,
            isCurrentUser: e.isCurrentUser,
          }))
        )
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="leaderboard-container">
      <Card title="Global Leaderboard" className="leaderboard-card">
        {loading ? (
          <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          </Flex>
        ) : !signedIn ? (
          <Flex justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
            <Typography.Text type="secondary">
              Please{" "}
              <Button style={{ margin: 0, padding: 0 }} type="link" onClick={() => router.push("/login")}>
                sign in
              </Button>{" "}
              to view the leaderboard
            </Typography.Text>
          </Flex>
        ) : error ? (
          <Flex vertical gap={8} justify="center" align="center" style={{ width: "100%", height: "100%", padding: 30 }}>
            <Typography.Title level={5}>An error occured while loading the leaderboard</Typography.Title>
            <Typography.Text type="secondary">Error Description: {error}</Typography.Text>
          </Flex>
        ) : (
          <div className="leaderboard-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {entries.map((item) => (
              <div
                key={item.username}
                className={`leaderboard-item${item.isCurrentUser ? " current-user" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.75rem 6rem 0.75rem 1rem",
                  gap: "2rem",
                }}
              >
                {/* Left: Rank Circle */}
                <span
                  className="rank-circle"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    color: "#000",
                    fontWeight: 600,
                    fontSize: "1.2rem",
                    flexShrink: 0,
                  }}
                >
                  {item.rank}
                </span>

                {/* Center: User Card */}
                <div style={{ flexGrow: 1 }}>
                  <UserCard borderless username={item.username} iconsize="large" showPointer={false} />
                </div>

                {/* Right: XP */}
                <span
                  className="xp-badge"
                  style={{
                    fontWeight: 600,
                    fontSize: "1.1rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.xp} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
