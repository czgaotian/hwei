import React, { useState, useEffect } from "react";
import { Select, message, Button, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { tagsApi, Tag } from "@frontend/api/tags";
import TagItem from "./TagItem";

export interface TagSelectProps {
  value?: number[];
  onChange?: (value: number[]) => void;
  placeholder?: string;
  maxCount?: number;
  allowCreate?: boolean;
  onCreateClick?: () => void;
}

const TagSelect: React.FC<TagSelectProps> = ({
  value = [],
  onChange,
  placeholder = "选择标签",
  maxCount,
  allowCreate = false,
  onCreateClick,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // 加载所有标签
  const loadTags = async (search?: string) => {
    setLoading(true);
    try {
      const response = await tagsApi.getTags({
        page: 1,
        pageSize: 100, // 获取足够多的标签
        search,
      });
      setTags(response.data.data);
    } catch (error) {
      message.error("加载标签列表失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  // 搜索处理（带防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== undefined) {
        loadTags(searchValue);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleChange = (selectedIds: number[]) => {
    onChange?.(selectedIds);
  };

  const handleSearch = (val: string) => {
    setSearchValue(val);
  };

  // 生成选项
  const options = tags.map((tag) => ({
    label: (
      <Space>
        <span
          style={{
            display: "inline-block",
            width: "12px",
            height: "12px",
            borderRadius: "2px",
            backgroundColor: tag.color,
          }}
        />
        <span>{tag.name}</span>
      </Space>
    ),
    value: tag.id,
    disabled:
      maxCount !== undefined &&
      value.length >= maxCount &&
      !value.includes(tag.id),
  }));

  // 渲染已选标签
  const tagRender = (props: {
    label: React.ReactNode;
    value: number;
    closable: boolean;
    onClose: () => void;
  }) => {
    const tag = tags.find((t) => t.id === props.value);
    if (!tag) {
      // Return a fallback element instead of null
      return <span>{props.label}</span>;
    }

    return (
      <TagItem
        tag={{ name: tag.name, color: tag.color }}
        size="small"
        closable={props.closable}
        onClose={props.onClose}
      />
    );
  };

  return (
    <Space orientation="vertical" style={{ width: "100%" }}>
      <Select
        mode="multiple"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        loading={loading}
        showSearch={{ onSearch: handleSearch, filterOption: false }}
        tagRender={tagRender}
        options={options}
        style={{ width: "100%" }}
        maxCount={maxCount}
      />
      {allowCreate && (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onCreateClick}
          block
        >
          新建标签
        </Button>
      )}
    </Space>
  );
};

export default TagSelect;
