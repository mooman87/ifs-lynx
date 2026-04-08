"use client";
import React, { useEffect, useMemo, useState } from "react";

const formatCompactDate = (date) => {
  if (!date) return "No date selected";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

const getEmployeeId = (employee) => employee?.id ?? employee?._id ?? null;

const getInitials = (employee) => {
  const first = employee?.firstName?.[0] || "?";
  const last = employee?.lastName?.[0] || "?";
  return `${first}${last}`.toUpperCase();
};

const getTeamLabel = (index, employee) => {
  if (employee?.role === "manager" || employee?.position === "manager")
    return "Mgmt";
  const letters = ["A", "B", "C", "D", "E"];
  return `Team ${letters[index % letters.length]}`;
};

const buildShift = (index, isScheduled) => {
  if (!isScheduled) return "—";
  const shifts = ["8am–6pm", "9am–5pm", "10am–4pm", "8am–4pm"];
  return shifts[index % shifts.length];
};

const statusMeta = (status) => {
  switch (status) {
    case "working":
      return "bg-[#EAF3DE] text-[#27500A]";
    case "off":
      return "bg-[#FCEBEB] text-[#791F1F]";
    case "pending":
      return "bg-[#FAEEDA] text-[#633806]";
    default:
      return "bg-[#f1efe8] text-[#888780]";
  }
};

const makeStaticRequests = (employees = [], selectedDate) => {
  const safeDate = selectedDate
    ? formatCompactDate(selectedDate)
    : "Selected date";
  const source = employees.slice(0, 4);

  return source.map((employee, index) => {
    const fullName =
      `${employee.firstName || "Unknown"} ${employee.lastName || "Employee"}`.trim();
    const templates = [
      {
        type: "Shift change",
        detail: `Requesting 10am–4pm instead of 9am–5pm on ${safeDate}`,
        stamp: "9:41pm",
      },
      {
        type: "Day off",
        detail: `Personal day request for ${safeDate} — family commitment`,
        stamp: "3:12pm",
      },
      {
        type: "Day off",
        detail: `Sick leave request for ${safeDate}`,
        stamp: "7:05am",
      },
      {
        type: "Shift change",
        detail: `Requesting 7am–3pm instead of 8am–6pm on ${safeDate}`,
        stamp: "11:20pm",
      },
    ];

    const template = templates[index % templates.length];

    return {
      id: getEmployeeId(employee) || `${fullName}-${index}`,
      name: fullName,
      initials: getInitials(employee),
      type: template.type,
      detail: template.detail,
      date: `${safeDate} · ${template.stamp}`,
      status: "pending",
    };
  });
};

const ScheduleEmployees = ({ project, assignEmployeeToDate, selectedDate }) => {
  const [activeSubTab, setActiveSubTab] = useState("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [requestsState, setRequestsState] = useState([]);

  const assignedEmployees = project?.assignedEmployees || [];
  const dateKey = selectedDate
    ? new Date(selectedDate).toISOString().slice(0, 10)
    : null;

  const scheduledIds = useMemo(() => {
    if (!dateKey) return new Set();
    const entry = project?.schedule?.find((item) => item?.date === dateKey);
    const employees = entry?.employees || [];
    return new Set(
      employees.map((employee) => getEmployeeId(employee)).filter(Boolean),
    );
  }, [project?.schedule, dateKey]);

  const rosterRows = useMemo(() => {
    return assignedEmployees.map((employee, index) => {
      const id = getEmployeeId(employee);
      const isScheduled = scheduledIds.has(id);
      const hasSyntheticPending = index === 0 && !isScheduled;

      return {
        id,
        employee,
        initials: getInitials(employee),
        name: `${employee.firstName || "Unknown"} ${employee.lastName || "Employee"}`.trim(),
        role: employee?.role || employee?.position || "canvasser",
        team: getTeamLabel(index, employee),
        status: hasSyntheticPending
          ? "pending"
          : isScheduled
            ? "working"
            : "unset",
        shift: buildShift(index, isScheduled),
        notes: hasSyntheticPending
          ? "Scheduling pending"
          : isScheduled
            ? "Scheduled for selected date"
            : "Not scheduled yet",
        isScheduled,
      };
    });
  }, [assignedEmployees, scheduledIds]);

  const filteredRoster = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rosterRows;

    return rosterRows.filter((row) => {
      return (
        row.name.toLowerCase().includes(query) ||
        row.team.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query)
      );
    });
  }, [rosterRows, searchQuery]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedDate, searchQuery]);

  useEffect(() => {
    setRequestsState(makeStaticRequests(assignedEmployees, selectedDate));
  }, [assignedEmployees, selectedDate]);

  const pendingRequestCount = useMemo(() => {
    return requestsState.filter((request) => request.status === "pending")
      .length;
  }, [requestsState]);

  const toggleRowSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === filteredRoster.length) return new Set();
      return new Set(filteredRoster.map((row) => row.id).filter(Boolean));
    });
  };

  const bulkScheduleAll = async () => {
    const unscheduled = filteredRoster.filter((row) => !row.isScheduled);
    for (const row of unscheduled) {
      await assignEmployeeToDate(row.employee);
    }
  };

  const resolveRequest = (requestId, resolution) => {
    setRequestsState((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: resolution } : request,
      ),
    );
  };

  return (
    <div className="rounded-[20px] border border-black/10 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("roster")}
          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
            activeSubTab === "roster"
              ? "border border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489]"
              : "border border-transparent text-[#888780] hover:bg-[#f1efe8] hover:text-[#1a1a1a]"
          }`}
        >
          Roster
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("requests")}
          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
            activeSubTab === "requests"
              ? "border border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489]"
              : "border border-transparent text-[#888780] hover:bg-[#f1efe8] hover:text-[#1a1a1a]"
          }`}
        >
          Schedule requests
          <span className="ml-2 rounded-full bg-[#EF9F27] px-1.5 py-[1px] text-[11px] font-semibold text-[#412402]">
            {pendingRequestCount}
          </span>
        </button>
      </div>

      {activeSubTab === "roster" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="text-[13px] font-medium text-[#1a1a1a]">
              {formatCompactDate(selectedDate)}
            </div>

            <div className="min-w-[220px] flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or team..."
                className="w-full rounded-lg border border-black/10 bg-[#f1efe8] px-3 py-2 text-[13px] text-[#1a1a1a] outline-none placeholder:text-[#888780]"
              />
            </div>

            <button
              type="button"
              className="rounded-lg border border-black/10 px-3 py-2 text-[13px] text-[#888780] transition hover:bg-[#f1efe8]"
            >
              Filter ▾
            </button>

            <button
              type="button"
              onClick={bulkScheduleAll}
              disabled={
                !selectedDate || filteredRoster.every((row) => row.isScheduled)
              }
              className="rounded-lg border border-[#AFA9EC] bg-[#EEEDFE] px-3 py-2 text-[13px] font-medium text-[#3C3489] transition hover:bg-[#CECBF6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Bulk edit all
            </button>
          </div>

          {selectedIds.size > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-3">
              <span className="text-[13px] font-medium text-[#3C3489]">
                {selectedIds.size} selected
              </span>
              <div className="h-5 w-px bg-[#AFA9EC]" />
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[12px] font-medium text-[#534AB7] hover:underline"
              >
                Clear selection
              </button>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-black/10">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#f8f7f5] text-left text-[11px] uppercase tracking-[0.05em] text-[#888780]">
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={
                          filteredRoster.length > 0 &&
                          selectedIds.size === filteredRoster.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Team</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Shift</th>
                    <th className="px-3 py-3">Notes</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((row) => {
                    const isChecked = selectedIds.has(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`border-t border-black/5 ${isChecked ? "bg-[#EEEDFE]" : "hover:bg-[#f8f7f5]"}`}
                      >
                        <td className="px-3 py-3 align-middle">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRowSelection(row.id)}
                          />
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#CECBF6] text-[10px] font-semibold text-[#3C3489]">
                              {row.initials}
                            </div>
                            <div>
                              <div className="font-medium text-[#1a1a1a]">
                                {row.name}
                              </div>
                              <div className="mt-1 inline-flex rounded-full bg-[#f1efe8] px-2 py-[2px] text-[11px] text-[#888780]">
                                {row.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle text-[#888780]">
                          {row.team}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusMeta(row.status)}`}
                          >
                            {row.status === "working"
                              ? "Working"
                              : row.status === "off"
                                ? "Day off"
                                : row.status === "pending"
                                  ? "Pending"
                                  : "Unset"}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle text-[#1a1a1a]">
                          {row.shift}
                        </td>
                        <td className="px-3 py-3 align-middle text-[#b4b2a9]">
                          {row.notes}
                        </td>
                        <td className="px-3 py-3 align-middle text-right">
                          <button
                            type="button"
                            onClick={() => assignEmployeeToDate(row.employee)}
                            disabled={!selectedDate || row.isScheduled}
                            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                              row.isScheduled
                                ? "cursor-not-allowed border border-black/10 bg-[#f1efe8] text-[#888780]"
                                : "border border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489] hover:bg-[#CECBF6]"
                            }`}
                          >
                            {row.isScheduled ? "Scheduled" : "Add to date"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[13px] text-[#888780]">
            <span>
              Showing {filteredRoster.length === 0 ? 0 : 1}–
              {filteredRoster.length} of {filteredRoster.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="h-7 w-7 rounded-md border border-black/10 text-[#888780]"
              >
                &#8249;
              </button>
              <button
                type="button"
                className="h-7 w-7 rounded-md border border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489]"
              >
                1
              </button>
              <button
                type="button"
                className="h-7 w-7 rounded-md border border-black/10 text-[#888780]"
              >
                &#8250;
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {requestsState.map((request) => {
            const isPending = request.status === "pending";
            const leftBorder =
              request.status === "approved"
                ? "border-l-[#639922] opacity-75"
                : request.status === "denied"
                  ? "border-l-[#E24B4A] opacity-75"
                  : "border-l-[#EF9F27]";

            return (
              <div
                key={request.id}
                className={`flex flex-wrap items-center gap-4 rounded-xl border border-black/10 border-l-[3px] bg-white px-4 py-4 ${leftBorder}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CECBF6] text-[12px] font-semibold text-[#3C3489]">
                  {request.initials}
                </div>

                <div className="min-w-[220px] flex-1">
                  <div className="text-[14px] font-medium text-[#1a1a1a]">
                    {request.name}
                    <span className="ml-1 text-[12px] font-normal text-[#888780]">
                      · {request.type}
                    </span>
                  </div>
                  <div className="text-[13px] text-[#888780]">
                    {request.detail}
                  </div>
                </div>

                <div className="text-[12px] text-[#b4b2a9]">{request.date}</div>

                <div className="ml-auto flex items-center gap-2">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        onClick={() => resolveRequest(request.id, "approved")}
                        className="rounded-lg border border-[#97C459] bg-[#EAF3DE] px-3 py-1.5 text-[12px] font-medium text-[#27500A] transition hover:bg-[#C0DD97]"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveRequest(request.id, "denied")}
                        className="rounded-lg border border-[#F09595] bg-[#FCEBEB] px-3 py-1.5 text-[12px] font-medium text-[#791F1F] transition hover:bg-[#F7C1C1]"
                      >
                        Deny
                      </button>
                    </>
                  ) : (
                    <span className="text-[12px] font-medium text-[#888780]">
                      {request.status === "approved"
                        ? "✓ Approved"
                        : "✕ Denied"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScheduleEmployees;
