"use client";

import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Form, Input } from "antd";
import { EyeFilled, EyeInvisibleOutlined } from "@ant-design/icons";
import Notification, { NotificationProps } from "@/components/general/notification";
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

  // Using localStorage for token management (same as Login)
  const { set: setToken } = useLocalStorage<string>("token", "");

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
      const response = await apiService.post<User>("/api/auth/register", values);
      if (response.token) {
        setToken(response.token);
      }
      // Redirect to the home page directly after registration
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        setNotification({
          type: "error",
          message: `${error.name}: ${error.message}`,
          onClose: () => setNotification(null),
        });
      } else {
        console.error("An unknown error occurred during registration.");
      }
    }
  };

  return (
    <Card title="Register">
      <p>
        Already have an account? <Link href="/login">Login</Link>
      </p>
      {notification && <Notification {...notification} />}
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
            iconRender={(visible) =>
              visible ? <EyeFilled /> : <EyeInvisibleOutlined />
            }
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
            iconRender={(visible) =>
              visible ? <EyeFilled /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Register
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Register;
