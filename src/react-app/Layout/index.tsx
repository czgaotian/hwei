import React, { useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import {
  Button,
  Layout,
  theme,
  Dropdown,
  Space,
  Typography,
  Modal,
  message,
} from "antd";
import type { MenuProps } from "antd";
import SideMenu from "./SideMenu";
import { useAuth } from "@frontend/context/authContext";
import { useNavigate } from "react-router";

const { Header, Content } = Layout;
const { Text } = Typography;

const basicLayoutStyle: React.CSSProperties = {
  overflow: "auto",
  height: "100vh",
  width: "100vw",
};

export interface BasicLayoutProps {
  children: React.ReactNode;
}

const BasicLayout: React.FC<BasicLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    Modal.confirm({
      title: "确定要退出登录吗？",
      content: "退出后需要重新登录才能访问系统",
      okText: "确定",
      cancelText: "取消",
      onOk: async () => {
        try {
          await logout();
          message.success("已退出登录");
          navigate("/login");
        } catch (error) {
          message.error("退出失败，请重试");
        }
      },
    });
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout hasSider style={basicLayoutStyle}>
      <SideMenu collapsed={collapsed} />
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <UserOutlined />
              <Text>{user?.username}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
