"use client";

import Notification, { NotificationProps } from "@/components/general/notification";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { EyeFilled, EyeInvisibleOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { Button, Card, Checkbox, Form, Input } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginProps {
  email: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();

  // Saving the user in local storage under key "user"
  const { set: setUser } = useLocalStorage<User | null>("user", null);

  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const handleLogin = async (values: LoginProps) => {
    try {
      const response = await apiService.post<User>("/auth/login", values);
      if (response.token) {
        setUser(response);
      }
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        setNotification({
          type: "error",
          message: `${error.name}: ${error.message}`,
          onClose: () => setNotification(null),
        });
      } else {
        console.error("An unknown error occurred during login.");
      }
    }
  };

  return (
    <Card title="Login">
      <p>
        Don&apos;t have an account yet? <Link href="/register">Register</Link>
      </p>
      {notification && <Notification {...notification} />}
      <Form
        form={form}
        name="login"
        layout="vertical"
        variant="outlined"
        initialValues={{ remember: true }}
        autoComplete="off"
        onFinish={handleLogin}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please input a valid email!" }
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
        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>Keep me signed in</Checkbox>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Login
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Login;
