import { api } from "@frontend/lib/axios";

export interface Category {
  id: number;
  name: string;
  color: string;
  articleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
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

export type CategoryListResponse = PaginatedResponse<Category>;

export const categoriesApi = {
  // 获取分类列表（分页）
  getCategories: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }) => api.get<CategoryListResponse>("/categories", { params }),

  // 获取单个分类
  getCategory: (id: number) => api.get<Category>(`/categories/${id}`),

  // 创建分类
  createCategory: (data: CreateCategoryInput) =>
    api.post<Category>("/categories", data),

  // 更新分类
  updateCategory: (id: number, data: UpdateCategoryInput) =>
    api.put<Category>(`/categories/${id}`, data),

  // 删除分类
  deleteCategory: (id: number) => api.delete<Category>(`/categories/${id}`),
};
