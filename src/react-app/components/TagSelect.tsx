import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Select, message, Button, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { tagsApi } from "@frontend/api/tags";
import type { Tag } from "@frontend/api/tags";
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
  // 使用惰性初始化（rerender-lazy-state-init）
  const [tags, setTags] = useState<Tag[]>(() => []);
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

  // 使用 useCallback 稳定回调引用（rerender-functional-setstate + advanced-event-handler-refs）
  const handleChange = useCallback(
    (selectedIds: number[]) => {
      onChange?.(selectedIds);
    },
    [onChange],
  );

  const handleSearch = useCallback((val: string) => {
    setSearchValue(val);
  }, []);

  // 使用 useMemo 缓存计算结果（rerender-memo）
  const options = useMemo(
    () =>
      tags.map((tag) => ({
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
      })),
    [tags, maxCount, value],
  );

  // 使用 useCallback + Map 优化查找性能（js-set-map-lookups + rerender-functional-setstate）
  const tagsMap = useMemo(() => {
    const map = new Map<number, Tag>();
    for (const tag of tags) {
      map.set(tag.id, tag);
    }
    return map;
  }, [tags]);

  // 渲染已选标签
  const tagRender = useCallback(
    (props: {
      label: React.ReactNode;
      value: number;
      closable: boolean;
      onClose: () => void;
    }) => {
      const tag = tagsMap.get(props.value);
      // 使用三元运算符而非 && （rendering-conditional-render）
      return tag ? (
        <TagItem
          tag={{ name: tag.name, color: tag.color }}
          size="small"
          closable={props.closable}
          onClose={props.onClose}
        />
      ) : (
        <span>{props.label}</span>
      );
    },
    [tagsMap],
  );

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
