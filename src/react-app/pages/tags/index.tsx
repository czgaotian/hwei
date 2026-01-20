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
import { tagsApi } from "@frontend/api/tags";
import type { Tag, CreateTagInput, UpdateTagInput } from "@frontend/api/tags";
import TagModal from "./TagModal";
import dayjs from "dayjs";

const { Search } = Input;
const { Text } = Typography;

interface TagListState {
  searchKeyword: string;
  pagination: {
    page: number;
    pageSize: number;
  };
  modalVisible: boolean;
  modalMode: "create" | "edit";
  editingTag: Tag | null;
}

const TagList: React.FC = () => {
  const [state, setState] = useState<TagListState>(() => ({
    searchKeyword: "",
    pagination: {
      page: 1,
      pageSize: 10,
    },
    modalVisible: false,
    modalMode: "create",
    editingTag: null,
  }));

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading, mutate } = useSWR(
    ["tags", state.pagination.page, state.pagination.pageSize, debouncedSearch],
    ([, page, pageSize, search]) =>
      tagsApi.getTags({
        page,
        pageSize,
        search: search || undefined,
      }),
    {
      revalidateOnFocus: false,
      onError: () => {
        message.error("加载标签列表失败");
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

  // 打开新建标签 Modal - 使用 useCallback
  const handleCreate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalVisible: true,
      modalMode: "create",
      editingTag: null,
    }));
  }, []);

  // 打开编辑标签 Modal - 使用 useCallback
  const handleEdit = useCallback((tag: Tag) => {
    setState((prev) => ({
      ...prev,
      modalVisible: true,
      modalMode: "edit",
      editingTag: tag,
    }));
  }, []);

  // 删除标签 - 使用 useCallback
  const handleDelete = useCallback(
    (tag: Tag) => {
      const articleCount = tag.articleCount || 0;
      const content =
        articleCount > 0
          ? `该标签关联了 ${articleCount} 篇文章，删除后文章将失去该标签，确定要删除吗？`
          : `确定要删除标签「${tag.name}」吗？此操作不可撤销。`;

      Modal.confirm({
        title: "确认删除",
        icon: <ExclamationCircleOutlined />,
        content,
        okText: "确定",
        okType: "danger",
        cancelText: "取消",
        onOk: async () => {
          try {
            await tagsApi.deleteTag(tag.id);
            message.success("标签删除成功");

            const currentTags = data?.data.data || [];
            const shouldGoBack =
              currentTags.length === 1 && state.pagination.page > 1;
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
  const columns: ColumnsType<Tag> = useMemo(
    () => [
      {
        title: "标签名称",
        dataIndex: "name",
        key: "name",
        render: (name: string, record: Tag) => (
          <Space>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                borderRadius: "2px",
                backgroundColor: record.color,
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
                backgroundColor: color,
                border: "1px solid #d9d9d9",
              }}
            />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {color.toUpperCase()}
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
        render: (_, record: Tag) => (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            >
              编辑
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              size="small"
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [handleEdit, handleDelete],
  );

  // 提交表单 - 使用 useCallback
  const handleSubmit = useCallback(
    async (data: CreateTagInput | UpdateTagInput) => {
      if (state.modalMode === "create") {
        await tagsApi.createTag(data as CreateTagInput);
      } else if (state.editingTag) {
        await tagsApi.updateTag(state.editingTag.id, data);
      }
    },
    [state.modalMode, state.editingTag],
  );

  // Modal 关闭 - 使用 useCallback
  const handleModalCancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalVisible: false,
      editingTag: null,
    }));
  }, []);

  const handleModalSuccess = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalVisible: false,
      editingTag: null,
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
          新建标签
        </Button>
        <Search
          placeholder="搜索标签名称"
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

      {/* 标签列表 */}
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
          emptyText: state.searchKeyword ? "未找到匹配的标签" : "暂无标签",
        }}
      />

      {/* 创建/编辑 Modal */}
      <TagModal
        visible={state.modalVisible}
        mode={state.modalMode}
        tag={state.editingTag}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default TagList;
