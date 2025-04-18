'use client';

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  message,
  Avatar,
  Spin,
  Typography,
  Divider,
  Tag
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  RollbackOutlined,
  UserOutlined,
  CloseOutlined
} from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";

const { Title, Text } = Typography;

interface UserProfileDTO {
  userid: number;
  username: string;
  email: string;
  token?: string;
  statsPublic?: boolean;
  mmr?: number;
  points?: number;
  achievements?: string[];
  avatar?: string;
  rank?: string;
}

const UserProfile: React.FC = () => {
  const apiService = useApi();
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [form] = Form.useForm();

  // Load token from localStorage
  const storedUserStr = localStorage.getItem("user");
  let token: string | null = null;
  if (storedUserStr) {
    try {
      token = JSON.parse(storedUserStr).token;
    } catch {
      console.error("Error parsing user token");
    }
  }

  // Fetch profile
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiService
      .get<UserProfileDTO>("/auth/me", {
        headers: { Authorization: token, "Content-Type": "application/json" }
      })
      .then((data) => {
        data.statsPublic = true;
        setProfile(data);
        form.setFieldsValue({ username: data.username, email: data.email });
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        message.error("Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, [token, apiService, form]);

  const handleEdit = () => setEditMode(true);
  const handleCancelEdit = () => {
    setEditMode(false);
    if (profile) {
      form.setFieldsValue({ username: profile.username, email: profile.email });
    }
  };
  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        if (!token) {
          message.error("User not authenticated.");
          return;
        }
        setLoading(true);
        apiService
          .put<UserProfileDTO>(
            "/users/me",
            { ...values, statsPublic: true },
            { headers: { Authorization: token, "Content-Type": "application/json" } }
          )
          .then((data) => {
            message.success("Profile updated successfully.");
            data.statsPublic = true;
            setProfile(data);
            setEditMode(false);
            // Sync localStorage
            const current = JSON.parse(localStorage.getItem("user") || "{}");
            current.username = data.username;
            current.email = data.email;
            localStorage.setItem("user", JSON.stringify(current));
          })
          .catch((err) => {
            console.error("Update failed:", err);
            message.error(err.message || "Failed to update profile.");
          })
          .finally(() => setLoading(false));
      })
      .catch((info) => console.log("Validation failed:", info));
  };
  const handleClose = () => setVisible(false);

  if (!visible) return null;

  if (!token) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#fff" }}>
        User authentication required. Please log in.
      </div>
    );
  }
  if (loading || !profile) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin style={{ color: "#fff" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",          // make this container the positioning context
        maxWidth: 600,
        margin: "40px auto",
        padding: 24,
        background: "#1f1f1f",
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        color: "#fff"
      }}
    >
      {/* absolutely positioned close button with larger hit area */}
      <Button
        type="text"
        shape="circle"
        size="small"
        onClick={handleClose}
        icon={<CloseOutlined style={{ color: "#fff", fontSize: 16 }} />}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          padding: 4,
        }}
        aria-label="Close"
      />

      <Card
        style={{ background: "transparent", border: "none", color: "#fff" }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <Avatar
            size={72}
            src={profile.avatar || undefined}
            icon={!profile.avatar && <UserOutlined />}
            style={{ marginRight: 24 }}
          >
            {profile.username.charAt(0).toUpperCase()}
          </Avatar>

          <div>
            <Title level={4} style={{ margin: 0, color: "#fff" }}>
              {profile.username}
            </Title>
            {profile.rank && <Tag color="purple">{profile.rank}</Tag>}
          </div>
        </div>

        {editMode ? (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              label={<Text style={{ color: "#fff" }}>Username</Text>}
              name="username"
              rules={[{ required: true, message: "Please input your username!" }]}
            >
              <Input style={{ backgroundColor: "#333", color: "#fff", borderColor: "#444" }} />
            </Form.Item>
            <Form.Item
              label={<Text style={{ color: "#fff" }}>Email</Text>}
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" }
              ]}
            >
              <Input style={{ backgroundColor: "#333", color: "#fff", borderColor: "#444" }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save
              </Button>
              <Button style={{ marginLeft: 12 }} onClick={handleCancelEdit} icon={<RollbackOutlined />}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Email:</Text>
              <br />
              <Text>{profile.email || "Not available"}</Text>
            </div>
            <Divider style={{ borderColor: "#444" }} />
            <div style={{ marginBottom: 16 }}>
              <Text strong>MMR:</Text>
              <br />
              <Text>{profile.mmr ?? "N/A"}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Points:</Text>
              <br />
              <Text>{profile.points ?? "N/A"}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Achievements:</Text>
              <br />
              <Text>
                {profile.achievements && profile.achievements.length > 0
                  ? profile.achievements.join(", ")
                  : "None"}
              </Text>
            </div>
            <Divider style={{ borderColor: "#444" }} />
            <div style={{ marginBottom: 24 }}>
              <Text strong>Stats Public:</Text>
              <br />
              <Text>Yes</Text>
            </div>
            <Button type="primary" onClick={handleEdit} icon={<EditOutlined />}>
              Edit Profile
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default UserProfile;
