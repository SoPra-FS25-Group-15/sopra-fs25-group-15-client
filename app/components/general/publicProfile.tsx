"use client";

import { useApi } from "@/hooks/useApi";
import { PublicUser, PublicUserAttributes } from "@/types/user";
import { Card, Empty, Flex, Spin, Statistic, Tag } from "antd";
import React, { useEffect, useState } from "react";
import UserCard from "./usercard";

interface PublicUserProfileProps {
  username: string;
}

const PublicUserProfile: React.FC<PublicUserProfileProps> = ({ username }) => {
  const apiService = useApi();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [profileAttributes, setProfileAttributes] = useState<PublicUserAttributes | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await apiService.get<PublicUser>(`/users/${username}`);
        setProfile(profileData);
        const profileAttributesData = await apiService.get<PublicUserAttributes>(`/profile/${username}`);
        setProfileAttributes(profileAttributesData);
      } catch (error) {
        console.error("Failed to fetch public profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [apiService, username]);

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

  return (
    <Flex vertical gap={16}>
      <div>
        <UserCard
          borderless
          username={profile.username}
          subviewBottom={<Tag color="purple">{`${profileAttributes?.mmr} MRR` || undefined}</Tag>}
        />
      </div>
      <Card title="Casual Stats" size="small" style={{ width: "100%" }}>
        <Flex wrap gap={8}>
          {!profileAttributes?.stats.casual ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <>
              <Card variant="borderless">
                <Statistic title="Games Played" value={profileAttributes?.stats.casual.games.played} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Games Won" value={profileAttributes?.stats.casual.games.won} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Rounds Played" value={profileAttributes?.stats.casual.rounds.played} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Rounds Won" value={profileAttributes?.stats.casual.rounds.won} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Round Cards" value={profileAttributes?.stats.casual.cards.round} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Powerup Cards" value={profileAttributes?.stats.casual.cards.powerup} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Punishment Cards" value={profileAttributes?.stats.casual.cards.punishment} />
              </Card>
              {profileAttributes?.stats.casual.roundsLostAgainst.length > 0 &&
                profileAttributes.stats.casual.roundsLostAgainst.map((lost, index) => (
                  <Card key={index} variant="borderless">
                    <Statistic title={`Lost Against ${lost.username}`} value={lost.username} />
                  </Card>
                ))}
            </>
          )}
        </Flex>
      </Card>

      <Card title="Competitive Stats" size="small" style={{ width: "100%" }}>
        <Flex wrap gap={8}>
          {!profileAttributes?.stats.competitive ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <>
              <Card variant="borderless">
                <Statistic title="Games Played" value={profileAttributes?.stats.competitive.games.played} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Games Won" value={profileAttributes?.stats.competitive.games.won} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Rounds Played" value={profileAttributes?.stats.competitive.rounds.played} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Rounds Won" value={profileAttributes?.stats.competitive.rounds.won} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Round Cards" value={profileAttributes?.stats.competitive.cards.round} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Powerup Cards" value={profileAttributes?.stats.competitive.cards.powerup} />
              </Card>
              <Card variant="borderless">
                <Statistic title="Punishment Cards" value={profileAttributes?.stats.competitive.cards.punishment} />
              </Card>
              {profileAttributes?.stats.competitive.roundsLostAgainst.length > 0 &&
                profileAttributes.stats.competitive.roundsLostAgainst.map((lost, index) => (
                  <Card key={index} variant="borderless">
                    <Statistic title={`Lost Against ${lost.username}`} value={lost.username} />
                  </Card>
                ))}
            </>
          )}
        </Flex>
      </Card>

      <Card title="Achievements" size="small" style={{ width: "100%" }}>
        <Flex wrap gap={8}>
          {!profileAttributes?.achievementProgress || profileAttributes.achievementProgress.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            profileAttributes.achievementProgress.map((achievement) => (
              <Card key={achievement.id} variant="borderless">
                <Statistic title={achievement.id} value={achievement.progress} suffix={`/ ${achievement.progress}`} />
              </Card>
            ))
          )}
        </Flex>
      </Card>
    </Flex>
  );
};

export default PublicUserProfile;
