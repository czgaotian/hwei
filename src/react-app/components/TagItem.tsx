import React from "react";
import { Tag } from "antd";

export interface TagItemProps {
  tag: {
    name: string;
    color: string;
  };
  size?: "small" | "default" | "large";
  closable?: boolean;
  onClose?: () => void;
}

// 预计算尺寸映射表（rendering-hoist-jsx + js-cache-property-access）
const SIZE_CONFIG = {
  small: { fontSize: "12px", padding: "2px 6px" },
  default: { fontSize: "14px", padding: "4px 8px" },
  large: { fontSize: "16px", padding: "6px 12px" },
} as const;

const TagItem: React.FC<TagItemProps> = ({
  tag,
  size = "default",
  closable = false,
  onClose,
}) => {
  // 缓存配置查找（js-cache-property-access）
  const config = SIZE_CONFIG[size];
  const { name, color } = tag;

  return (
    <Tag
      color={color}
      closable={closable}
      onClose={onClose}
      style={{
        borderRadius: "4px",
        padding: config.padding,
        fontSize: config.fontSize,
        border: `1px solid ${color}`,
        backgroundColor: `${color}15`, // 15% opacity
      }}
    >
      {name}
    </Tag>
  );
};

// 使用 React.memo 避免不必要的重新渲染（rerender-memo）
export default React.memo(TagItem);
