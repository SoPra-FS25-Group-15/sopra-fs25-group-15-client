"use client";

import { useApi } from "@/hooks/useApi";
import { PublicUser, PublicUserAttributes } from "@/types/user";
import { Card, Empty, Flex, Spin, Statistic, Tag } from "antd";
import React, { useEffect, useState } from "react";
import UserCard from "./usercard";

interface PublicUserProfileProps {
  userId: number;
}

const PublicUserProfile: React.FC<PublicUserProfileProps> = ({ userId }) => {
  const apiService = useApi();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [profileAttributes, setProfileAttributes] = useState<PublicUserAttributes | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await apiService.get<PublicUser>(`/users/${userId}`);
        setProfile(profileData);
        // const profileAttributesData = await apiService.get<PublicUserAttributes>(`/profile/${userId}`);
        setProfileAttributes({
          mmr: 0,
          stats: {
            casual: {
              games: { played: 2, won: 1 },
              rounds: { played: 9, won: 5 },
              cards: { round: 5, powerup: 4, punishment: 5 },
              roundsLostAgainst: [
                { username: "Userone", amount: 3 },
                { username: "Usertwo", amount: 2 },
              ],
            },
            competitive: {
              games: { played: 2, won: 1 },
              rounds: { played: 9, won: 5 },
              cards: { round: 5, powerup: 4, punishment: 5 },
              roundsLostAgainst: [
                { username: "Userone", amount: 5 },
                { username: "Usertwo", amount: 3 },
              ],
            },
          },
          achievementProgress: [],
        });
      } catch (error) {
        console.error("Failed to fetch public profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [apiService, userId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <Spin />
      </div>
    );
  }

  if (!profile) {
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

  return (
    <Flex style={{ height: "100%" }} vertical gap={16}>
      <div>
        <UserCard
          borderless
          username={profile.username}
          subviewBottom={<Tag color="purple">{`${profileAttributes?.mmr} MRR` || undefined}</Tag>}
        />
      </div>
      <Card title="Casual Stats" size="small" style={{ width: "100%" }}>
        <Flex vertical justify="center" align="center" gap={8}>
          {!profileAttributes?.stats.casual ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <>
              <Card style={{ background: "#111", maxWidth: "100%", width: "100%" }} title="Games">
                <Flex justify="flex-basis" align="center" gap={8} style={overflowStyle}>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Games Played" value={profileAttributes?.stats.casual.games.played} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Games Won" value={profileAttributes?.stats.casual.games.won} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Rounds Played" value={profileAttributes?.stats.casual.rounds.played} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Rounds Won" value={profileAttributes?.stats.casual.rounds.won} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Round Cards" value={profileAttributes?.stats.casual.cards.round} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Powerup Cards" value={profileAttributes?.stats.casual.cards.powerup} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Punishment Cards" value={profileAttributes?.stats.casual.cards.punishment} />
                  </Card>
                </Flex>
              </Card>
              <Card
                style={{ background: "#111", maxWidth: "100%", width: "100%" }}
                title="Nemesis: Most Rounds Lost Against"
              >
                <Flex justify="flex-basis" align="center" gap={8} style={overflowStyle}>
                  {profileAttributes?.stats.casual.roundsLostAgainst.length > 0 &&
                    profileAttributes.stats.casual.roundsLostAgainst.map((lost, index) => (
                      <Card key={index} variant="borderless">
                        <Statistic title={lost.username} value={`${lost.amount} times`} />
                      </Card>
                    ))}
                </Flex>
              </Card>
            </>
          )}
        </Flex>
      </Card>

      <Card title="Competitive Stats" size="small" style={{ width: "100%" }}>
        <Flex vertical justify="center" align="center" gap={16}>
          {!profileAttributes?.stats.competitive ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <>
              <Card style={{ background: "#111", maxWidth: "100%", width: "100%" }} title="Games">
                <Flex justify="flex-basis" align="center" gap={8} style={overflowStyle}>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Games Played" value={profileAttributes.stats.competitive.games.played} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Games Won" value={profileAttributes.stats.competitive.games.won} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Rounds Played" value={profileAttributes.stats.competitive.rounds.played} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Rounds Won" value={profileAttributes.stats.competitive.rounds.won} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Round Cards" value={profileAttributes.stats.competitive.cards.round} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Powerup Cards" value={profileAttributes.stats.competitive.cards.powerup} />
                  </Card>
                  <Card variant="borderless" style={{ flexShrink: 0 }}>
                    <Statistic title="Punishment Cards" value={profileAttributes.stats.competitive.cards.punishment} />
                  </Card>
                </Flex>
              </Card>
              <Card
                style={{ background: "#111", maxWidth: "100%", width: "100%" }}
                title="Nemesis: Most Rounds Lost Against"
              >
                <Flex justify="flex-basis" align="center" gap={8} style={overflowStyle}>
                  {profileAttributes.stats.competitive.roundsLostAgainst.length > 0 &&
                    profileAttributes.stats.competitive.roundsLostAgainst.map((lost, index) => (
                      <Card key={index} variant="borderless">
                        <Statistic title={lost.username} value={`${lost.amount} times`} />
                      </Card>
                    ))}
                </Flex>
              </Card>
            </>
          )}
        </Flex>
      </Card>

      <Card title="Achievements" size="small" style={{ width: "100%" }}>
        <Flex justify="center" align="center" gap={8}>
          {!profileAttributes?.achievementProgress || profileAttributes.achievementProgress.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            profileAttributes.achievementProgress.map((achievement) => (
              <Card key={achievement.id} variant="borderless">
                <Statistic
                  title={achievement.id}
                  value={achievement.progress}
                  suffix={`/ ${achievement.maxProgress}`}
                />
              </Card>
            ))
          )}
        </Flex>
      </Card>
    </Flex>
  );
};

export default PublicUserProfile;
