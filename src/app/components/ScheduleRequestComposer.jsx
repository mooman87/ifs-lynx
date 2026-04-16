"use client";
import React, { useMemo, useState } from "react";

const defaultShiftOptions = [
  "7am–3pm",
  "8am–4pm",
  "8am–6pm",
  "9am–5pm",
  "10am–4pm",
  "All day",
];

const formatCompactDate = (date) => {
  if (!date) return "No date selected";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

const getEmployeeId = (employee) => employee?.id ?? employee?._id ?? null;

const ScheduleRequestComposer = ({
  projectId,
  assignedEmployees = [],
  scheduleEntry = null,
  selectedDate,
  onCreated,
}) => {
  const [staffId, setStaffId] = useState("");
  const [requestType, setRequestType] = useState("day_off");
  const [requestedShiftLabel, setRequestedShiftLabel] = useState("9am–5pm");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const scheduledMap = useMemo(() => {
    const map = new Map();
    const employees = scheduleEntry?.employees || [];
    employees.forEach((employee) => {
      const id = getEmployeeId(employee);
      if (!id) return;
      map.set(id, employee);
    });
    return map;
  }, [scheduleEntry]);

  const sortedStaff = useMemo(() => {
    return [...assignedEmployees].sort((a, b) => {
      const aName = `${a.firstName || ""} ${a.lastName || ""}`.trim();
      const bName = `${b.firstName || ""} ${b.lastName || ""}`.trim();
      return aName.localeCompare(bName);
    });
  }, [assignedEmployees]);

  const selectedStaff = useMemo(() => {
    return (
      sortedStaff.find((employee) => getEmployeeId(employee) === staffId) ||
      null
    );
  }, [sortedStaff, staffId]);

  const currentScheduledRow = useMemo(() => {
    return scheduledMap.get(staffId) || null;
  }, [scheduledMap, staffId]);

  const currentShiftLabel = currentScheduledRow?.shiftLabel || "";

  const resetForm = () => {
    setStaffId("");
    setRequestType("day_off");
    setRequestedShiftLabel("9am–5pm");
    setDetail("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!projectId) {
      setError("Missing project context.");
      return;
    }

    if (!selectedDate) {
      setError("Select a date first.");
      return;
    }

    if (!staffId) {
      setError("Choose a staff member.");
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
          date: new Date(selectedDate).toISOString().slice(0, 10),
          requestType,
          currentShiftLabel: currentShiftLabel || null,
          requestedShiftLabel:
            requestType === "shift_change" ? requestedShiftLabel : null,
          detail: detail || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create schedule request.");
      }

      setSuccess("Schedule request submitted.");
      resetForm();

      if (onCreated) {
        await onCreated(data?.request || null);
      }
    } catch (err) {
      console.error("Error creating schedule request:", err);
      setError(err.message || "Failed to create schedule request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#AFA9EC] bg-[#F8F7FE] p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#3C3489]">
          Submit a schedule request
        </h3>
        <p className="mt-1 text-xs text-[#6A6599]">
          Create a day-off or shift-change request for{" "}
          {formatCompactDate(selectedDate)}.
        </p>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888780]">
              Staff member
            </label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-[#1a1a1a]"
            >
              <option value="">Select staff</option>
              {sortedStaff.map((employee) => {
                const id = getEmployeeId(employee);
                return (
                  <option key={id} value={id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888780]">
              Request type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-[#1a1a1a]"
            >
              <option value="day_off">Day off</option>
              <option value="shift_change">Shift change</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888780]">
              Current shift
            </label>
            <div className="rounded-lg border border-black/10 bg-[#f1efe8] px-3 py-2 text-[13px] text-[#888780]">
              {currentShiftLabel || "No shift assigned"}
            </div>
          </div>
        </div>

        {requestType === "shift_change" ? (
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888780]">
              Requested shift
            </label>
            <select
              value={requestedShiftLabel}
              onChange={(e) => setRequestedShiftLabel(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-[#1a1a1a]"
            >
              {defaultShiftOptions.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888780]">
            Details
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder={
              requestType === "day_off"
                ? "Reason for the day-off request..."
                : "Why do you need a shift change?"
            }
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#b4b2a9]"
          />
        </div>

        {selectedStaff ? (
          <div className="rounded-xl border border-black/10 bg-white px-3 py-3 text-xs text-[#666]">
            <span className="font-semibold text-[#1a1a1a]">
              {selectedStaff.firstName} {selectedStaff.lastName}
            </span>
            <span className="mx-2">·</span>
            <span>{selectedStaff.role || "Unassigned role"}</span>
            <span className="mx-2">·</span>
            <span>{selectedStaff.reportsTo || "No roster team assigned"}</span>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !selectedDate}
            className="rounded-lg border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-[13px] font-medium text-[#3C3489] transition hover:bg-[#CECBF6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleRequestComposer;
