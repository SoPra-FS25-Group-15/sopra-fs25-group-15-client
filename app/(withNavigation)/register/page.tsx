"use client";

import Notification, { NotificationProps } from "@/components/general/notification";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { EyeFilled, EyeInvisibleOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Card, Flex, Form, Input } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface RegisterProps {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  // Saving the user in local storage
  const { set: setUser } = useLocalStorage<User | null>("user", null);

  const handleRegister = async (values: RegisterProps) => {
    // Check if passwords match
    if (values.password !== values.confirmPassword) {
      setNotification({
        type: "error",
        message: "Passwords do not match",
        onClose: () => setNotification(null),
      });
      return;
    }

    try {
      // Call the API to register and expect a token in the response
      const response = await apiService.post<User>("/auth/register", values);
      if (response.token) {
        setUser(response);
      }
      // Redirect to the home page directly after registration
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("409")) {
          setNotification({
            type: "error",
            message: "This username or email is already taken",
            onClose: () => setNotification(null),
          });
        }
        if (error.message.includes("400")) {
          setNotification({
            type: "error",
            message: "Bad request. Please check your input and try again",
            onClose: () => setNotification(null),
          });
        }
        if (error.message.includes("500")) {
          setNotification({
            type: "error",
            message: "Server error. Please try again later",
            onClose: () => setNotification(null),
          });
        }
      } else {
        console.error("An unknown error occurred during registration", error);
      }
    }
  };

  return (
    <Flex style={{ justifyContent: "center", alignItems: "center", height: "calc(100vh - 106px)" }}>
      <Card title="Register" style={{ width: "100%", maxWidth: 500 }}>
        <Flex vertical gap={16} style={{ width: "100%" }}>
          {notification && <Notification {...notification} />}
          <div>
            <p>
              Already have an account? <Link href="/login">Login</Link>
            </p>
          </div>
          <Form
            form={form}
            name="register"
            layout="vertical"
            variant="outlined"
            autoComplete="off"
            onFinish={handleRegister}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Please input your username!" }]}
            >
              <Input placeholder="Enter username" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email address!" },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please input your password!" }]}
            >
              <Input.Password
                placeholder="Enter password"
                iconRender={(visible) => (visible ? <EyeFilled /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("The two passwords do not match!"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirm password"
                iconRender={(visible) => (visible ? <EyeFilled /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Flex justify="end" align="center" style={{ width: "100%", marginTop: 16 }}>
                <Button type="primary" htmlType="submit">
                  Register
                </Button>
              </Flex>
            </Form.Item>
          </Form>
        </Flex>
      </Card>
    </Flex>
  );
};

export default Register;
