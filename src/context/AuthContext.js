import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password, captcha) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
      captchaId: captcha?.captchaId,
      captchaAnswer: captcha?.captchaAnswer,
    });
    if (data.requires2FA) return data; // caller must complete the 2FA step
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  const finalizeSession = (token, user) => {
    localStorage.setItem("token", token);
    setUser(user);
  };

  const register = async (name, email, password, referralCode) => {
    const { data } = await api.post("/auth/register", { name, email, password, referralCode });
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const refreshUser = loadUser;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, finalizeSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
