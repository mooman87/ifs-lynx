"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { DashboardProvider, useDashboard } from "@/app/context/DashboardContext";

function AuthWrapper({ children }) {
  const { setUser, selectedPage, setSelectedPage } = useDashboard(); 
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      if (pathname === "/") {
        setIsAuthenticated(true);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();

        if (!res.ok || !data.user) {
          if (!cancelled) {
            setIsAuthenticated(false);
            router.push("/");
          }
          return;
        }

        if (cancelled) return;

        setUser(data.user);
        setIsAuthenticated(true);

        if (
          data.user.role === "Super Admin" &&
          selectedPage === "Active Projects"
        ) {
          setSelectedPage("Super Admin");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (!cancelled) {
          setIsAuthenticated(false);
          router.push("/");
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, setUser, selectedPage, setSelectedPage]);

  if (pathname !== "/" && isAuthenticated === null) return null;

  return children;
}

function Shell({ children }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/";

  if (hideSidebar) {
    return children;
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}

export default function ClientLayout({ children }) {
  return (
    <DashboardProvider>
      <AuthWrapper>
        <Shell>{children}</Shell>
      </AuthWrapper>
    </DashboardProvider>
  );
}
