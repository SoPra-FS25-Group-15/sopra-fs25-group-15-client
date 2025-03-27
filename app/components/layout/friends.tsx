"use client";

import "@ant-design/v5-patch-for-react-19";
import React, { useState, useEffect } from "react";
import { Button, Card, Form, Input, List } from "antd";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import Notification, { NotificationProps } from "@/components/general/notification";

interface Friend {
  userId: string;
  username: string;
}

interface FriendRequest {
  requestId: string;
  fromUserId: string;
  username: string;
  email?: string;
}

const FriendManagement: React.FC = () => {
  const apiService = useApi();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [form] = Form.useForm();
  const { value: token, clear: clearToken } = useLocalStorage<string | null>("token", null);
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    setHydrated(true);
    setUserId(localStorage.getItem("userId")); 
  }, []);

  useEffect(() => {
    if (hydrated && !token) {
        router.push("/login");
    }
  }, [hydrated, token]);

  const fetchFriends = async () => {
    try {
      const response = await apiService.get<Friend[]>("/api/friends");
      setFriends(response);
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to load friends list.",
        onClose: () => setNotification(null),
      });
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await apiService.get<FriendRequest[]>("/api/friends/requests");
      setFriendRequests(response);
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to load friend requests.",
        onClose: () => setNotification(null),
      });
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await apiService.get<FriendRequest[]>("/api/friends/requests/sent");
      setSentRequests(response);
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to load sent friend requests.",
        onClose: () => setNotification(null),
      });
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchSentRequests();
  }, []);

  // handleSendRequest that expects either email or username (handled in the backend)
  const handleSendRequest = async (values: { target: string }) => {
    try {
      // The backend endpoint should check if the target is an email or a username
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
      // Refresh pending requests after sending invitation
      fetchFriendRequests();
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to send friend request.",
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
      // Update both friend list and friend requests
      fetchFriends();
      fetchFriendRequests();
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to accept friend request.",
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
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to decline friend request.",
        onClose: () => setNotification(null),
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await apiService.delete<{ message: string }>(`/api/friends/requests/${requestId}`);
      setNotification({
        type: "success",
        message: response.message,
        onClose: () => setNotification(null),
      });
      fetchSentRequests();
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to cancel friend request.",
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
    } catch (error: any) {
      setNotification({
        type: "error",
        message: error.message || "Failed to remove friend.",
        onClose: () => setNotification(null),
      });
    }
  };

  return (
    <div>
      {notification && <Notification {...notification} />}
      
      <Card title="Send Friend Invitation">
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

      <Card title="Friend Requests" style={{ marginTop: 16 }}>
        <List
          dataSource={friendRequests}
          locale={{ emptyText: "No friend requests available." }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="primary" onClick={() => handleAcceptRequest(item.requestId)}>
                  Accept
                </Button>,
                <Button danger onClick={() => handleDeclineRequest(item.requestId)}>
                  Decline
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={item.username}
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
                <Button type="default" onClick={() => handleCancelRequest(item.requestId)}>
                  Cancel Request
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={item.username}
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
                <Button danger onClick={() => handleRemoveFriend(item.userId)}>
                  Remove Friend
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={item.username}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default FriendManagement;
