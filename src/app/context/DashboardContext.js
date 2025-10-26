"use client";
import { createContext, useContext, useState } from "react";

const DashboardContext = createContext(null);

export const DashboardProvider = ({
  children,
  initialSelectedPage = "Active Projects",
  initialUser = null,
}) => {
  const [selectedPage, setSelectedPage] = useState(initialSelectedPage);
  const [user, setUser] = useState(initialUser);

  return (
    <DashboardContext.Provider value={{ selectedPage, setSelectedPage, user, setUser }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
};
