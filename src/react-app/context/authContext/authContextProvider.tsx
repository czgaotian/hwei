import { useState, useEffect } from "react";
import { AuthContext, User } from "./authContext";
import { authApi } from "@frontend/api/auth";

type AuthProviderProps = {
  children: React.ReactNode;
};

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  // 检查认证状态
  const checkAuth = async () => {
    try {
      const response = await authApi.verify();
      if (response.data.valid && response.data.user) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: response.data.user,
        });
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      }
    } catch (error) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  };

  // 登录
  const login = async (username: string, password: string) => {
    await authApi.login({ username, password });
    await checkAuth(); // 登录成功后重新检查状态
  };

  // 登出
  const logout = async () => {
    await authApi.logout();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  };

  // 应用启动时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    ...state,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
