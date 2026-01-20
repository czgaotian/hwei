import { useState, useEffect, useCallback, useMemo } from "react";
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
  // 使用惰性初始化（rerender-lazy-state-init）
  const [state, setState] = useState<AuthState>(() => ({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  }));

  // 检查认证状态 - 使用 useCallback
  const checkAuth = useCallback(async () => {
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
  }, []);

  // 登录 - 使用 useCallback
  const login = useCallback(
    async (username: string, password: string) => {
      await authApi.login({ username, password });
      await checkAuth(); // 登录成功后重新检查状态
    },
    [checkAuth],
  );

  // 登出 - 使用 useCallback
  const logout = useCallback(async () => {
    await authApi.logout();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  }, []);

  // 应用启动时检查认证状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 使用 useMemo 缓存 context value（rerender-memo）
  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      checkAuth,
    }),
    [state, login, logout, checkAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
