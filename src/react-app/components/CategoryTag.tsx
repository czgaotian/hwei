import React from "react";
import { Tag } from "antd";

interface CategoryTagProps {
  category: {
    name: string;
    color: string;
  };
  closable?: boolean;
  onClose?: () => void;
}

const CategoryTag: React.FC<CategoryTagProps> = ({
  category,
  closable = false,
  onClose,
}) => {
  const { name, color } = category;

  // 计算背景色（透明度 0.1）
  const backgroundColor = `${color}1A`; // 添加透明度

  return (
    <Tag
      color={color}
      closable={closable}
      onClose={onClose}
      style={{
        backgroundColor,
        borderColor: color,
        color: color,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "14px",
        padding: "2px 8px",
      }}
    >
      {/* 前置色块 */}
      <span
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "2px",
          backgroundColor: color,
        }}
      />
      {name}
    </Tag>
  );
};

export default CategoryTag;
