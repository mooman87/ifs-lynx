"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "../context/DashboardContext";
import CreateEmployeeModal from "./CreateEmployeeModal";

const getInitials = (firstName = "", lastName = "") =>
  `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

const EmployeeList = ({
  employees = [],
  setEmployees,
  errorMessage,
  fetchEmployees,
}) => {
  const router = useRouter();
  const dashboard = useDashboard();
  const selectedPage = dashboard?.selectedPage ?? "Staff";

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [employeeFormData, setEmployeeFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    availableStart: "",
    role: "Canvasser",
    staffType: "employee",
    reportsTo: "",
    homeAirport: "",
    altAirport: "",
    rentalCarEligible: false,
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();

        if (!res.ok || !data.user) {
          throw new Error(data.message || "Failed to load current user");
        }

        setCurrentUser(data.user);
      } catch (err) {
        console.error(err);
        setCreateError(err.message || "Failed to load current user");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleEmployeeModalToggle = () => {
    setIsEmployeeModalOpen((prev) => !prev);
    setCreateError("");
    setCreateSuccess("");
  };

  const resetForm = () => {
    setEmployeeFormData({
      fullName: "",
      email: "",
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      gender: "",
      dob: "",
      phone: "",
      address: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      availableStart: "",
      role: "Canvasser",
      staffType: "employee",
      reportsTo: "",
      homeAirport: "",
      altAirport: "",
      rentalCarEligible: false,
    });
  };

  const handleEmployeeChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEmployeeFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "fullName") {
        const parts = String(value || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        next.firstName = parts[0] || "";
        next.lastName = parts.slice(1).join(" ");
      }

      if (name === "firstName" || name === "lastName") {
        const first = name === "firstName" ? value : next.firstName || "";
        const last = name === "lastName" ? value : next.lastName || "";
        next.fullName = [first, last].filter(Boolean).join(" ");
      }

      return next;
    });
  };

  const createEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const payload = {
        ...employeeFormData,
        fullName:
          employeeFormData.fullName ||
          [employeeFormData.firstName, employeeFormData.lastName]
            .filter(Boolean)
            .join(" "),
        organization: currentUser?.organization?.id || "",
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create staff member");
      }

      setCreateSuccess("Staff member created successfully.");
      setIsEmployeeModalOpen(false);
      resetForm();
      await fetchEmployees();
    } catch (error) {
      console.error("Error:", error);
      setCreateError(error.message || "Failed to create staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const goToEmployeeProfile = (employeeId) => {
    router.push(
      `/employee/${employeeId}?selectedPage=${encodeURIComponent(selectedPage)}`,
    );
  };

  const groupedEmployees = useMemo(() => {
    return employees.reduce((acc, employee) => {
      const role = employee.role || "Unassigned";
      if (!acc[role]) acc[role] = [];
      acc[role].push(employee);
      return acc;
    }, {});
  }, [employees]);

  const sortedRoles = useMemo(
    () => Object.keys(groupedEmployees).sort((a, b) => a.localeCompare(b)),
    [groupedEmployees],
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Profiles</h1>
            <p className="text-sm text-gray-500">
              Manage your roster, open staff records, and create login-enabled
              staff from one place.
            </p>
          </div>

          <button
            onClick={handleEmployeeModalToggle}
            className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
          >
            + Add staff
          </button>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        ) : null}

        {createSuccess ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {createSuccess}
          </div>
        ) : null}

        {sortedRoles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-base font-semibold text-gray-800">
              No staff yet
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Add your first staffer to start building out the roster.
            </p>
          </div>
        ) : (
          sortedRoles.map((role) => (
            <section key={role} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {role}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {groupedEmployees[role].length}{" "}
                    {groupedEmployees[role].length === 1
                      ? "staffer"
                      : "staffers"}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                          Login
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                          Rental
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {groupedEmployees[role].map((employee, index) => (
                        <tr
                          key={employee._id || employee.id}
                          onClick={() =>
                            goToEmployeeProfile(employee._id || employee.id)
                          }
                          className={`cursor-pointer transition hover:bg-[#f8f7fd] ${
                            index !== groupedEmployees[role].length - 1
                              ? "border-b border-gray-100"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CECBF6] text-sm font-semibold text-[#3C3489]">
                                {getInitials(
                                  employee.firstName,
                                  employee.lastName,
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {employee.firstName} {employee.lastName}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {employee.role || "Unassigned"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                            {employee.staffType || "employee"}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-600">
                            {employee.phone || "—"}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="block max-w-[220px] truncate">
                              {employee.email || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {employee.canLogin !== false ? (
                              <span className="inline-flex rounded-full bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489] border border-[#AFA9EC]">
                                Enabled
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 border border-gray-200">
                                Disabled
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {employee.rentalCarEligible ? (
                              <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                                Eligible
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 border border-gray-200">
                                Not eligible
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))
        )}

        {isEmployeeModalOpen && (
          <CreateEmployeeModal
            isOpen={isEmployeeModalOpen}
            toggleModal={handleEmployeeModalToggle}
            formData={employeeFormData}
            handleChange={handleEmployeeChange}
            handleSubmit={createEmployee}
            errorMessage={createError}
            successMessage={createSuccess}
            submitting={submitting}
          />
        )}
      </div>
    </>
  );
};

export default EmployeeList;
