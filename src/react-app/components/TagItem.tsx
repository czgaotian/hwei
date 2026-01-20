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

const TagItem: React.FC<TagItemProps> = ({
  tag,
  size = "default",
  closable = false,
  onClose,
}) => {
  const getFontSize = () => {
    switch (size) {
      case "small":
        return "12px";
      case "large":
        return "16px";
      default:
        return "14px";
    }
  };

  const getPadding = () => {
    switch (size) {
      case "small":
        return "2px 6px";
      case "large":
        return "6px 12px";
      default:
        return "4px 8px";
    }
  };

  return (
    <Tag
      color={tag.color}
      closable={closable}
      onClose={onClose}
      style={{
        borderRadius: "4px",
        padding: getPadding(),
        fontSize: getFontSize(),
        border: `1px solid ${tag.color}`,
        backgroundColor: `${tag.color}15`, // 15% opacity
      }}
    >
      {tag.name}
    </Tag>
  );
};

export default TagItem;
