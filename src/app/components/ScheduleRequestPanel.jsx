"use client";
import React, { useEffect, useMemo, useState } from "react";

const baseInput =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#b4b2a9]";

const readOnlyField =
  "w-full rounded-xl border border-black/10 bg-gray-50 px-3 py-2 text-sm text-gray-600";

const managerRoles = new Set([
  "Super Admin",
  "Campaign Manager",
  "Deputy Campaign Manager",
  "State Director",
  "Deputy State Director",
  "Field Director",
  "Operations Director",
]);

const getEmployeeId = (employee) => employee?.id ?? employee?._id ?? null;

const defaultShiftOptions = [
  "7am–3pm",
  "8am–4pm",
  "8am–6pm",
  "9am–5pm",
  "10am–4pm",
  "All day",
];

const canManageScheduleRequests = (user, scheduledEmployees = []) => {
  if (!user) return false;
  if (user.role === "Super Admin") return true;

  const orgRole = user.role || user.orgRole || user.organizationRole || "";
  if (managerRoles.has(orgRole)) return true;

  const scheduledMatch = scheduledEmployees.find((emp) => {
    return emp?.userId && String(emp.userId) === String(user.id);
  });

  if (!scheduledMatch) return false;

  return managerRoles.has(scheduledMatch.role || "");
};

const findCurrentUserStaff = (user, scheduledEmployees = []) => {
  if (!user) return null;

  return (
    scheduledEmployees.find((emp) => {
      return emp?.userId && String(emp.userId) === String(user.id);
    }) ||
    scheduledEmployees.find((emp) => {
      return (
        user.email &&
        emp.email &&
        String(emp.email).toLowerCase() === String(user.email).toLowerCase()
      );
    }) ||
    null
  );
};

const getDisplayName = (staff) => {
  if (!staff) return "No staff selected";
  return (
    staff.fullName ||
    `${staff.firstName || ""} ${staff.lastName || ""}`.trim() ||
    "Unnamed staff"
  );
};

const normalizeScheduledEmployees = (employees = []) =>
  employees
    .map((emp) => ({
      id: emp?.id ?? emp?._id ?? null,
      _id: emp?.id ?? emp?._id ?? null,
      userId: emp?.userId ?? null,
      firstName: emp?.firstName ?? "",
      lastName: emp?.lastName ?? "",
      fullName:
        emp?.fullName ||
        `${emp?.firstName || ""} ${emp?.lastName || ""}`.trim(),
      email: emp?.email ?? "",
      role: emp?.role ?? "",
      shiftLabel: emp?.shiftLabel ?? "",
    }))
    .filter((emp) => emp.id);

const ScheduleRequestPanel = ({
  projectId,
  selectedDate,
  scheduledEmployees = [],
  currentUser,
  onRequestCreated,
}) => {
  const [requestType, setRequestType] = useState("day_off");
  const [staffId, setStaffId] = useState("");
  const [currentShiftLabel, setCurrentShiftLabel] = useState("");
  const [requestedShiftLabel, setRequestedShiftLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizedEmployees = useMemo(
    () => normalizeScheduledEmployees(scheduledEmployees),
    [scheduledEmployees],
  );

  const canManage = useMemo(
    () => canManageScheduleRequests(currentUser, normalizedEmployees),
    [currentUser, normalizedEmployees],
  );

  const currentUserStaff = useMemo(
    () => findCurrentUserStaff(currentUser, normalizedEmployees),
    [currentUser, normalizedEmployees],
  );

  const selectedStaff = useMemo(
    () =>
      normalizedEmployees.find((emp) => getEmployeeId(emp) === staffId) || null,
    [normalizedEmployees, staffId],
  );

  useEffect(() => {
    if (!normalizedEmployees.length) {
      setStaffId("");
      setCurrentShiftLabel("");
      return;
    }

    if (canManage) {
      setStaffId((prev) => {
        const stillExists = normalizedEmployees.some(
          (emp) => getEmployeeId(emp) === prev,
        );
        if (prev && stillExists) return prev;

        if (currentUserStaff) {
          return getEmployeeId(currentUserStaff) || "";
        }

        return getEmployeeId(normalizedEmployees[0]) || "";
      });
      return;
    }

    if (currentUserStaff) {
      setStaffId(getEmployeeId(currentUserStaff) || "");
    } else {
      setStaffId("");
    }
  }, [canManage, currentUserStaff, normalizedEmployees]);

  useEffect(() => {
    if (!selectedStaff) {
      setCurrentShiftLabel("");
      return;
    }

    setCurrentShiftLabel(selectedStaff.shiftLabel || "");
  }, [selectedStaff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!projectId || !selectedDate) {
      setError("Select a valid project date first.");
      return;
    }

    if (!staffId) {
      setError("Select a staff member first.");
      return;
    }

    if (requestType === "shift_change" && !requestedShiftLabel) {
      setError("Choose a requested shift.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`/api/project/${projectId}/schedule/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          staffId,
          date: selectedDate.toISOString().slice(0, 10),
          requestType,
          currentShiftLabel: currentShiftLabel || "",
          requestedShiftLabel:
            requestType === "shift_change" ? requestedShiftLabel : "",
          detail: detail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create schedule request.");
      }

      setSuccess(
        requestType === "day_off"
          ? "Day off request submitted."
          : "Shift change request submitted.",
      );
      setRequestType("day_off");
      setRequestedShiftLabel("");
      setDetail("");

      if (onRequestCreated) {
        await onRequestCreated(data.request);
      }
    } catch (err) {
      console.error("Error creating schedule request:", err);
      setError(err.message || "Failed to create schedule request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-100 bg-[#fcfbff] p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Submit schedule request
        </h3>
        <p className="text-sm text-gray-500">
          Request a day off or a shift change for the selected date.
        </p>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Request type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className={baseInput}
            >
              <option value="day_off">Day off</option>
              <option value="shift_change">Shift change</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Staff member
            </label>

            {canManage ? (
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className={baseInput}
              >
                <option value="">Select staff member</option>
                {normalizedEmployees.map((emp) => (
                  <option key={getEmployeeId(emp)} value={getEmployeeId(emp)}>
                    {getDisplayName(emp)}
                  </option>
                ))}
              </select>
            ) : (
              <div className={readOnlyField}>
                <p>{getDisplayName(currentUserStaff)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              Current shift
            </label>
            <div className={readOnlyField}>
              <p>{currentShiftLabel || "No current shift"}</p>
            </div>
          </div>

          {requestType === "shift_change" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Requested shift
              </label>
              <select
                value={requestedShiftLabel}
                onChange={(e) => setRequestedShiftLabel(e.target.value)}
                className={baseInput}
              >
                <option value="">Select requested shift</option>
                {defaultShiftOptions.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                Request date
              </label>
              <div className={readOnlyField}>
                <p>
                  {selectedDate ? selectedDate.toISOString().slice(0, 10) : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
            Reason / detail
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder={
              requestType === "day_off"
                ? "Add context for the day off request..."
                : "Explain why the shift change is needed..."
            }
            className={baseInput}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !selectedStaff}
            className="rounded-lg border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-medium text-[#3C3489] transition hover:bg-[#CECBF6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleRequestPanel;
