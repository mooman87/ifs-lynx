"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDashboard } from "@/app/context/DashboardContext";
import { useSearchParams } from "next/navigation";
import ActiveProjects from "../components/ActiveProjects";
import EmployeeList from "../components/EmployeeList";
import TravelManagement from "../components/TravelManagement";
import Resources from "../components/Resources";
import UpdateUser from "../components/UpdateUser";
import SuperAdmin from "../components/SuperAdmin";
import CreateUser from "../components/CreateUser";
import OrganizationBillingSettings from "../components/OrganizationBillingSettings";
import "./dashboard.css";

const getDefaultSelectedPage = (user) =>
  user?.role === "Super Admin" ? "Admin Dashboard" : "Active Projects";

const DashboardClient = () => {
  const { selectedPage, setSelectedPage, user } = useDashboard();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("orgSlug") || "";
  const qpSelectedPage = searchParams.get("selectedPage");

  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [employeesPerPage] = useState(5);
  const [projectsPerPage] = useState(5);
  const [isClient, setIsClient] = useState(false);

  const userRole = user?.role || "";
  const defaultSelectedPage = getDefaultSelectedPage(user);

  const effectivePage = qpSelectedPage || selectedPage || defaultSelectedPage;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    const nextPage = qpSelectedPage || defaultSelectedPage;
    if (nextPage && nextPage !== selectedPage) {
      setSelectedPage(nextPage);
    }
  }, [
    qpSelectedPage,
    defaultSelectedPage,
    selectedPage,
    setSelectedPage,
    user,
  ]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/resources", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const qs = orgSlug ? `?orgSlug=${encodeURIComponent(orgSlug)}` : "";
      const res = await fetch(`/api/project${qs}`, {
        credentials: "include",
      });

      if (!res.ok) {
        let message = "No projects found.";
        try {
          const data = await res.json();
          message = data.message || message;
        } catch {
          // ignore
        }
        setProjects([]);
        setErrorMessage(message);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data.projects) && data.projects.length > 0) {
        setProjects(data.projects);
        setErrorMessage("");
      } else {
        setProjects([]);
        setErrorMessage("No projects found.");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      setErrorMessage("Unable to load projects right now.");
    }
  }, [orgSlug]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employee", {
        credentials: "include",
      });
      const data = await res.json();

      if (
        res.ok &&
        Array.isArray(data.employees) &&
        data.employees.length > 0
      ) {
        setEmployees(data.employees);
        setErrorMessage("");
      } else {
        setEmployees([]);
        setErrorMessage("No staff found.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
      setErrorMessage("An unexpected error occurred.");
    }
  }, []);

  useEffect(() => {
    if (!isClient || !user) return;

    if (effectivePage === "Active Projects") {
      fetchProjects();
    } else if (effectivePage === "Staff") {
      fetchEmployees();
    } else if (effectivePage === "Resources") {
      fetchDocuments();
    }
  }, [
    isClient,
    user,
    effectivePage,
    orgSlug,
    fetchProjects,
    fetchEmployees,
    fetchDocuments,
  ]);

  if (!isClient) return null;

  const renderPage = () => {
    switch (effectivePage) {
      case "Admin Dashboard":
        return <SuperAdmin user={user} />;

      case "Active Projects":
        return (
          <ActiveProjects
            user={user}
            projects={projects}
            setProjects={setProjects}
            fetchProjects={fetchProjects}
            errorMessage={errorMessage}
            projectsPerPage={projectsPerPage}
            orgSlug={orgSlug}
          />
        );

      case "Staff":
        return (
          <EmployeeList
            employees={employees}
            setEmployees={setEmployees}
            errorMessage={errorMessage}
            fetchEmployees={fetchEmployees}
            employeesPerPage={employeesPerPage}
          />
        );

      case "Travel Management":
        return <TravelManagement />;

      case "Resources":
        return (
          <Resources
            documents={documents}
            fetchDocuments={fetchDocuments}
            userRole={userRole}
          />
        );

      case "Manage Profile":
        return <UpdateUser />;

      case "Create Staff User":
        return <CreateUser />;

      case "Billing":
        return <OrganizationBillingSettings />;

      default:
        return userRole === "Super Admin" ? (
          <SuperAdmin user={user} />
        ) : (
          <ActiveProjects
            user={user}
            projects={projects}
            setProjects={setProjects}
            fetchProjects={fetchProjects}
            errorMessage={errorMessage}
            projectsPerPage={projectsPerPage}
            orgSlug={orgSlug}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 h-full overflow-auto">{renderPage()}</div>
    </div>
  );
};

export default DashboardClient;
