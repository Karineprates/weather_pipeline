// src/context/AuthProvider.tsx
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../lib/api";
import { AuthContext, type User } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setAuthToken(token);
        const res = await api.get("/auth/me");
        setUser(res.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const token = res.data.access_token;

    setAuthToken(token);
    localStorage.setItem("token", token);
    const me = await api.get("/auth/me");
    setUser(me.data);
  }

  function logout() {
    setAuthToken(null);
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
