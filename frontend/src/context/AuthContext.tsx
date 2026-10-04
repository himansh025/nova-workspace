"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  avatar: string;
  initials: string;
  createdAt?: string;
}

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    const activeOrgId = localStorage.getItem("nova_active_org_id");
    
    // Only apply x-organization-id to internal /api routes
    if (activeOrgId && typeof resource === "string" && resource.startsWith("/api")) {
      if (!config) config = {};
      if (!config.headers) config.headers = {};
      if (config.headers instanceof Headers) {
        config.headers.set("x-organization-id", activeOrgId);
      } else {
        (config.headers as Record<string, string>)["x-organization-id"] = activeOrgId;
      }
    }
    return originalFetch(resource, config);
  };
}


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    organization?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nova_user");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleSetUser = (u: User | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) {
        localStorage.setItem("nova_user", JSON.stringify(u));
      } else {
        localStorage.removeItem("nova_user");
        localStorage.removeItem("nova_token");
      }
    }
  };

  // Inspect session on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch("/api/auth/me", {
      credentials: "include",
      headers,
    })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.authenticated && data.user) {
          handleSetUser(data.user);
        } else {
          // If server explicitly rejects session, clear
          if (!data || data.authenticated === false) {
            handleSetUser(null);
          }
        }
      })
      .catch(() => {
        // Network offline - retain local user session
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Login failed" };
      }
      if (typeof window !== "undefined") {
        if (data.sessionToken || data.token) {
          localStorage.setItem("nova_token", data.sessionToken || data.token);
        }
      }
      handleSetUser(data.user);
      router.push("/app");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Login request failed" };
    }
  };

  const signup = async (formData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    organization?: string;
  }) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Signup failed" };
      }
      if (typeof window !== "undefined") {
        if (data.sessionToken || data.token) {
          localStorage.setItem("nova_token", data.sessionToken || data.token);
        }
      }
      handleSetUser(data.user);
      router.push("/app");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Signup request failed" };
    }
  };

  const logout = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nova_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers,
      });
    } catch {}
    handleSetUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, setUser: handleSetUser }}>
      {children}
    </AuthContext.Provider>
  );
};
