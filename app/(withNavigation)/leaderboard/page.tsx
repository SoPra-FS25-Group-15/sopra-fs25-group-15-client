/* eslint-disable @typescript-eslint/no-explicit-any */
// page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card, Spin, Typography } from "antd";
import { getApiDomain } from "@/utils/domain";
import { useGlobalUser } from "@/contexts/globalUser";
import UserCard from "@/components/general/usercard";

interface Entry {
  rank: number;
  username: string;
  xp: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const { user } = useGlobalUser();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
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
          <Spin tip="Loading..." />
        ) : error ? (
          <Typography.Text type="danger">{error}</Typography.Text>
        ) : (
          <div
            className="leaderboard-list"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {entries.map((item) => (
              <div
                key={item.username}
                className={`leaderboard-item${
                  item.isCurrentUser ? " current-user" : ""
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.75rem 1rem",
                  gap: "2rem"
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
                    flexShrink: 0
                  }}
                >
                  {item.rank}
                </span>

                {/* Center: User Card */}
                <div style={{ flexGrow: 1 }}>
                  <UserCard
                    borderless
                    username={item.username}
                    iconsize="large"
                    showPointer={false}
                  />
                </div>

                {/* Right: XP */}
                <span
                  className="xp-badge"
                  style={{
                    fontWeight: 600,
                    fontSize: "1.1rem",
                    whiteSpace: "nowrap"
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