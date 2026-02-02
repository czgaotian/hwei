import axios from "axios";
import { message } from "antd";

// 创建 axios 实例
export const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: true, // 重要：允许携带 Cookie
});

// 响应拦截器：处理 401 未授权及其他错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 服务器返回了状态码，但不在 2xx 范围内
      if (error.response.status === 401) {
        // Token 失效，跳转到登录页
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/setup") {
          window.location.href = "/login";
        }
      } else {
        // 其他服务器错误，显示后端返回的错误信息或通用提示
        const errorMsg = error.response.data?.message || "服务器请求出错";
        message.error(errorMsg);
      }
    } else {
      // 网络错误（无响应）或请求配置错误
      message.error("网络连接失败，请检查您的网络");
    }
    return Promise.reject(error);
  },
);
