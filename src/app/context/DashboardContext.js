"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const searchParams = useSearchParams();
  const initialPage = searchParams.get("selectedPage") || "Active Projects";
  const [selectedPage, setSelectedPage] = useState(initialPage);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentPage = searchParams.get("selectedPage") || "Active Projects";
    setSelectedPage(currentPage);
  }, [searchParams]);

  return (
    <DashboardContext.Provider value={{ selectedPage, setSelectedPage, user, setUser }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
