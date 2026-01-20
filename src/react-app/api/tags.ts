import { api } from "@frontend/lib/axios";

export interface Tag {
  id: number;
  name: string;
  color: string;
  articleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagInput {
  name: string;
  color: string;
}

export interface UpdateTagInput {
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

export type TagListResponse = PaginatedResponse<Tag>;

export const tagsApi = {
  // 获取标签列表（分页）
  getTags: (params?: { page?: number; pageSize?: number; search?: string }) =>
    api.get<TagListResponse>("/tags", { params }),

  // 获取单个标签
  getTag: (id: number) => api.get<Tag>(`/tags/${id}`),

  // 创建标签
  createTag: (data: CreateTagInput) => api.post<Tag>("/tags", data),

  // 更新标签
  updateTag: (id: number, data: UpdateTagInput) =>
    api.put<Tag>(`/tags/${id}`, data),

  // 删除标签
  deleteTag: (id: number) => api.delete<Tag>(`/tags/${id}`),
};
