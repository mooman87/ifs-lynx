"use client";

import React, { useEffect, useState } from "react";
import { useDashboard } from "@/app/context/DashboardContext";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import CreateEmployeeModal from "@/app/components/CreateEmployeeModal";
import "../../employee/employee.css";

const EmployeeProfilePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedPage } = useDashboard();
  const selectedPageFromUrl = searchParams.get("selectedPage") || "Employee List";
  const [employee, setEmployee] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const handleClose = () => {
    router.push(`/dashboard?selectedPage=${encodeURIComponent(selectedPageFromUrl)}`);
  };

  useEffect(() => {
    const fetchEmployeeAndProjects = async () => {
      try {
        const resEmployee = await fetch(`/api/employee/${id}`);
        const resProjects = await fetch(`/api/project`);
        const dataEmployee = await resEmployee.json();
        const dataProjects = await resProjects.json();

        if (resEmployee.ok && resProjects.ok) {
          setEmployee(dataEmployee.employee);
          setEditFormData({
            firstName: dataEmployee.employee.firstName,
            lastName: dataEmployee.employee.lastName,
            gender: dataEmployee.employee.gender,
            dob: dataEmployee.employee.dob,
            phone: dataEmployee.employee.phone,
            address: dataEmployee.employee.address,
            address2: dataEmployee.employee.address2,
            city: dataEmployee.employee.city,
            state: dataEmployee.employee.state,
            zip: dataEmployee.employee.zip,
            email: dataEmployee.employee.email,
            availableStart: dataEmployee.employee.availableStart,
            role: dataEmployee.employee.role,
            reportsTo: dataEmployee.employee.reportsTo,
            homeAirport: dataEmployee.employee.homeAirport,
            altAirport: dataEmployee.employee.altAirport,
            rentalCarEligible: dataEmployee.employee.rentalCarEligible ?? false,
          });

          const assignedProjectIds = new Set(
            dataEmployee.employee.assignedProjects.map((proj) => proj._id)
          );
          const availableProjects = dataProjects.projects.filter(
            (proj) => !assignedProjectIds.has(proj._id)
          );
          setProjects(availableProjects);
        } else {
          setError("Error fetching data.");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching data.");
      }
    };

    fetchEmployeeAndProjects();
  }, [id]);

  const assignEmployeeToProject = async (projectId) => {
    try {
      const res = await fetch(`/api/employee/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: id, projectId }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmployee(data.employee);
        setProjects((prevProjects) =>
          prevProjects.filter((proj) => proj._id !== projectId)
        );
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditChange = (e) => {
    const { name, type, value, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/employee/${employee._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok) {
        setEmployee(data.employee);
        setIsEditModalOpen(false);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!employee)
    return <div className="p-6">{error || "Loading employee profile..."}</div>;

  return (
    <div className="min-h-screen p-6">
      {/* Absolute Close Button (similar to project page) */}
      <div 
        className="absolute top-6 right-9 cursor-pointer"
        onClick={handleClose}
      >
        <div className="line one"></div>
        <div className="line two"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {employee.firstName} {employee.lastName}
            </h1>
          </div>
          <button onClick={() => setIsEditModalOpen(true)} className="flex items-center mt-4 md:mt-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={24}
                height={24}
                color={"#fff"}
                fill={"none"}
              >
                <path d="M15.2141 5.98239L16.6158 4.58063C17.39 3.80646 18.6452 3.80646 19.4194 4.58063C20.1935 5.3548 20.1935 6.60998 19.4194 7.38415L18.0176 8.78591M15.2141 5.98239L6.98023 14.2163C5.93493 15.2616 5.41226 15.7842 5.05637 16.4211C4.70047 17.058 4.3424 18.5619 4 20C5.43809 19.6576 6.94199 19.2995 7.57889 18.9436C8.21579 18.5877 8.73844 18.0651 9.78375 17.0198L18.0176 8.78591M15.2141 5.98239L18.0176 8.78591" 
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M11 20H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="ml-2">Edit Profile</span>
            </button>
        </header>

        {/* MAIN CONTENT: Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Personal Info & Assigned Projects */}
          <div className="flex flex-col space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded shadow p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Personal Information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <dt className="font-medium text-gray-600">Gender:</dt>
                  <dd className="text-gray-800 break-words">{employee.gender}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">DOB:</dt>
                  <dd className="text-gray-800 break-words">{employee.dob}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Phone:</dt>
                  <dd className="text-gray-800 break-words">{employee.phone}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Email:</dt>
                  <dd className="text-gray-800 break-words">{employee.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Role:</dt>
                  <dd className="text-gray-800 break-words">{employee.role}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Reports To:</dt>
                  <dd className="text-gray-800 break-words">{employee.reportsTo}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Home Airport:</dt>
                  <dd className="text-gray-800 break-words">{employee.homeAirport}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Alt Airport:</dt>
                  <dd className="text-gray-800 break-words">{employee.altAirport}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-gray-600">Address:</dt>
                  <dd className="text-gray-800 break-words">
                    {employee.address} {employee.address2}, {employee.city}, {employee.state} {employee.zip}
                  </dd>
                </div>
                {!employee.rentalCarEligible && (
                  <div className="sm:col-span-2">
                        <div className="relative w-full max-w-96 flex flex-wrap items-center justify-center py-3 pl-4 pr-14 rounded-lg text-base font-medium [transition:all_0.5s_ease] border-solid border border-[#f85149] text-[#b22b2b] [&_svg]:text-[#b22b2b] group bg-[linear-gradient(#f851491a,#f851491a)]">
                          <p className="flex flex-row items-center mr-auto gap-x-2">
                            <svg stroke="currentColor" fill="none" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={28} width={28} className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
                              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                              <path d="M12 9v4" />
                              <path d="M12 17h.01" />
                            </svg>
                           INELIGIBLE FOR RENTAL
                          </p>
                        </div>
                  </div>
                )}
                {employee.rentalCarEligible && (
                  <div className="relative w-full max-w-96 flex flex-wrap items-center justify-center py-3 pl-4 pr-14 rounded-lg text-base font-medium [transition:all_0.5s_ease] border-solid border border-[#51f849] text-[#2bb22b] [&_svg]:text-[#2bb22b] group bg-[linear-gradient(#51f8491a,#51f8491a)]">
                  <p className="flex flex-row items-center mr-auto gap-x-2">
                    <svg stroke="currentColor" fill="none" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={28} width={28} className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                    ELIGIBLE FOR RENTAL
                  </p>
                </div>
                
                )}
              </dl>
            </div>


            {/* Assigned Projects */}
            <div className="bg-white rounded shadow p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Assigned Projects</h2>
              {employee.assignedProjects?.length > 0 ? (
                <ul>
                  {employee.assignedProjects.map((proj) => (
                    <li key={proj._id} className="p-2 mb-2 rounded border">
                      {proj.campaignName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No assigned projects.</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Available Projects */}
          <div className="flex flex-col space-y-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Available Projects</h2>
              <ul>
                {projects.length > 0 ? (
                  projects.map((proj) => (
                    <li
                      key={proj._id}
                      className="p-2 mb-2 rounded flex justify-between items-center border"
                    >
                      <div>{proj.campaignName}</div>
                      <button
                        onClick={() => assignEmployeeToProject(proj._id)}
                        className="px-3 py-1 font-bold add-btn"
                      >
                        + Assign
                      </button>
                    </li>
                  ))
                ) : (
                  <p>No available projects.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <CreateEmployeeModal
          isOpen={isEditModalOpen}
          toggleModal={() => setIsEditModalOpen(false)}
          formData={editFormData}
          handleChange={handleEditChange}
          handleSubmit={handleEditSubmit}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default EmployeeProfilePage;
