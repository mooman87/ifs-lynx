"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { DashboardProvider, useDashboard } from "@/app/context/DashboardContext";

function AuthWrapper({ children }) {
  const { setUser } = useDashboard();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      if (pathname === "/") {
        setIsAuthenticated(true);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push("/");
        }
      } catch (error) {
        setIsAuthenticated(false);
        router.push("/");
      }
    };

    checkAuth();
  }, [router, pathname, setUser]);

  if (pathname !== "/" && isAuthenticated === null) return null;

  return children;
}

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/";

  return (
    <DashboardProvider>
      <AuthWrapper>
        <div className="flex">
          {!hideSidebar && <Sidebar />}
          <div className="flex-1 p-6">{children}</div>
        </div>
      </AuthWrapper>
    </DashboardProvider>
  );
}
