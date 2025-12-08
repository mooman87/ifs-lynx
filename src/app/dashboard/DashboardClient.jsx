"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/app/context/DashboardContext";
import { useRouter } from "next/navigation";
import ActiveProjects from "../components/ActiveProjects";
import EmployeeList from "../components/EmployeeList";
import TravelManagement from "../components/TravelManagement";
import Resources from "../components/Resources";
import CreateUser from "../components/CreateUser";
import UpdateUser from "../components/UpdateUser";
import SuperAdmin from "../components/SuperAdmin";
import "./dashboard.css";

const DashboardClient = () => {
  const { selectedPage, user } = useDashboard();
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [employeesPerPage] = useState(5);
  const [projectsPerPage] = useState(5);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const userRole = user?.role || "";
  const fullName = user?.fullName || "";
  const orgType = user?.organization?.orgType || user?.organization?.settings?.orgType || null;
  const orgSlug = user?.organization?.slug || null;

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/resources");
      const data = await res.json();
      if (res.ok) setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/project');
      const data = await res.json();
      if (res.ok && data.projects.length > 0) {
        setProjects(data.projects);
        setErrorMessage('');
      } else {
        setErrorMessage('No projects found.');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setErrorMessage('No projects found.');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employee');
      const data = await res.json();
      if (res.ok && data.employees && data.employees.length > 0) {
        setEmployees(data.employees);
        setErrorMessage('');
      } else {
        setErrorMessage('No employees found.');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setErrorMessage('An unexpected error occurred.');
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchEmployees();
    fetchProjects();
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedPage === "Active Projects") {
      fetchProjects();
    } else if (selectedPage === "Employee List") {
      fetchEmployees();
    } else if (selectedPage === "Resources") {
      fetchDocuments();
    }
  }, [selectedPage]);

  if (!isClient) return null;

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderPage = () => {
    switch (selectedPage) {
      case "Super Admin":
        return <SuperAdmin user={user}/>
      case "Active Projects":
        return (
          <ActiveProjects
            projects={projects}
            setProjects={setProjects}
            fetchProjects={fetchProjects}
            errorMessage={errorMessage}
            projectsPerPage={projectsPerPage}
          />
        );
      case "Employee List":
        return (
          <EmployeeList
            employees={employees}
            setEmployees={setEmployees}
            errorMessage={errorMessage}
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
      case "Create User":
        return userRole === "Super Admin" ? (
          <CreateUser userRole={userRole} />
        ) : (
          <div>
            <p className="text-red-500 font-bold text-2xl">Access Denied</p>
          </div>
        );
      case "Manage Profile":
        return <UpdateUser />;
      default:
        return (
          <ActiveProjects
            projects={projects}
            setProjects={setProjects}
            fetchProjects={fetchProjects}
            errorMessage={errorMessage}
            projectsPerPage={projectsPerPage}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 p-6 h-full overflow-auto">
        <div className="flex justify-end mb-4">
          <p className="text-l font-bold p-3">{fullName}</p>
            {orgSlug && (
              <p className="text-sm text-gray-500 p-3">
                Org: {orgSlug} {orgType ? `(${orgType})` : ""}
              </p>
            )}
          <button type="button" onClick={handleLogout} className="logout-btn">
            <div className="out">
              <svg viewBox="0 0 512 512">
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 
                20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 
                0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 
                0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 
                14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 
                32s-14.3 32-32 32z" />
              </svg>
            </div>
            <div className="text">Logout</div>
          </button>
        </div>
        {renderPage()}
      </div>
    </div>
  );
};

export default DashboardClient;
