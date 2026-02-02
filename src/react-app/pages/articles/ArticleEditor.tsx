import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import {
  Button,
  Input,
  Form,
  Select,
  Radio,
  Card,
  Space,
  message,
  Spin,
  Modal,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  articlesApi,
  ArticleStatus,
  CreateArticleInput,
} from "@frontend/api/articles";
import { categoriesApi } from "@frontend/api/categories";
import { tagsApi } from "@frontend/api/tags";
import TiptapEditor from "@frontend/components/TiptapEditor/TiptapEditor";

const { TextArea } = Input;

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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
    { revalidateOnFocus: false },
  );

  // 使用 SWR 获取标签列表
  const { data: tagsData } = useSWR(
    "/api/tags",
    async () => {
      const response = await tagsApi.getTags({ page: 1, pageSize: 100 });
      return response.data.data;
    },
    { revalidateOnFocus: false },
  );

  // 使用 SWR 获取文章详情（仅在编辑模式下）
  const {
    data: articleData,
    error: articleError,
    isLoading: isLoadingArticle,
    mutate: mutateArticle,
  } = useSWR(
    isEditMode && id ? `/api/articles/${id}` : null,
    async () => {
      const response = await articlesApi.getArticle(Number(id));
      return response.data;
    },
    {
      revalidateOnFocus: false,
      onSuccess: (article) => {
        form.setFieldsValue({
          title: article.title,
          summary: article.summary || "",
          content: article.content,
          status: article.status,
          categoryId: article.category.id,
          tagIds: article.tags.map((tag) => tag.id),
        });
      },
    },
  );

  const categories = categoriesData || [];
  const tags = tagsData || [];

  // 处理文章加载错误
  useEffect(() => {
    if (articleError) {
      message.error("加载文章失败");
      navigate("/articles");
    }
  }, [articleError, navigate]);

  // 新建模式：设置默认值
  useEffect(() => {
    if (!isEditMode) {
      form.setFieldsValue({
        status: "draft",
        content: "",
        tagIds: [],
      });
    }
  }, [isEditMode, form]);

  // 监听表单变化
  const handleFormChange = useCallback(() => {
    setIsDirty(true);
  }, []);

  // 返回确认
  const handleBack = useCallback(() => {
    if (isDirty) {
      Modal.confirm({
        title: "确认离开",
        content: "内容尚未保存，确定要离开吗？",
        okText: "确定",
        cancelText: "取消",
        onOk: () => navigate("/articles"),
      });
    } else {
      navigate("/articles");
    }
  }, [isDirty, navigate]);

  // 保存文章
  const handleSave = useCallback(
    async (status: ArticleStatus) => {
      try {
        await form.validateFields();
        const values = form.getFieldsValue();
        const data: CreateArticleInput = {
          ...values,
          status,
        };

        setSaving(true);
        try {
          if (isEditMode && id) {
            await articlesApi.updateArticle(Number(id), data);
            message.success(
              status === "draft" ? "草稿保存成功" : "文章发布成功",
            );
            setIsDirty(false);
            if (status === "published") {
              navigate("/articles");
            } else {
              // 使用 mutate 重新验证文章数据
              mutateArticle();
            }
          } else {
            const response = await articlesApi.createArticle(data);
            message.success(
              status === "draft" ? "草稿保存成功" : "文章发布成功",
            );
            setIsDirty(false);
            if (status === "published") {
              navigate("/articles");
            } else {
              // 跳转到编辑页
              navigate(`/articles/${response.data.id}/edit`, { replace: true });
            }
          }
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          message.error(err.response?.data?.message || "保存失败");
        } finally {
          setSaving(false);
        }
      } catch {
        // 表单验证失败
        message.error("请检查表单填写");
      }
    },
    [form, isEditMode, id, navigate, mutateArticle],
  );

  if (isLoadingArticle) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* 顶部操作栏 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回
          </Button>
          <h1 style={{ margin: 0 }}>{isEditMode ? "编辑文章" : "新建文章"}</h1>
        </Space>
        <Space>
          <Button
            onClick={() => handleSave("draft")}
            loading={saving}
            disabled={saving}
          >
            保存草稿
          </Button>
          <Button
            type="primary"
            onClick={() => handleSave("published")}
            loading={saving}
            disabled={saving}
          >
            发布
          </Button>
        </Space>
      </div>

      {/* 主编辑区 */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
        style={{ display: "flex", gap: 24 }}
      >
        {/* 左侧：内容编辑区 */}
        <div style={{ flex: "1 1 70%", minWidth: 0 }}>
          <Card>
            <Form.Item
              label="标题"
              name="title"
              rules={[
                { required: true, message: "请输入文章标题" },
                { max: 200, message: "标题不能超过 200 个字符" },
              ]}
            >
              <Input placeholder="请输入文章标题" size="large" />
            </Form.Item>

            <Form.Item
              label="摘要"
              name="summary"
              rules={[{ max: 500, message: "摘要不能超过 500 个字符" }]}
            >
              <TextArea
                placeholder="请输入文章摘要（可选）"
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>

            <Form.Item
              label="正文"
              name="content"
              rules={[{ required: true, message: "请输入文章内容" }]}
            >
              <TiptapEditor placeholder="开始编写文章内容..." />
            </Form.Item>
          </Card>
        </div>

        {/* 右侧：元信息面板 */}
        <div style={{ flex: "0 0 30%", minWidth: 280 }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {/* 发布设置 */}
            <Card title="发布设置" size="small">
              <Form.Item label="状态" name="status">
                <Radio.Group>
                  <Radio value="draft">草稿</Radio>
                  <Radio value="published">已发布</Radio>
                </Radio.Group>
              </Form.Item>
              {isEditMode && articleData && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#666" }}>创建时间：</span>
                    {dayjs(articleData.createdAt).format("YYYY-MM-DD HH:mm")}
                  </div>
                  <div>
                    <span style={{ color: "#666" }}>更新时间：</span>
                    {dayjs(articleData.updatedAt).format("YYYY-MM-DD HH:mm")}
                  </div>
                </>
              )}
            </Card>

            {/* Slug 设置 */}
            <Card title="URL Slug" size="small">
              <Form.Item
                name="slug"
                rules={[
                  { max: 255, message: "Slug 不能超过 255 个字符" },
                  {
                    pattern: /^[a-z0-9\u4e00-\u9fa5]+(?:-[a-z0-9\u4e00-\u9fa5]+)*$/,
                    message: "Slug 只能包含小写字母、数字、中文和连字符",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="文章的 URL 标识符，留空则自动从标题生成" />
              </Form.Item>
            </Card>

            {/* 分类设置 */}
            <Card title="分类" size="small">
              <Form.Item
                name="categoryId"
                rules={[{ required: true, message: "请选择文章分类" }]}
                style={{ marginBottom: 0 }}
              >
                <Select placeholder="选择分类">
                  {categories.map((category) => (
                    <Select.Option key={category.id} value={category.id}>
                      <Space>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: category.color,
                          }}
                        />
                        {category.name}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>

            {/* 标签设置 */}
            <Card title="标签" size="small">
              <Form.Item name="tagIds" style={{ marginBottom: 0 }}>
                <Select mode="multiple" placeholder="选择标签（可选）">
                  {tags.map((tag) => (
                    <Select.Option key={tag.id} value={tag.id}>
                      <Space>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: tag.color,
                          }}
                        />
                        {tag.name}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default ArticleEditor;
