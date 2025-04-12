"use client";

import React, { useState, useEffect } from "react";
import { Card, Button, Avatar, Spin, Tag, Input, Form, message } from "antd";
import { UserOutlined, EditOutlined, SaveOutlined, RollbackOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";

interface UserProfileData {
  userId: string;
  username: string;
  profilePicture: string;
  rank?: string;
  bio?: string;
}

const UserProfile: React.FC = () => {
  const apiService = useApi();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Retrieve the current user's ID and authentication token from localStorage.
  const userId = localStorage.getItem("userId") || "";
  const token = localStorage.getItem("token") || "";

  // Fetch the user's profile data.
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await apiService.get<UserProfileData>(`/users/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      setProfile(data);
      form.setFieldsValue({
        username: data.username,
        bio: data.bio,
      });
    } catch (error) {
      console.error("Failed to fetch profile", error);
      message.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  // Switch to edit mode.
  const onEdit = () => {
    setEditing(true);
  };

  // Cancel editing and revert to the loaded profile values.
  const onCancel = () => {
    setEditing(false);
    if (profile) {
      form.setFieldsValue({
        username: profile.username,
        bio: profile.bio,
      });
    }
  };

  // Submit the updated profile values.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const updatedProfile = await apiService.put<UserProfileData>(
        `/users/${userId}`,
        { ...values },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      setProfile(updatedProfile);
      setEditing(false);
      message.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile", error);
      message.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

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
        position: "absolute",
        right: 0,
      }}
    >
      <Card size="small" style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <Avatar
            size={64}
            src={profile.profilePicture}
            icon={!profile.profilePicture ? <UserOutlined /> : undefined}
          />
          <div style={{ flex: 1 }}>
            {editing ? (
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{ required: true, message: "Username required" }]}
                >
                  <Input />
                </Form.Item>
              </Form>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{profile.username}</p>
                {profile.rank && <Tag color="purple">{profile.rank}</Tag>}
              </>
            )}
          </div>
        </div>
        {editing ? (
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item label="Bio" name="bio">
              <Input.TextArea rows={3} placeholder="Enter your bio" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={onCancel} icon={<RollbackOutlined />}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <>
            {profile.bio && <p>{profile.bio}</p>}
            <Button type="primary" onClick={onEdit} icon={<EditOutlined />}>
              Edit Profile
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default UserProfile;
