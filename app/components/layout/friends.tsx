"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { useState, useEffect } from "react";
import { Button, Card, Form, Input, List } from "antd";
import { CheckOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";
import UserCard from "@/components/general/usercard";
import PublicUserProfile from "@/components/general/publicProfile";

interface Friend {
  userId: string;
  username: string;
  profilePicture: string;
}

interface FriendRequest {
  requestId: string;
  fromUserId: string;
  username: string;
  email?: string;
  profilePicture: string;
}

interface PublicProfile {
  userId: string;
  username: string;
  profilePicture: string;
}

const FriendManagement: React.FC = () => {
  const apiService = useApi();
  // View mode states
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  const [form] = Form.useForm();
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  // Container style for expanded view (same as friendManagement)
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    right: 0,
    top: "20%",
    maxWidth: 500,
    width: "100%",
    zIndex: 1000,
    background: "#fff",
    border: "1px solid #ddd",
    padding: 16,
  };

  // Fetch functions
  const fetchFriends = async () => {
    try {
      const response = await apiService.get<Friend[]>("/friends");
      setFriends(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load friends list.",
        onClose: () => setNotification(null),
      });
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await apiService.get<FriendRequest[]>("/friends/requests");
      setFriendRequests(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load friend requests.",
        onClose: () => setNotification(null),
      });
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await apiService.get<FriendRequest[]>("/friends/requests/sent");
      setSentRequests(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load sent friend requests.",
        onClose: () => setNotification(null),
      });
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchSentRequests();
  }, []);

  const handleSendRequest = async (values: { target: string }) => {
    try {
      const response = await apiService.post<{ message: string; requestId: string }>(
        "/friends/request",
        { target: values.target }
      );
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      form.resetFields();
      setShowInviteForm(false);
      fetchFriendRequests();
      fetchSentRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to send friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await apiService.put<{ message: string; friend: Friend }>(
        `/friends/requests/${requestId}`,
        { action: "accept" }
      );
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      fetchFriends();
      fetchFriendRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to accept friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const response = await apiService.post<{ message: string }>(
        `/friends/requests/${requestId}`,
        {}
      );
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      fetchFriendRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to decline friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await apiService.delete<{ message: string }>(
        `/friends/requests/${requestId}`
      );
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      fetchSentRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to cancel friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const response = await apiService.delete<{ message: string }>(`/friends/${friendId}`);
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      fetchFriends();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove friend.",
        onClose: () => setNotification(null),
      });
    }
  };

  // --- Collapsed View ---
  if (collapsed) {
    return (
      <div style={{ ...containerStyle, width: 80, padding: 8, textAlign: "center" }}>
        <div style={{ marginBottom: 8 }}>
          {friends.map((friend) => (
            <div
              key={friend.userId}
              style={{ marginBottom: 8, cursor: "pointer" }}
              onClick={() =>
                setSelectedProfile({
                  userId: friend.userId,
                  username: friend.username,
                  profilePicture: friend.profilePicture,
                })
              }
            >
              <UserCard username={friend.username} showPointer />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 8 }}>
          <Button
            type="text"
            icon={<PlusOutlined style={{ fontSize: "16px" }} />}
            onClick={() => {
              setCollapsed(false);
              setShowInviteForm(true);
            }}
          />
        </div>
        <div style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setCollapsed(false)}>
          &laquo;
        </div>
      </div>
    );
  }

  // --- Public Profile View ---
  if (selectedProfile) {
    return (
      <div style={containerStyle}>
        {notification && <Notification {...notification} />}
        <PublicUserProfile
          userId={selectedProfile.userId}
          onBack={() => setSelectedProfile(null)}
        />
      </div>
    );
  }

  // --- Invite Friend Form View ---
  if (showInviteForm) {
    return (
      <div style={containerStyle}>
        {notification && <Notification {...notification} />}
        <div style={{ marginBottom: 16 }}>
          <span
            style={{ cursor: "pointer", fontWeight: "bold", marginRight: 8 }}
            onClick={() => setShowInviteForm(false)}
          >
            &#8592;
          </span>
          Add New Friend
        </div>
        <Card>
          <Form form={form} layout="vertical" onFinish={handleSendRequest}>
            <Form.Item
              name="target"
              label="Friend's Email or Username"
              rules={[{ required: true, message: "Please input your friend's email or username!" }]}
            >
              <Input placeholder="Enter your friend's email or username" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Send Invitation
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  // --- Expanded Main View ---
  return (
    <div style={containerStyle}>
      {notification && <Notification {...notification} />}
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <span
          style={{ cursor: "pointer", fontWeight: "bold" }}
          onClick={() => setCollapsed(true)}
        >
          &raquo;
        </span>
      </div>
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button type="default" onClick={() => setShowInviteForm(true)}>
          Add Friend
        </Button>
      </div>
      <Card title="Friend Requests">
        <List
          dataSource={friendRequests}
          locale={{ emptyText: "No friend requests available." }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="accept"
                  type="text"
                  onClick={() => handleAcceptRequest(item.requestId)}
                  icon={<CheckOutlined style={{ color: "green", fontSize: "16px" }} />}
                />,
                <Button
                  key="decline"
                  type="text"
                  onClick={() => handleDeclineRequest(item.requestId)}
                  icon={<CloseOutlined style={{ color: "red", fontSize: "16px" }} />}
                />,
              ]}
            >
              <UserCard
                username={item.username}
                showPointer
                onClick={() =>
                  setSelectedProfile({
                    userId: item.fromUserId,
                    username: item.username,
                    profilePicture: item.profilePicture,
                  })
                }
              />
            </List.Item>
          )}
        />
      </Card>
      <Card title="Sent Friend Requests" style={{ marginTop: 16 }}>
        <List
          dataSource={sentRequests}
          locale={{ emptyText: "No sent friend requests." }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="cancel"
                  type="text"
                  onClick={() => handleCancelRequest(item.requestId)}
                  icon={<CloseOutlined style={{ color: "grey", fontSize: "16px" }} />}
                />,
              ]}
            >
              <UserCard
                username={item.username}
                showPointer
                onClick={() =>
                  setSelectedProfile({
                    userId: item.fromUserId,
                    username: item.username,
                    profilePicture: item.profilePicture,
                  })
                }
              />
            </List.Item>
          )}
        />
      </Card>
      <Card title="Friends List" style={{ marginTop: 16 }}>
        <List
          dataSource={friends}
          locale={{ emptyText: "No friends found." }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="remove"
                  type="text"
                  onClick={() => handleRemoveFriend(item.userId)}
                  icon={<CloseOutlined style={{ color: "grey", fontSize: "16px" }} />}
                />,
              ]}
            >
              <UserCard
                username={item.username}
                showPointer
                onClick={() =>
                  setSelectedProfile({
                    userId: item.userId,
                    username: item.username,
                    profilePicture: item.profilePicture,
                  })
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default FriendManagement;
