"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CreateEmployeeModal from "@/app/components/CreateEmployeeModal";

const getInitials = (firstName = "", lastName = "") =>
  `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

const InfoItem = ({ label, value, full = false }) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <dt className="text-xs font-medium uppercase tracking-[0.08em] text-gray-400 mb-1">
      {label}
    </dt>
    <dd className="text-sm text-gray-800 break-words">{value || "—"}</dd>
  </div>
);

const EmployeeProfilePage = () => {
  const { id } = useParams();
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const searchParams = useSearchParams();

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedPage", "Staff");
    router.push(`/dashboard?${params.toString()}`);
  };

  const fetchEmployeeAndProjects = async () => {
    try {
      const resEmployee = await fetch(`/api/employee/${id}`);
      const resProjects = await fetch(`/api/project`);
      const dataEmployee = await resEmployee.json();
      const dataProjects = await resProjects.json();

      if (resEmployee.ok && resProjects.ok) {
        const employeeRecord = dataEmployee.employee;
        const assignedProjects = employeeRecord.assignedProjects || [];

        setEmployee(employeeRecord);

        setEditFormData({
          firstName: employeeRecord.firstName,
          lastName: employeeRecord.lastName,
          gender: employeeRecord.gender,
          dob: employeeRecord.dob,
          phone: employeeRecord.phone,
          address: employeeRecord.address,
          address2: employeeRecord.address2,
          city: employeeRecord.city,
          state: employeeRecord.state,
          zip: employeeRecord.zip,
          email: employeeRecord.email,
          availableStart: employeeRecord.availableStart,
          role: employeeRecord.role,
          reportsTo: employeeRecord.reportsTo,
          homeAirport: employeeRecord.homeAirport,
          altAirport: employeeRecord.altAirport,
          rentalCarEligible: employeeRecord.rentalCarEligible ?? false,
        });

        const assignedProjectIds = new Set(
          assignedProjects.map((proj) => proj._id).filter(Boolean),
        );

        const availableProjects = (dataProjects.projects || []).filter(
          (proj) => !assignedProjectIds.has(proj._id),
        );

        setProjects(availableProjects);
        setError("");
      } else {
        setError("Error fetching data.");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching data.");
    }
  };

  useEffect(() => {
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
        await fetchEmployeeAndProjects();
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

  const assignedProjectCount = employee?.assignedProjects?.length || 0;
  const availableProjectCount = projects.length;

  const fullAddress = useMemo(() => {
    if (!employee) return "";
    return [
      employee.address,
      employee.address2,
      employee.city,
      employee.state,
      employee.zip,
    ]
      .filter(Boolean)
      .join(", ");
  }, [employee]);

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#faf7ff] to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">
              {error || "Loading employee profile..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#faf7ff] to-white p-6">
      <button
        type="button"
        className="absolute top-6 right-9 h-9 w-9 rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 flex items-center justify-center"
        onClick={handleClose}
        aria-label="Close employee profile"
      >
        <div className="relative h-4 w-4">
          <span className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 rotate-45 rounded-full bg-current" />
          <span className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
        </div>
      </button>

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#CECBF6] text-lg font-semibold text-[#3C3489] shadow-sm">
              {getInitials(employee.firstName, employee.lastName)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>

                <span className="inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
                  {employee.role || "Unassigned"}
                </span>
              </div>

              <p className="text-sm text-gray-500">
                {employee.email || "No email on file"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill="none"
            >
              <path
                d="M15.2141 5.98239L16.6158 4.58063C17.39 3.80646 18.6452 3.80646 19.4194 4.58063C20.1935 5.3548 20.1935 6.60998 19.4194 7.38415L18.0176 8.78591M15.2141 5.98239L6.98023 14.2163C5.93493 15.2616 5.41226 15.7842 5.05637 16.4211C4.70047 17.058 4.3424 18.5619 4 20C5.43809 19.6576 6.94199 19.2995 7.57889 18.9436C8.21579 18.5877 8.73844 18.0651 9.78375 17.0198L18.0176 8.78591M15.2141 5.98239L18.0176 8.78591"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 20H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Edit profile
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
                  Assigned projects
                </p>
                <p className="text-3xl font-bold text-purple-700">
                  {assignedProjectCount}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
                  Available projects
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {availableProjectCount}
                </p>
              </div>

              <div
                className={`rounded-3xl border bg-white p-5 shadow-sm ${
                  employee.rentalCarEligible
                    ? "border-green-200"
                    : "border-red-200"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
                  Rental status
                </p>
                <p
                  className={`text-lg font-bold ${
                    employee.rentalCarEligible
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {employee.rentalCarEligible ? "Eligible" : "Ineligible"}
                </p>
              </div>
            </div>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal information
                </h2>
                <p className="text-sm text-gray-500">
                  Staff profile details, travel info, and reporting structure.
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <InfoItem label="Gender" value={employee.gender} />
                <InfoItem label="Date of birth" value={employee.dob} />
                <InfoItem label="Phone" value={employee.phone} />
                <InfoItem label="Email" value={employee.email} />
                <InfoItem label="Role" value={employee.role} />
                <InfoItem label="Reports to" value={employee.reportsTo} />
                <InfoItem label="Home airport" value={employee.homeAirport} />
                <InfoItem label="Alt airport" value={employee.altAirport} />
                <InfoItem
                  label="Available start"
                  value={employee.availableStart}
                />
                <InfoItem label="Zip" value={employee.zip} />
                <InfoItem label="Address" value={fullAddress} full />
              </dl>

              <div className="mt-6">
                {employee.rentalCarEligible ? (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    <svg
                      stroke="currentColor"
                      fill="none"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      height={18}
                      width={18}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                    Eligible for rental
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    <svg
                      stroke="currentColor"
                      fill="none"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      height={18}
                      width={18}
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                    Ineligible for rental
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Assigned projects
                  </h2>
                  <p className="text-sm text-gray-500">
                    Campaigns this employee is currently attached to.
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 border border-gray-200">
                  {assignedProjectCount} total
                </span>
              </div>

              {employee.assignedProjects?.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <ul className="divide-y divide-gray-100">
                    {employee.assignedProjects.map((proj) => (
                      <li
                        key={proj._id}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {proj.campaignName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Active assignment
                          </p>
                        </div>
                        <span className="inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
                          Assigned
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No assigned projects.</p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Available projects
                  </h2>
                  <p className="text-sm text-gray-500">
                    Assign this employee to additional campaigns.
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 border border-gray-200">
                  {availableProjectCount} available
                </span>
              </div>

              {projects.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <ul className="divide-y divide-gray-100">
                    {projects.map((proj) => (
                      <li
                        key={proj._id}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {proj.campaignName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ready to assign
                          </p>
                        </div>

                        <button
                          onClick={() => assignEmployeeToProject(proj._id)}
                          className="shrink-0 inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-3 py-1.5 text-xs font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
                        >
                          + Assign
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No available projects
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    This employee is already assigned to every available
                    campaign.
                  </p>
                </div>
              )}
            </section>
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
