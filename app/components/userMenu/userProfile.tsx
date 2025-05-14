"use client";

import Notification, { NotificationProps } from "@/components/general/notification";
import UserCard from "@/components/general/usercard";
import { useGlobalUser } from "@/contexts/globalUser";
import { useGlobalUserAttributes } from "@/contexts/globalUserAttributes";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { CheckOutlined, CloseOutlined, EditOutlined, ExportOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Form, Input, Modal, Spin, Statistic, Switch } from "antd";
import React, { useState } from "react";
import PublicUserProfile from "../general/publicUserProfile";
import { purple } from "@ant-design/colors";

const UserProfile: React.FC = () => {
  const apiService = useApi();
  const [loading, setLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
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
            {
              username: values.username || user.username,
              email: values.email || user.email,
              statsPublic: values.statsPublic !== undefined ? values.statsPublic : user.statsPublic,
            },
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

  const overflowStyle: React.CSSProperties = {
    maxWidth: "100%",
    overflowX: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "#888 #111",
  };

  const statisticStyle: React.CSSProperties = {
    backgroundColor: "#444",
    borderColor: "#555",
    flexShrink: 0,
    minWidth: 200,
  };

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
    <Flex vertical gap={24}>
      {notification && <Notification {...notification} />}
      <Flex
        style={{ padding: 20, backgroundColor: "#fff", color: "#000", borderRadius: 8 }}
        justify="space-between"
        align="center"
        gap={16}
      >
        <Flex align="center" gap={16}>
          <UserCard username={user.username} iconOnly iconsize="large" />
          <div>
            <h2>{user.username}</h2>
            {userAttributes && <p>{userAttributes.xp} XP</p>}
          </div>
        </Flex>
        <Button icon={<ExportOutlined />} style={{ color: purple[5] }} type="text" onClick={() => setPreviewOpen(true)}>
          Preview Public Profile
        </Button>
      </Flex>

      <Card
        variant="borderless"
        styles={{ header: { padding: "16px 0" }, body: { padding: "16px 0" } }}
        style={{ padding: 0, backgroundColor: "transparent", width: "100%", boxShadow: "none" }}
        title={"General"}
        extra={
          editMode ? (
            <Flex gap={8}>
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
          ) : (
            <Button
              type="primary"
              onClick={() => {
                setEditMode(true);
                form.setFieldsValue(user);
              }}
              icon={<EditOutlined />}
            >
              Edit
            </Button>
          )
        }
      >
        {editMode ? (
          <>
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
                  count={{
                    show: true,
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
              <Form.Item label={<p style={{ color: "#fff" }}>Make Profile Public</p>} name="statsPublic">
                <Switch checked={user.statsPublic} />
              </Form.Item>
            </Form>
          </>
        ) : (
          <>
            <Form form={form} layout="vertical" autoComplete="off" initialValues={user}>
              <Form.Item label={<p style={{ color: "#fff" }}>Username</p>} name="username">
                <Input disabled placeholder={user.username} style={inputStyleNoEdit} />
              </Form.Item>
              <Form.Item label={<p style={{ color: "#fff" }}>Email</p>} name="email">
                <Input disabled placeholder={user.email} style={inputStyleNoEdit} />
              </Form.Item>
              <Form.Item label={<p style={{ color: "#fff" }}>Make Profile Public</p>} name="statsPublic">
                <Switch disabled checked={user.statsPublic} />
              </Form.Item>
            </Form>
          </>
        )}
      </Card>

      <Card
        variant="borderless"
        styles={{ header: { padding: "16px 0" }, body: { padding: "16px 0" } }}
        style={{ padding: 0, backgroundColor: "transparent", width: "100%", boxShadow: "none" }}
        title={"Statistics"}
      >
        <Flex gap={8} style={overflowStyle}>
          {userAttributes &&
            Object.entries({
              "Games Won": userAttributes.wins,
              "Games Played": userAttributes.gamesPlayed,
            }).map(([key, value]) => (
              <Card key={key} style={statisticStyle}>
                <Statistic title={key} value={value} />
              </Card>
            ))}
        </Flex>
      </Card>

      <Modal
        styles={{ body: { paddingTop: 40 } }}
        centered
        destroyOnClose
        closeIcon={<CloseOutlined />}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        onClose={() => setPreviewOpen(false)}
        footer={null}
        maskClosable
      >
        <PublicUserProfile userId={user.userid} />
      </Modal>
    </Flex>
  );
};

export default UserProfile;
