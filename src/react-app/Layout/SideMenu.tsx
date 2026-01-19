import {
  FileTextOutlined,
  FolderOutlined,
  TagsOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { Layout, Menu, MenuProps } from "antd";
import { useNavigate, useLocation } from "react-router";

const { Sider } = Layout;

const siderStyle: React.CSSProperties = {
  overflow: "auto",
  height: "100vh",
  position: "sticky",
  insetInlineStart: 0,
  top: 0,
  scrollbarWidth: "thin",
  scrollbarGutter: "stable",
};

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("文章管理", "/articles", <FileTextOutlined />),
  getItem("分类管理", "/categories", <FolderOutlined />),
  getItem("标签管理", "/tags", <TagsOutlined />),
  getItem("静态资源", "/media", <FileImageOutlined />),
];

export interface SideMenuProps {
  collapsed: boolean;
}

const SideMenu: React.FC<SideMenuProps> = (props) => {
  const { collapsed } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={siderStyle}
      collapsedWidth={0}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default SideMenu;
