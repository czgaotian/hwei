import React, { useState, useEffect, useMemo, useCallback } from "react";
import useSWR from "swr";
import {
  Button,
  Table,
  Space,
  Input,
  message,
  Modal,
  Typography,
  Tag as AntTag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { categoriesApi } from "@frontend/api/categories";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@frontend/api/categories";
import CategoryModal from "./CategoryModal";
import dayjs from "dayjs";

const { Search } = Input;
const { Text } = Typography;

interface CategoryListState {
  searchKeyword: string;
  pagination: {
    page: number;
    pageSize: number;
  };
  modalVisible: boolean;
  modalMode: "create" | "edit";
  editingCategory: Category | null;
}

const CategoryList: React.FC = () => {
  const [state, setState] = useState<CategoryListState>(() => ({
    searchKeyword: "",
    pagination: {
      page: 1,
      pageSize: 10,
    },
    modalVisible: false,
    modalMode: "create",
    editingCategory: null,
  }));

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading, mutate } = useSWR(
    [
      "categories",
      state.pagination.page,
      state.pagination.pageSize,
      debouncedSearch,
    ],
    ([, page, pageSize, keyword]) =>
      categoriesApi.getCategories({
        page,
        pageSize,
        keyword: keyword || undefined,
      }),
    {
      revalidateOnFocus: false,
      onError: () => {
        message.error("加载分类列表失败");
      },
    },
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(state.searchKeyword);
      setState((prev) => ({
        ...prev,
        pagination: { ...prev.pagination, page: 1 },
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [state.searchKeyword]);

  // 打开新建分类 Modal - 使用 useCallback
  const handleCreate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalVisible: true,
      modalMode: "create",
      editingCategory: null,
    }));
  }, []);

  // 打开编辑分类 Modal - 使用 useCallback
  const handleEdit = useCallback((category: Category) => {
    setState((prev) => ({
      ...prev,
      modalVisible: true,
      modalMode: "edit",
      editingCategory: category,
    }));
  }, []);

  // 删除分类 - 使用 useCallback
  const handleDelete = useCallback(
    (category: Category) => {
      const articleCount = category.articleCount || 0;

      // 如果有关联文章，禁止删除
      if (articleCount > 0) {
        message.warning(
          `该分类下有 ${articleCount} 篇文章，请先移除文章关联后再删除`,
        );
        return;
      }

      const content = `确定要删除分类「${category.name}」吗？此操作不可撤销。`;

      Modal.confirm({
        title: "确认删除",
        icon: <ExclamationCircleOutlined />,
        content,
        okText: "确定",
        okType: "danger",
        cancelText: "取消",
        onOk: async () => {
          try {
            await categoriesApi.deleteCategory(category.id);
            message.success("分类删除成功");

            const currentCategories = data?.data.data || [];
            const shouldGoBack =
              currentCategories.length === 1 && state.pagination.page > 1;
            if (shouldGoBack) {
              setState((prev) => ({
                ...prev,
                pagination: {
                  ...prev.pagination,
                  page: prev.pagination.page - 1,
                },
              }));
            }
            mutate();
          } catch (error: unknown) {
            const errorMessage =
              error &&
              typeof error === "object" &&
              "response" in error &&
              error.response &&
              typeof error.response === "object" &&
              "data" in error.response
                ? String(error.response.data)
                : "删除失败";
            message.error(errorMessage);
          }
        },
      });
    },
    [data, state.pagination.page, mutate],
  );

  // 表格列定义 - 使用 useMemo（rerender-memo）
  const columns: ColumnsType<Category> = useMemo(
    () => [
      {
        title: "分类名称",
        dataIndex: "name",
        key: "name",
        render: (name: string, record: Category) => (
          <Space>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                borderRadius: "2px",
                backgroundColor: record?.color || "#cccccc",
                border: "1px solid #d9d9d9",
              }}
            />
            <Text strong>{name}</Text>
          </Space>
        ),
      },
      {
        title: "颜色",
        dataIndex: "color",
        key: "color",
        width: 120,
        render: (color: string) => (
          <Space>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                borderRadius: "2px",
                backgroundColor: color || "#cccccc",
                border: "1px solid #d9d9d9",
              }}
            />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {color?.toUpperCase() || "N/A"}
            </Text>
          </Space>
        ),
      },
      {
        title: "文章数量",
        dataIndex: "articleCount",
        key: "articleCount",
        width: 100,
        render: (count?: number) => <AntTag color="blue">{count || 0}</AntTag>,
      },
      {
        title: "创建时间",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        title: "更新时间",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 180,
        render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        title: "操作",
        key: "actions",
        width: 120,
        fixed: "right",
        render: (_, record: Category) => {
          const articleCount = record.articleCount || 0;
          const canDelete = articleCount === 0;

          return (
            <Space>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
                disabled={!canDelete}
                title={
                  canDelete
                    ? undefined
                    : `该分类下有 ${articleCount} 篇文章，无法删除`
                }
              >
                删除
              </Button>
            </Space>
          );
        },
      },
    ],
    [handleEdit, handleDelete],
  );

  // 提交表单 - 使用 useCallback
  const handleSubmit = useCallback(
    async (data: CreateCategoryInput | UpdateCategoryInput) => {
      if (state.modalMode === "create") {
        await categoriesApi.createCategory(data as CreateCategoryInput);
      } else if (state.editingCategory) {
        await categoriesApi.updateCategory(state.editingCategory.id, data);
      }
    },
    [state.modalMode, state.editingCategory],
  );

  // Modal 关闭 - 使用 useCallback
  const handleModalCancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalVisible: false,
      editingCategory: null,
    }));
  }, []);

  const handleModalSuccess = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalVisible: false,
      editingCategory: null,
    }));
    mutate();
  }, [mutate]);

  // 搜索 - 使用 useCallback
  const handleSearch = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      searchKeyword: value,
      pagination: { ...prev.pagination, page: 1 },
    }));
  }, []);

  const handleTableChange = useCallback((pagination: TablePaginationConfig) => {
    setState((prev) => ({
      ...prev,
      pagination: {
        page: pagination.current || 1,
        pageSize: pagination.pageSize || 10,
      },
    }));
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      {/* 顶部操作区 */}
      <Space
        style={{
          marginBottom: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建分类
        </Button>
        <Search
          placeholder="搜索分类名称"
          allowClear
          style={{ width: 300 }}
          onSearch={handleSearch}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              searchKeyword: e.target.value,
            }))
          }
          value={state.searchKeyword}
        />
      </Space>

      {/* 分类列表 */}
      <Table
        columns={columns}
        dataSource={data?.data.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: state.pagination.page,
          pageSize: state.pagination.pageSize,
          total: data?.data.pagination.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ["10", "20", "50"],
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: state.searchKeyword ? "未找到匹配的分类" : "暂无分类",
        }}
      />

      {/* 创建/编辑 Modal */}
      <CategoryModal
        visible={state.modalVisible}
        mode={state.modalMode}
        category={state.editingCategory}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CategoryList;
