import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  message,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Descriptions,
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
  UserOutlined
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
  avatar?: string; // Avatar URL from the backend (if available)
  rank?: string;
}

const UserProfile: React.FC = () => {
  const apiService = useApi();
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Retrieve token from localStorage (or your global context)
  const storedUserStr = localStorage.getItem("user");
  let token: string | null = null;
  if (storedUserStr) {
    try {
      const storedUser = JSON.parse(storedUserStr);
      token = storedUser.token;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
  }

  // Load profile data using the authenticated endpoint /auth/me
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const headers = {
      Authorization: token,
      "Content-Type": "application/json"
    };
    apiService
      .get<UserProfileDTO>("/auth/me", { headers })
      .then((data) => {
        // Force statsPublic to true by default
        data.statsPublic = true;
        setProfile(data);
        // Prepopulate form fields (avatar remains display-only)
        form.setFieldsValue({
          username: data.username,
          email: data.email
        });
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        message.error("Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, [token, apiService, form]);

  // Enter edit mode
  const handleEdit = () => {
    setEditMode(true);
  };

  // Cancel edit mode and reset form values
  const handleCancelEdit = () => {
    setEditMode(false);
    if (profile) {
      form.setFieldsValue({
        username: profile.username,
        email: profile.email
      });
    }
  };

  // Save updates using PUT /users/me (updating only username and email)
  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        if (!token) {
          message.error("User is not authenticated.");
          return;
        }
        setLoading(true);
        const headers = {
          Authorization: token,
          "Content-Type": "application/json"
        };
        const updatedValues = { ...values, statsPublic: true };
        apiService
          .put<UserProfileDTO>("/users/me", updatedValues, { headers })
          .then((data) => {
            message.success("Profile updated successfully.");
            data.statsPublic = true;
            setProfile(data);
            setEditMode(false);
            // Update the user record in localStorage
            const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
            currentUser.username = data.username;
            currentUser.email = data.email;
            localStorage.setItem("user", JSON.stringify(currentUser));
          })
          .catch((err) => {
            console.error("Update failed:", err);
            message.error(err.message || "Failed to update profile.");
          })
          .finally(() => setLoading(false));
      })
      .catch((info) => {
        console.log("Validation Failed:", info);
      });
  };

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
        maxWidth: 600,
        margin: "40px auto",
        padding: 24,
        background: "#1f1f1f", // dark background
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        color: "#fff"
      }}
    >
      <Card style={{ background: "transparent", border: "none", color: "#fff" }} bodyStyle={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <Avatar
            size={72}
            src={profile.avatar || undefined}
            icon={!profile.avatar ? <UserOutlined /> : undefined}
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
              <Text strong style={{ color: "#fff" }}>Email:</Text>
              <br />
              <Text style={{ color: "#fff" }}>
                {profile.email || "Not available"}
              </Text>
            </div>
            <Divider style={{ borderColor: "#444" }} />
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ color: "#fff" }}>MMR:</Text>
              <br />
              <Text style={{ color: "#fff" }}>
                {profile.mmr !== undefined ? profile.mmr : "N/A"}
              </Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ color: "#fff" }}>Points:</Text>
              <br />
              <Text style={{ color: "#fff" }}>
                {profile.points !== undefined ? profile.points : "N/A"}
              </Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ color: "#fff" }}>Achievements:</Text>
              <br />
              <Text style={{ color: "#fff" }}>
                {profile.achievements && profile.achievements.length > 0
                  ? profile.achievements.join(", ")
                  : "None"}
              </Text>
            </div>
            <Divider style={{ borderColor: "#444" }} />
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: "#fff" }}>Stats Public:</Text>
              <br />
              <Text style={{ color: "#fff" }}>Yes</Text>
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
