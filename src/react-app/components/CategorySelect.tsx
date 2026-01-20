import React, { useState } from "react";
import { Select, Space, Spin, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import useSWR from "swr";
import { categoriesApi } from "@frontend/api/categories";
import type { Category } from "@frontend/api/categories";

interface CategorySelectProps {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  allowCreate?: boolean;
  onCreateClick?: () => void;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  placeholder = "请选择分类",
  allowCreate = false,
  onCreateClick,
}) => {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useSWR(
    ["categories-select", search],
    ([, searchKeyword]) =>
      categoriesApi.getCategories({
        page: 1,
        pageSize: 100,
        keyword: searchKeyword || undefined,
      }),
    {
      revalidateOnFocus: false,
    },
  );

  const categories = data?.data.data || [];

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      showSearch={{
        onSearch: setSearch,
        filterOption: false,
      }}
      loading={isLoading}
      notFoundContent={isLoading ? <Spin /> : "未找到分类"}
      style={{ width: "100%" }}
      popupRender={(menu) => (
        <>
          {menu}
          {allowCreate && (
            <>
              <div
                style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0" }}
              />
              <div style={{ padding: "8px" }}>
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={onCreateClick}
                  style={{ padding: 0 }}
                >
                  新建分类
                </Button>
              </div>
            </>
          )}
        </>
      )}
    >
      {categories.map((category: Category) => (
        <Select.Option key={category.id} value={category.id}>
          <Space>
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                backgroundColor: category.color,
              }}
            />
            {category.name}
          </Space>
        </Select.Option>
      ))}
    </Select>
  );
};

export default CategorySelect;
