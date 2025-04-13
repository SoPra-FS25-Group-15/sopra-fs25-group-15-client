import React, { useState, useEffect } from "react";
import { Card, Button, Form, Input, message, Descriptions } from "antd";
import { useApi } from "@/hooks/useApi";

interface UserProfileDTO {
  userid: number;
  username: string;
  email: string;
  token?: string;
  statsPublic?: boolean;
  mmr?: number;
  points?: number;
  achievements?: string[];
}

const UserProfile: React.FC = () => {
  const apiService = useApi();
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Retrieve the token from localStorage
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
      "Content-Type": "application/json",
    };
    apiService
      .get<UserProfileDTO>("/auth/me", { headers })
      .then((data) => {
        // Force statsPublic to be true by default
        data.statsPublic = true;
        setProfile(data);
        form.setFieldsValue({
          username: data.username,
          email: data.email,
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
        email: profile.email,
      });
    }
  };

  // Save updates using PUT /users/me; statsPublic is always sent as true.
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
          "Content-Type": "application/json",
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
        console.log("Validate Failed:", info);
      });
  };

  return (
    <Card title="My Profile" loading={loading} style={{ maxWidth: 600, margin: "auto" }}>
      {!editMode && profile && (
        <>
          <Descriptions title="Profile Information" bordered column={1}>
            <Descriptions.Item label="Username">{profile.username}</Descriptions.Item>
            <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
            <Descriptions.Item label="MMR">
              {profile.mmr !== undefined ? profile.mmr : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Points">
              {profile.points !== undefined ? profile.points : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Achievements">
              {profile.achievements && profile.achievements.length > 0
                ? profile.achievements.join(", ")
                : "None"}
            </Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button type="primary" onClick={handleEdit}>
              Edit Profile
            </Button>
          </div>
        </>
      )}

      {editMode && (
        <>
          <Form form={form} layout="vertical">
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please input your username!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input />
            </Form.Item>
          </Form>
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button type="primary" onClick={handleSave} style={{ marginRight: 8 }}>
              Save
            </Button>
            <Button onClick={handleCancelEdit}>Cancel</Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default UserProfile;
