import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import config from "../config/env";

interface User {
  id: string;
  username: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTokens = localStorage.getItem("auth_tokens");
    const storedUser = localStorage.getItem("auth_user");

    if (storedTokens && storedUser) {
      try {
        setTokens(JSON.parse(storedTokens));
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error(error);
        localStorage.removeItem("auth_tokens");
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch(`${config.apiBaseUrl}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    const newTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
    const newUser = {
      id: data.user.id,
      username: data.user.username,
    };

    setTokens(newTokens);
    setUser(newUser);
    localStorage.setItem("auth_tokens", JSON.stringify(newTokens));
    localStorage.setItem("auth_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem("auth_tokens");
    localStorage.removeItem("auth_user");
  };

  const isAuthenticated = !!user && !!tokens;

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        login,
        logout,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
