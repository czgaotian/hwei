import React, { useState, useCallback } from "react";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { authApi } from "@frontend/api/auth";
import { useNavigate } from "react-router";

const { Title } = Typography;

interface SetupFormValues {
  username: string;
  password: string;
  confirm: string;
}

const Setup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = useCallback(
    async (values: SetupFormValues) => {
      setLoading(true);
      try {
        await authApi.register({
          username: values.username,
          password: values.password,
        });
        message.success("管理员账号创建成功！请登录");
        navigate("/login");
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : undefined;
        message.error(errorMessage || "初始化失败，请重试");
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          初始化管理员账号
        </Title>
        <Form
          form={form}
          name="setup"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="管理员用户名"
            rules={[
              { required: true, message: "请输入用户名" },
              {
                min: 3,
                max: 20,
                message: "用户名长度应在3-20个字符之间",
              },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message: "用户名只能包含字母、数字和下划线",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 8, message: "密码至少8位" },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
                message: "密码必须包含字母和数字",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={["password"]}
            rules={[
              { required: true, message: "请确认密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              创建管理员
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Setup;
