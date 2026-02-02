import { api } from "@frontend/lib/axios";

export interface Article {
  id: number;
  title: string;
  subtitle?: string;
  slug: string;
  summary?: string;
  content: string;
  status: ArticleStatus;
  category: {
    id: number;
    name: string;
    color: string;
  };
  tags: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type ArticleStatus = "draft" | "published";

export interface CreateArticleInput {
  title: string;
  subtitle?: string;
  slug?: string;
  summary?: string;
  content: string;
  status: ArticleStatus;
  categoryId: number;
  tagIds: number[];
}

export interface UpdateArticleInput extends CreateArticleInput {}

export interface GetArticlesParams {
  status?: ArticleStatus;
  categoryId?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export type ArticleListResponse = PaginatedResponse<Article>;

export const articlesApi = {
  // 获取文章列表
  getArticles: (params?: GetArticlesParams) =>
    api.get<ArticleListResponse>("/articles", { params }),

  // 获取单个文章
  getArticle: (id: number) => api.get<Article>(`/articles/${id}`),

  // 创建文章
  createArticle: (data: CreateArticleInput) =>
    api.post<Article>("/articles", data),

  // 更新文章
  updateArticle: (id: number, data: UpdateArticleInput) =>
    api.patch<Article>(`/articles/${id}`, data),

  // 删除文章
  deleteArticle: (id: number) => api.delete(`/articles/${id}`),
};
