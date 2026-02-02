import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { AuthContext } from "./authContext";
import { authApi } from "@frontend/api/auth";

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data, isLoading, mutate } = useSWR(
    "auth-verify",
    async () => {
      try {
        const response = await authApi.verify();
        if (response.data.valid && response.data.user) {
          return {
            isAuthenticated: true,
            user: response.data.user,
          };
        }
        return {
          isAuthenticated: false,
          user: null,
        };
      } catch {
        return {
          isAuthenticated: false,
          user: null,
        };
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );

  const checkAuth = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const login = useCallback(
    async (username: string, password: string) => {
      await authApi.login({ username, password });
      await mutate();
    },
    [mutate],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    await mutate(
      {
        isAuthenticated: false,
        user: null,
      },
      false,
    );
  }, [mutate]);

  const value = useMemo(
    () => ({
      isAuthenticated: data?.isAuthenticated ?? false,
      isLoading,
      user: data?.user ?? null,
      login,
      logout,
      checkAuth,
    }),
    [data, isLoading, login, logout, checkAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
