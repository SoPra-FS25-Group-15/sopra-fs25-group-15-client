"use client";

import { useGlobalUser } from "@/contexts/globalUser";
import { useGlobalUserAttributes } from "@/contexts/globalUserAttributes";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Divider, Flex, Form, Input, Spin } from "antd";
import React, { useState } from "react";
import Notification, { NotificationProps } from "@/components/general/notification";
import UserCard from "@/components/general/usercard";
import { red } from "@ant-design/colors";

const UserProfile: React.FC = () => {
  const apiService = useApi();
  const [loading, setLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const { user } = useGlobalUser();
  const { userAttributes } = useGlobalUserAttributes();
  const { set: setUser } = useLocalStorage<User | null>("user", null);

  const handleEditSave = () => {
    if (!user || !user.token) {
      setNotification({
        type: "error",
        message: "User not authenticated",
        description: "Please log in to update your profile.",
        onClose: () => setNotification(null),
      });
      return;
    }

    form
      .validateFields()
      .then((values) => {
        setLoading(true);
        apiService
          .put<User>(
            "/users/me",
            { username: values.username || user.username, email: values.email || user.email, statsPublic: true },
            { headers: { Authorization: user.token, "Content-Type": "application/json" } }
          )
          .then((payload) => {
            setUser({ ...user, ...payload } as User);
            form.setFieldsValue(payload);
            setEditMode(false);
          })
          .catch((err) => {
            console.error("Update failed:", err);
            setNotification({
              type: "error",
              message: "Failed to update user",
              description: err.message,
              onClose: () => setNotification(null),
            });
          })
          .finally(() => setLoading(false));
      })
      .catch((info) => console.log("Validation failed:", info));
  };

  const inputStyle = {
    backgroundColor: "#222",
    color: "#fff",
    borderColor: "#444",
  };

  const inputStyleNoEdit = { color: "#fff", cursor: "text" };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin style={{ color: "#fff" }} />
      </div>
    );
  }

  if (!user) {
    return <div style={{ color: "#fff" }}>User authentication required. Please log in.</div>;
  }

  return (
    <Flex vertical gap={8}>
      {notification && <Notification {...notification} />}
      <Flex gap={16}>
        <UserCard username={user.username} iconOnly iconsize="large" />
        <div>
          <h2>{user.username}</h2>
          {userAttributes && <p>{userAttributes.xp} XP</p>}
        </div>
      </Flex>

      {editMode ? (
        <>
          <Divider style={{ borderColor: "#444" }} />
          <Form form={form} layout="vertical" autoComplete="off" initialValues={user}>
            <Form.Item
              label={<p style={{ color: "#fff" }}>Username</p>}
              name="username"
              rules={[
                { min: 3, message: "Username must be at least 3 characters long" },
                { max: 16, message: "Username cannot exceed 16 characters" },
              ]}
            >
              <Input
                showCount={{
                  formatter: ({ count }) => {
                    const remaining = Math.max(0, 16 - count);
                    return <span style={{ color: remaining <= 3 ? red[3] : "inherit" }}>{remaining}</span>;
                  },
                }}
                placeholder={user.username}
                style={inputStyle}
              />
            </Form.Item>
            <Form.Item
              label={<p style={{ color: "#fff" }}>Email</p>}
              name="email"
              rules={[{ type: "email", message: "Please enter a valid email!" }]}
            >
              <Input placeholder={user.email} style={inputStyle} />
            </Form.Item>
            <Form.Item>
              <Flex gap={8} justify="end">
                <Button type="primary" onClick={handleEditSave} icon={<CheckOutlined />}>
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    form.setFieldsValue(user);
                  }}
                  icon={<CloseOutlined />}
                >
                  Cancel
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        </>
      ) : (
        <>
          <Divider style={{ borderColor: "#444" }} />
          <Form form={form} layout="vertical" autoComplete="off" initialValues={user}>
            <Form.Item label={<p style={{ color: "#fff" }}>Username</p>} name="username">
              <Input disabled placeholder={user.username} style={inputStyleNoEdit} />
            </Form.Item>
            <Form.Item label={<p style={{ color: "#fff" }}>Email</p>} name="email">
              <Input disabled placeholder={user.email} style={inputStyleNoEdit} />
            </Form.Item>
            <Form.Item>
              <Flex justify="end">
                <Button
                  type="primary"
                  onClick={() => {
                    setEditMode(true);
                    form.setFieldsValue(user);
                  }}
                  icon={<EditOutlined />}
                >
                  Edit user
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        </>
      )}
    </Flex>
  );
};

export default UserProfile;
