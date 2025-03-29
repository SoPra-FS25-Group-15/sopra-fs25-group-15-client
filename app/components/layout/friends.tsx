"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { useState, useEffect } from "react";
import { Button, Card, Form, Input, List } from "antd";
import { CheckOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { useApi } from "@/hooks/useApi";
import Notification, { NotificationProps } from "@/components/general/notification";

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
  // States for view mode
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  
  const [form] = Form.useForm();
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  // Fetch functions
  const fetchFriends = async () => {
    try {
      const response = await apiService.get<Friend[]>("/api/friends");
      setFriends(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: (error instanceof Error ? error.message : "Failed to load friends list."),
        onClose: () => setNotification(null),
      });
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await apiService.get<FriendRequest[]>("/api/friends/requests");
      setFriendRequests(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: (error instanceof Error ? error.message : "Failed to load friend requests."),
        onClose: () => setNotification(null),
      });
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await apiService.get<FriendRequest[]>("/api/friends/requests/sent");
      setSentRequests(response);
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: (error instanceof Error ? error.message : "Failed to load sent friend requests."),
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
        "/api/friends/request",
        { target: values.target }
      );
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      form.resetFields();
      // Return to main expanded view after sending invitation
      setShowInviteForm(false);
      fetchFriendRequests();
      fetchSentRequests();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: (error instanceof Error ? error.message : "Failed to send friend request."),
        onClose: () => setNotification(null),
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await apiService.put<{ message: string; friend: Friend }>(
        `/api/friends/requests/${requestId}`,
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
        message: (error instanceof Error ? error.message : "Failed to accept friend request."),
        onClose: () => setNotification(null),
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const response = await apiService.post<{ message: string }>(
        `/api/friends/requests/${requestId}`,
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
        message: (error instanceof Error ? error.message : "Failed to decline friend request."),
        onClose: () => setNotification(null),
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await apiService.delete<{ message: string }>(
        `/api/friends/requests/${requestId}`
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
        message: error instanceof Error ? error.message : "Failed to cancel friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const response = await apiService.delete<{ message: string }>(`/api/friends/${friendId}`);
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      fetchFriends();
    } catch (error: unknown) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to remove friend.",
        onClose: () => setNotification(null),
      });
    }
  };

  // Container style for right-oriented panel
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

  // Collapsed view: show friend profile pictures, a plus button for inviting a friend, and a toggle arrow to expand the panel
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
              <img
                src={friend.profilePicture}
                alt={friend.username}
                style={{ width: 40, height: 40, borderRadius: "50%" }}
              />
            </div>
          ))}
        </div>
        {/* Plus button to redirect to the invite friend form */}
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
        {/* For right side collapsed view, use a left-pointing toggle to expand the panel */}
        <div style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setCollapsed(false)}>
          &laquo;
        </div>
      </div>
    );
  }

  // If a public profile is selected, display it exclusively
  if (selectedProfile) {
    return (
      <div style={containerStyle}>
        {notification && <Notification {...notification} />}
        {/* Back arrow to return to friend management view */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ cursor: "pointer", fontWeight: "bold", marginRight: 8 }} onClick={() => setSelectedProfile(null)}>
            &#8592;
          </span>
          Public Profile: {selectedProfile.username}
        </div>
        <Card>
          <div style={{ textAlign: "center" }}>
            <img
              src={selectedProfile.profilePicture}
              alt={selectedProfile.username}
              style={{ width: 80, height: 80, borderRadius: "50%", marginBottom: 8 }}
            />
            <h3>{selectedProfile.username}</h3>
          </div>
        </Card>
      </div>
    );
  }

  // If the invite form is active, show it exclusively with a back ("←") option
  if (showInviteForm) {
    return (
      <div style={containerStyle}>
        {notification && <Notification {...notification} />}
        <div style={{ marginBottom: 16 }}>
          <span style={{ cursor: "pointer", fontWeight: "bold", marginRight: 8 }} onClick={() => setShowInviteForm(false)}>
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

  // Expanded main view – friend management interface
  return (
    <div style={containerStyle}>
      {notification && <Notification {...notification} />}
      
      {/* Collapse control using a right-pointing toggle */}
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setCollapsed(true)}>
          &raquo;
        </span>
      </div>

      {/* Button to show the Invite Friend form */}
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button type="default" onClick={() => setShowInviteForm(true)}>
          Add Friend
        </Button>
      </div>

      {/* Friend Requests with clickable names and green check / red X icons */}
      <Card title="Friend Requests">
        <List
          dataSource={friendRequests}
          locale={{ emptyText: "No friend requests available." }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  onClick={() => handleAcceptRequest(item.requestId)}
                  icon={<CheckOutlined style={{ color: "green", fontSize: "16px" }} />}
                />,
                <Button 
                  type="text" 
                  onClick={() => handleDeclineRequest(item.requestId)}
                  icon={<CloseOutlined style={{ color: "red", fontSize: "16px" }} />}
                />,
              ]}
            >
              <List.Item.Meta 
                title={
                  <div style={{ cursor: "pointer" }} onClick={() =>
                    setSelectedProfile({
                      userId: item.fromUserId,
                      username: item.username,
                      profilePicture: item.profilePicture,
                    })
                  }>
                    {item.username}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Sent Friend Requests */}
      <Card title="Sent Friend Requests" style={{ marginTop: 16 }}>
        <List
          dataSource={sentRequests}
          locale={{ emptyText: "No sent friend requests." }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  onClick={() => handleCancelRequest(item.requestId)}
                  icon={<CloseOutlined style={{ color: "grey", fontSize: "16px" }} />}
                />,
              ]}
            >
              <List.Item.Meta 
                title={
                  <div style={{ cursor: "pointer" }} onClick={() =>
                    setSelectedProfile({
                      userId: item.fromUserId,
                      username: item.username,
                      profilePicture: item.profilePicture,
                    })
                  }>
                    {item.username}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Friends List */}
      <Card title="Friends List" style={{ marginTop: 16 }}>
        <List
          dataSource={friends}
          locale={{ emptyText: "No friends found." }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleRemoveFriend(item.userId)}>
                  Remove
                </Button>,
              ]}
            >
              <List.Item.Meta 
                title={
                  <div style={{ cursor: "pointer" }} onClick={() =>
                    setSelectedProfile({
                      userId: item.userId,
                      username: item.username,
                      profilePicture: item.profilePicture,
                    })
                  }>
                    {item.username}
                  </div>
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
