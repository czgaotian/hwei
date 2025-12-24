import { createContext } from "react";

export const AuthContext = createContext<{
  token: string;
  onLogin: () => void;
  onLogout: () => void;
}>({
  token: "",
  onLogin: () => {},
  onLogout: () => {},
});
