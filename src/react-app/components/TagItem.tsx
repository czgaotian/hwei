import React from "react";
import { Tag } from "antd";

export interface TagItemProps {
  tag: {
    name: string;
    color: string;
  };
  closable?: boolean;
  onClose?: () => void;
}

const TagItem: React.FC<TagItemProps> = ({
  tag,
  closable = false,
  onClose,
}) => {
  const { name, color } = tag;

  return (
    <Tag
      color={color}
      closable={closable}
      onClose={onClose}
      style={{
        borderRadius: "4px",
        padding: "4px 8px",
        fontSize: "14px",
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
