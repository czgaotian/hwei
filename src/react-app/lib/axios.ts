import axios from "axios";

// 创建 axios 实例
export const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: true, // 重要：允许携带 Cookie
});

// 响应拦截器：处理 401 未授权
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 失效，跳转到登录页
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/setup") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
