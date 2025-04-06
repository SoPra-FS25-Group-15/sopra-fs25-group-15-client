"use client";

import React, { useState, useEffect } from "react";
import { Card, Button, Avatar, Spin, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";

interface PublicUserProfileProps {
  userId: string;
  onBack: () => void;
}

interface UserProfile {
  userId: string;
  username: string;
  profilePicture: string;
  rank?: string;
  bio?: string;
}

const PublicUserProfile: React.FC<PublicUserProfileProps> = ({ userId, onBack }) => {
  const apiService = useApi();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiService.get<UserProfile>(`/users/${userId}`);
        setProfile(data);
      } catch (error) {
        console.error("Failed to fetch public profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, apiService]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <Spin />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <p>Profile not found.</p>
        <Button onClick={onBack}>Back</Button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 500,
        width: "100%",
        padding: 16,
        background: "#fff",
        border: "1px solid #ddd",
      }}
    >
      <Button onClick={onBack} style={{ marginBottom: 16 }}>
        Back
      </Button>
      <Card size="small" style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar
            size={42}
            src={profile.profilePicture}
            icon={!profile.profilePicture ? <UserOutlined /> : undefined}
          />
          <div>
            <p style={{ margin: 0 }}>{profile.username}</p>
            {profile.rank && <Tag color="purple">{profile.rank}</Tag>}
          </div>
        </div>
        {profile.bio && <p style={{ marginTop: 16 }}>{profile.bio}</p>}
      </Card>
    </div>
  );
};

export default PublicUserProfile;
