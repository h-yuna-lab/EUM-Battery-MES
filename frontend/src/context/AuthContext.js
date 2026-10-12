// 사용자 인증 상태를 관리하는 Context Provider
import { createContext, useCallback, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // 세션/쿠키 기반이므로 토큰을 직접 들고 있지 않는다.
  // 로그인 성공 여부와 최소한의 사용자 정보만 상태로 관리한다.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/api/mes/auth/me");
      setUser(data);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = (userInfo) => {
    setUser(userInfo);
    setIsAuthenticated(true);
    setIsAuthLoading(false);
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/api/mes/auth/logout");
    } catch (error) {
      console.warn("서버 로그아웃 요청에 실패했습니다.", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        user,
        login,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
