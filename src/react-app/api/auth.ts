import { api } from "@frontend/lib/axios";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SetupRequest {
  username: string;
  password: string;
}

export interface User {
  username: string;
  role: "admin";
}

export interface AuthResponse {
  message: string;
}

export interface VerifyResponse {
  valid: boolean;
  user?: User;
  expiresIn?: number;
  error?: string;
}

export const authApi = {
  // 登录
  login: (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data),

  // 登出
  logout: () => api.post<AuthResponse>("/auth/logout"),

  // 检查认证状态
  verify: () => api.get<VerifyResponse>("/auth/verify"),

  // 初始化管理员（注册）
  register: (data: SetupRequest) =>
    api.post<AuthResponse>("/auth/register", data),
};
