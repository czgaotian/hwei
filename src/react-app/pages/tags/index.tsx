import React, { useState, useEffect } from "react";
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
import {
  tagsApi,
  Tag,
  CreateTagInput,
  UpdateTagInput,
} from "@frontend/api/tags";
import TagModal from "./TagModal";
import dayjs from "dayjs";

const { Search } = Input;
const { Text } = Typography;

interface TagListState {
  tags: Tag[];
  loading: boolean;
  searchKeyword: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  modalVisible: boolean;
  modalMode: "create" | "edit";
  editingTag: Tag | null;
}

const TagList: React.FC = () => {
  const [state, setState] = useState<TagListState>({
    tags: [],
    loading: false,
    searchKeyword: "",
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    },
    modalVisible: false,
    modalMode: "create",
    editingTag: null,
  });

  // 加载标签列表
  const loadTags = async (
    page = state.pagination.page,
    pageSize = state.pagination.pageSize,
    search = state.searchKeyword,
  ) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await tagsApi.getTags({
        page,
        pageSize,
        search: search || undefined,
      });
      setState((prev) => ({
        ...prev,
        tags: response.data.data,
        pagination: response.data.pagination,
        loading: false,
      }));
    } catch (error) {
      message.error("加载标签列表失败");
      console.error(error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  // 初始加载
  useEffect(() => {
    loadTags();
  }, []);

  // 搜索处理（带防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.searchKeyword !== undefined) {
        loadTags(1, state.pagination.pageSize, state.searchKeyword);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [state.searchKeyword]);

  // 表格列定义
  const columns: ColumnsType<Tag> = [
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
  ];

  // 打开新建标签 Modal
  const handleCreate = () => {
    setState((prev) => ({
      ...prev,
      modalVisible: true,
      modalMode: "create",
      editingTag: null,
    }));
  };

  // 打开编辑标签 Modal
  const handleEdit = (tag: Tag) => {
    setState((prev) => ({
      ...prev,
      modalVisible: true,
      modalMode: "edit",
      editingTag: tag,
    }));
  };

  // 删除标签
  const handleDelete = (tag: Tag) => {
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

          // 如果当前页没有数据了，跳转到上一页
          if (state.tags.length === 1 && state.pagination.page > 1) {
            loadTags(state.pagination.page - 1);
          } else {
            loadTags();
          }
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
  };

  // 提交表单
  const handleSubmit = async (data: CreateTagInput | UpdateTagInput) => {
    if (state.modalMode === "create") {
      await tagsApi.createTag(data as CreateTagInput);
    } else if (state.editingTag) {
      await tagsApi.updateTag(state.editingTag.id, data);
    }
  };

  // Modal 关闭
  const handleModalCancel = () => {
    setState((prev) => ({
      ...prev,
      modalVisible: false,
      editingTag: null,
    }));
  };

  // Modal 成功
  const handleModalSuccess = () => {
    setState((prev) => ({
      ...prev,
      modalVisible: false,
      editingTag: null,
    }));
    loadTags();
  };

  // 搜索
  const handleSearch = (value: string) => {
    setState((prev) => ({
      ...prev,
      searchKeyword: value,
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  // 分页变化
  const handleTableChange = (pagination: TablePaginationConfig) => {
    loadTags(pagination.current || 1, pagination.pageSize || 10);
  };

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
        dataSource={state.tags}
        loading={state.loading}
        rowKey="id"
        pagination={{
          current: state.pagination.page,
          pageSize: state.pagination.pageSize,
          total: state.pagination.total,
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
