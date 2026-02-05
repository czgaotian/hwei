import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import useSWR from "swr";
import {
  Button,
  Table,
  Input,
  Select,
  Space,
  Tag,
  Badge,
  Modal,
  message,
  Skeleton,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import {
  articlesApi,
  Article,
  ArticleStatus,
  GetArticlesParams,
} from "@frontend/api/articles";
import { categoriesApi } from "@frontend/api/categories";

const { Search } = Input;

// 常量配置
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = ["10", "20", "50"];
const DATE_FORMAT = "YYYY-MM-DD HH:mm";

const ArticleList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pagination, setPagination] = useState(() => ({
    current: Number(searchParams.get("page")) || DEFAULT_PAGE,
    pageSize: Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
    total: 0,
  }));
  const [filters, setFilters] = useState<{
    status?: ArticleStatus;
    categoryId?: number;
    keyword?: string;
  }>(() => ({
    status: (searchParams.get("status") as ArticleStatus) || undefined,
    categoryId: searchParams.get("categoryId")
      ? Number(searchParams.get("categoryId"))
      : undefined,
    keyword: searchParams.get("keyword") || undefined,
  }));

  // 使用 SWR 获取分类列表
  const { data: categoriesData } = useSWR(
    "/api/categories",
    async () => {
      const response = await categoriesApi.getCategories({
        page: 1,
        pageSize: 100,
      });
      return response.data.data;
    },
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error("Failed to load categories:", error);
        message.error("加载分类列表失败");
      },
    },
  );

  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  // 构建 SWR 键 - 使用 useMemo 避免不必要的重新计算
  const swrKey = useMemo(
    () =>
      JSON.stringify({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagination.current, pagination.pageSize, filters],
  );

  // 使用 SWR 获取文章列表
  const {
    data: articlesResponse,
    isLoading,
    mutate: mutateArticles,
  } = useSWR(
    [swrKey, "/api/articles"],
    async () => {
      const params: GetArticlesParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      };
      const response = await articlesApi.getArticles(params);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
        }));
      },
      onError: (error) => {
        console.error("Failed to load articles:", error);
        message.error("加载文章列表失败");
      },
    },
  );

  const articles = articlesResponse?.data || [];

  // 缓存分类选项
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: <Tag color={category.color}>{category.name}</Tag>,
      })),
    [categories],
  );

  useEffect(() => {
    const urlParams: Record<string, string> = {
      page: String(pagination.current),
      pageSize: String(pagination.pageSize),
    };
    if (filters.status) urlParams.status = filters.status;
    if (filters.categoryId) urlParams.categoryId = String(filters.categoryId);
    if (filters.keyword) urlParams.keyword = filters.keyword;
    setSearchParams(urlParams);
  }, [pagination, filters, setSearchParams]);

  // 处理筛选变化
  const handleFilterChange = useCallback(
    (key: keyof typeof filters, value: string | number | undefined) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPagination((prev) => ({ ...prev, current: DEFAULT_PAGE }));
    },
    [],
  );

  // 重置筛选
  const handleResetFilters = useCallback(() => {
    setFilters({});
    setPagination((prev) => ({ ...prev, current: DEFAULT_PAGE }));
  }, []);

  // 处理删除
  const handleDelete = useCallback(
    (article: Article) => {
      Modal.confirm({
        title: "确认删除",
        content: `确定要删除文章「${article.title}」吗？此操作不可撤销。`,
        okText: "确定",
        okType: "danger",
        cancelText: "取消",
        onOk: async () => {
          try {
            await articlesApi.deleteArticle(article.id);
            message.success("删除成功");
            // 如果当前页只有一条数据且不是第一页，则跳转到上一页
            if (articles.length === 1 && pagination.current > DEFAULT_PAGE) {
              setPagination((prev) => ({
                ...prev,
                current: prev.current - 1,
              }));
            } else {
              // 使用 mutate 重新验证数据
              mutateArticles();
            }
          } catch (error) {
            console.error("Failed to delete article:", error);
            message.error("删除失败");
          }
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [articles.length, pagination.current, mutateArticles],
  );

  // 表格列定义
  const columns: ColumnsType<Article> = useMemo(
    () => [
      {
        title: "标题",
        dataIndex: "title",
        key: "title",
        render: (text: string, record: Article) => (
          <a onClick={() => navigate(`/articles/${record.id}/edit`)}>{text}</a>
        ),
      },
      {
        title: "分类",
        dataIndex: "category",
        key: "category",
        render: (category: Article["category"]) =>
          category ? (
            <Tag color={category?.color || undefined}>{category.name}</Tag>
          ) : "-",
      },
      {
        title: "标签",
        dataIndex: "tags",
        key: "tags",
        render: (tags: Article["tags"]) => (
          <Space>
            {tags && tags.length > 0 ? (
              tags.map((tag) => (
                <Tag key={tag.id} color={tag?.color || undefined}>
                  {tag.name}
                </Tag>
              ))
            ) : "-"}
          </Space>
        ),
      },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        render: (status: ArticleStatus) => (
          <Badge
            status={status === "published" ? "success" : "default"}
            text={status === "published" ? "已发布" : "草稿"}
          />
        ),
      },
      {
        title: "创建时间",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date: string) => dayjs(date).format(DATE_FORMAT),
      },
      {
        title: "更新时间",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (date: string) => dayjs(date).format(DATE_FORMAT),
      },
      {
        title: "操作",
        key: "actions",
        render: (_: unknown, record: Article) => (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/articles/${record.id}/edit`)}
            >
              编辑
            </Button>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [navigate, handleDelete],
  );

  // 处理表格分页变化
  const handleTableChange = useCallback((pagination: TablePaginationConfig) => {
    setPagination({
      current: pagination.current || DEFAULT_PAGE,
      pageSize: pagination.pageSize || DEFAULT_PAGE_SIZE,
      total: pagination.total || 0,
    });
  }, []);

  // 使用 useMemo 缓存分页配置
  const paginationConfig = useMemo(
    () => ({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => `共 ${total} 条`,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pagination.current, pagination.pageSize, pagination.total],
  );

  return (
    <div style={{ padding: "24px" }}>
      {/* 顶部操作区 */}
      <Space
        orientation="vertical"
        size="large"
        style={{ display: "flex", marginBottom: 16 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0 }}>文章管理</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/articles/new")}
          >
            新建文章
          </Button>
        </div>

        {/* 筛选器区域 */}
        <Space wrap>
          <Select
            style={{ width: 120 }}
            placeholder="状态筛选"
            allowClear
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
          >
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="published">已发布</Select.Option>
          </Select>
          <Select
            style={{ width: 150 }}
            placeholder="分类筛选"
            allowClear
            value={filters.categoryId}
            onChange={(value) => handleFilterChange("categoryId", value)}
            options={categoryOptions}
          />
          <Search
            placeholder="搜索标题"
            allowClear
            style={{ width: 250 }}
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
            onSearch={(value) => handleFilterChange("keyword", value)}
            prefix={<SearchOutlined />}
          />
          <Button onClick={handleResetFilters}>重置</Button>
        </Space>
      </Space>

      {/* 文章列表表格 */}
      {isLoading && !articles.length ? (
        <Skeleton active />
      ) : (
        <Table
          columns={columns}
          dataSource={articles}
          rowKey="id"
          pagination={paginationConfig}
          loading={isLoading}
          onChange={handleTableChange}
          scroll={{ x: "max-content" }}
        />
      )}
    </div>
  );
};

export default ArticleList;
