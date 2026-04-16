"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ScheduleRequestPanel from "./ScheduleRequestPanel";

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

const defaultShiftOptions = [
  "7am–3pm",
  "8am–4pm",
  "8am–6pm",
  "9am–5pm",
  "10am–4pm",
  "All day",
];

const requestTypeLabel = (type) => {
  if (type === "day_off") return "Day off";
  if (type === "shift_change") return "Shift change";
  return type || "Request";
};

const managerRoles = new Set([
  "Super Admin",
  "Campaign Manager",
  "Deputy Campaign Manager",
  "State Director",
  "Deputy State Director",
  "Field Director",
  "Operations Director",
]);

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

const ActionMenu = ({
  row,
  onSchedule,
  onMarkWorking,
  onMarkDayOff,
  onUnschedule,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative flex justify-end"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        aria-label="Open staff actions"
      >
        <span className="leading-none">···</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-30 min-w-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {!row.isScheduled ? (
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await onSchedule();
              }}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-gray-700 transition hover:bg-gray-50"
            >
              <span>＋</span>
              <span>Schedule staffer</span>
            </button>
          ) : (
            <>
              {row.status === "off" ? (
                <button
                  type="button"
                  onClick={async () => {
                    setOpen(false);
                    await onMarkWorking();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-gray-700 transition hover:bg-gray-50"
                >
                  <span>✓</span>
                  <span>Mark working</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setOpen(false);
                    await onMarkDayOff();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-amber-700 transition hover:bg-amber-50"
                >
                  <span>⊘</span>
                  <span>Mark day off</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await onUnschedule();
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-red-600 transition hover:bg-red-50"
              >
                <span>✕</span>
                <span>Remove from date</span>
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

const RequestActionMenu = ({ request, onApprove, onDeny }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative flex justify-end"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        aria-label="Open request actions"
      >
        <span className="leading-none">···</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-30 min-w-[170px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await onApprove(request.id);
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-green-700 transition hover:bg-green-50"
          >
            <span>✓</span>
            <span>Approve</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await onDeny(request.id);
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-red-600 transition hover:bg-red-50"
          >
            <span>✕</span>
            <span>Deny</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

const ScheduleEmployees = ({
  project,
  assignEmployeeToDate,
  unscheduleEmployeeFromDate,
  updateScheduledEmployee,
  scheduleRequests = [],
  resolveScheduleRequest,
  selectedDate,
  currentUser,
  refreshProject,
}) => {
  const [activeSubTab, setActiveSubTab] = useState("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [noteDrafts, setNoteDrafts] = useState({});
  const [saveTimeouts, setSaveTimeouts] = useState({});
  const [saveIndicators, setSaveIndicators] = useState({});

  const assignedEmployees = project?.assignedEmployees || [];
  const dateKey = selectedDate
    ? new Date(selectedDate).toISOString().slice(0, 10)
    : null;

  const scheduleEntry = useMemo(() => {
    if (!dateKey) return null;
    return project?.schedule?.find((item) => item?.date === dateKey) || null;
  }, [project?.schedule, dateKey]);

  const scheduleAssignments = useMemo(() => {
    const rows = scheduleEntry?.employees || [];
    const map = new Map();

    rows.forEach((row) => {
      const id = getEmployeeId(row);
      if (!id) return;
      map.set(id, {
        status: row.status || "working",
        shiftLabel: row.shiftLabel || "",
        notes: row.notes || "",
        employee: row,
      });
    });

    return map;
  }, [scheduleEntry]);

  const scheduledEmployees = useMemo(() => {
    return scheduleEntry?.employees || [];
  }, [scheduleEntry]);

  const scheduledEmployeeMap = useMemo(() => {
    const map = new Map();

    scheduledEmployees.forEach((emp) => {
      const id = getEmployeeId(emp);
      if (!id) return;
      map.set(id, emp);
    });

    return map;
  }, [scheduledEmployees]);

  const userCanResolveRequests = useMemo(
    () => canManageScheduleRequests(currentUser, scheduledEmployees),
    [currentUser, scheduledEmployees],
  );

  const teamOptions = useMemo(() => {
    const values = new Set(
      assignedEmployees
        .map((employee) => employee?.reportsTo || "Unassigned")
        .filter(Boolean),
    );
    return ["all", ...Array.from(values)];
  }, [assignedEmployees]);

  const rosterRows = useMemo(() => {
    return assignedEmployees.map((employee) => {
      const id = getEmployeeId(employee);
      const assignment = scheduleAssignments.get(id);
      const isScheduled = Boolean(assignment);

      return {
        id,
        employee,
        initials: getInitials(employee),
        name:
          employee.fullName ||
          `${employee.firstName || "Unknown"} ${employee.lastName || "Employee"}`.trim(),
        role: employee?.role || "canvasser",
        team: employee?.reportsTo || "Unassigned",
        status: assignment?.status || "unset",
        shift: assignment?.shiftLabel || "",
        notes: assignment?.notes || "",
        isScheduled,
      };
    });
  }, [assignedEmployees, scheduleAssignments]);

  const filteredRoster = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return rosterRows.filter((row) => {
      const matchesQuery =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.team.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query) ||
        row.shift.toLowerCase().includes(query) ||
        row.notes.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;

      const matchesSchedule =
        scheduleFilter === "all" ||
        (scheduleFilter === "scheduled" && row.isScheduled) ||
        (scheduleFilter === "unscheduled" && !row.isScheduled);

      const matchesTeam = teamFilter === "all" || row.team === teamFilter;

      return matchesQuery && matchesStatus && matchesSchedule && matchesTeam;
    });
  }, [rosterRows, searchQuery, statusFilter, scheduleFilter, teamFilter]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedDate, searchQuery, statusFilter, scheduleFilter, teamFilter]);

  useEffect(() => {
    setNoteDrafts((prev) => {
      const next = { ...prev };

      rosterRows.forEach((row) => {
        if (!(row.id in next)) {
          next[row.id] = row.notes || "";
        }
      });

      return next;
    });
  }, [rosterRows]);

  useEffect(() => {
    return () => {
      Object.values(saveTimeouts).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, [saveTimeouts]);

  const pendingRequestCount = useMemo(() => {
    return scheduleRequests.filter((request) => request.status === "pending")
      .length;
  }, [scheduleRequests]);

  const showSavedIndicator = (rowId, message) => {
    setSaveIndicators((prev) => ({
      ...prev,
      [rowId]: message,
    }));

    window.setTimeout(() => {
      setSaveIndicators((prev) => {
        if (prev[rowId] !== message) return prev;
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
    }, 1800);
  };

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
      await assignEmployeeToDate(row.employee, {
        status: "working",
        shiftLabel: "8am–6pm",
        notes: "",
      });
      showSavedIndicator(row.id, "Scheduled");
    }
  };

  const bulkMarkStatus = async (status) => {
    const rows = filteredRoster.filter(
      (row) => selectedIds.has(row.id) && row.isScheduled,
    );
    for (const row of rows) {
      await updateScheduledEmployee(row.employee, {
        status,
      });
      showSavedIndicator(
        row.id,
        status === "off" ? "Marked day off" : "Status updated",
      );
    }
    setSelectedIds(new Set());
  };

  const toggleNotesExpanded = (id) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const queueNoteSave = (row, nextValue) => {
    const existingTimeout = saveTimeouts[row.id];
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeoutId = setTimeout(async () => {
      await updateScheduledEmployee(row.employee, {
        status: row.status,
        shiftLabel: row.shift,
        notes: nextValue,
      });

      showSavedIndicator(row.id, "Note saved");

      setSaveTimeouts((prev) => {
        const copy = { ...prev };
        delete copy[row.id];
        return copy;
      });
    }, 700);

    setSaveTimeouts((prev) => ({
      ...prev,
      [row.id]: timeoutId,
    }));
  };

  const flushNoteSave = async (row) => {
    const existingTimeout = saveTimeouts[row.id];
    if (existingTimeout) clearTimeout(existingTimeout);

    const value = noteDrafts[row.id] ?? "";

    await updateScheduledEmployee(row.employee, {
      status: row.status,
      shiftLabel: row.shift,
      notes: value,
    });

    showSavedIndicator(row.id, "Note saved");

    setSaveTimeouts((prev) => {
      const copy = { ...prev };
      delete copy[row.id];
      return copy;
    });
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
                placeholder="Search by name, role, team, shift, or notes..."
                className="w-full rounded-lg border border-black/10 bg-[#f1efe8] px-3 py-2 text-[13px] text-[#1a1a1a] outline-none placeholder:text-[#888780]"
              />
            </div>

            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-[#1a1a1a]"
            >
              <option value="all">All schedule states</option>
              <option value="scheduled">Scheduled</option>
              <option value="unscheduled">Unscheduled</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-[#1a1a1a]"
            >
              <option value="all">All statuses</option>
              <option value="working">Working</option>
              <option value="off">Day off</option>
              <option value="pending">Pending</option>
              <option value="unset">Unset</option>
            </select>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-[#1a1a1a]"
            >
              {teamOptions.map((team) => (
                <option key={team} value={team}>
                  {team === "all" ? "All teams" : team}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={bulkScheduleAll}
              disabled={
                !selectedDate || filteredRoster.every((row) => row.isScheduled)
              }
              className="rounded-lg border border-[#AFA9EC] bg-[#EEEDFE] px-3 py-2 text-[13px] font-medium text-[#3C3489] transition hover:bg-[#CECBF6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Schedule all visible
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
                onClick={() => bulkMarkStatus("working")}
                className="text-[12px] font-medium text-[#534AB7] hover:underline"
              >
                Mark working
              </button>
              <button
                type="button"
                onClick={() => bulkMarkStatus("off")}
                className="text-[12px] font-medium text-[#534AB7] hover:underline"
              >
                Mark day off
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[12px] font-medium text-[#534AB7] hover:underline"
              >
                Clear selection
              </button>
            </div>
          ) : null}

          <div className="overflow-visible rounded-xl border border-black/10">
            <div className="overflow-x-auto overflow-y-visible">
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
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRoster.map((row) => {
                    const isChecked = selectedIds.has(row.id);
                    const isNotesExpanded = expandedNotes.has(row.id);
                    const saveMessage = saveIndicators[row.id];

                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          className={`border-t border-black/5 ${
                            isChecked ? "bg-[#EEEDFE]" : "hover:bg-[#f8f7f5]"
                          }`}
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

                          <td className="px-3 py-3 align-middle">
                            {row.isScheduled ? (
                              row.status === "off" ? (
                                <span className="text-[#888780]">—</span>
                              ) : (
                                <div className="space-y-1">
                                  <select
                                    value={row.shift || ""}
                                    onChange={async (e) => {
                                      await updateScheduledEmployee(
                                        row.employee,
                                        {
                                          shiftLabel: e.target.value,
                                          status: row.status,
                                          notes: row.notes,
                                        },
                                      );
                                      showSavedIndicator(row.id, "Shift saved");
                                    }}
                                    className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[12px] text-[#1a1a1a]"
                                  >
                                    <option value="">Select shift</option>
                                    {defaultShiftOptions.map((shift) => (
                                      <option key={shift} value={shift}>
                                        {shift}
                                      </option>
                                    ))}
                                  </select>

                                  {saveMessage === "Shift saved" ? (
                                    <div className="text-[11px] font-medium text-green-600">
                                      Shift saved
                                    </div>
                                  ) : null}
                                </div>
                              )
                            ) : (
                              <span className="text-[#888780]">—</span>
                            )}
                          </td>

                          <td className="px-3 py-3 align-middle">
                            {row.isScheduled ? (
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => toggleNotesExpanded(row.id)}
                                  className="inline-flex items-center rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#3C3489] transition hover:bg-[#f8f7f5]"
                                >
                                  {row.notes ? "View / edit note" : "Add note"}
                                </button>

                                {saveMessage === "Note saved" ? (
                                  <div className="text-[11px] font-medium text-green-600">
                                    Note saved
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-[#b4b2a9]">
                                Not scheduled yet
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3 align-middle">
                            <div className="flex justify-end">
                              <ActionMenu
                                row={row}
                                onSchedule={async () => {
                                  await assignEmployeeToDate(row.employee, {
                                    status: "working",
                                    shiftLabel: "8am–6pm",
                                    notes: "",
                                  });
                                  showSavedIndicator(row.id, "Scheduled");
                                }}
                                onMarkWorking={async () => {
                                  await updateScheduledEmployee(row.employee, {
                                    status: "working",
                                    shiftLabel: row.shift || "8am–6pm",
                                    notes: row.notes,
                                  });
                                  showSavedIndicator(row.id, "Status updated");
                                }}
                                onMarkDayOff={async () => {
                                  await updateScheduledEmployee(row.employee, {
                                    status: "off",
                                    shiftLabel: "",
                                    notes: row.notes,
                                  });
                                  showSavedIndicator(row.id, "Marked day off");
                                }}
                                onUnschedule={async () => {
                                  await unscheduleEmployeeFromDate(
                                    row.employee,
                                  );
                                  showSavedIndicator(
                                    row.id,
                                    "Removed from date",
                                  );
                                }}
                              />
                            </div>
                          </td>
                        </tr>

                        {row.isScheduled && isNotesExpanded ? (
                          <tr className="border-t border-black/5 bg-[#faf9fe]">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="rounded-2xl border border-purple-100 bg-white p-4">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-gray-900">
                                    Notes for {row.name}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => toggleNotesExpanded(row.id)}
                                    className="text-xs font-medium text-[#534AB7] hover:underline"
                                  >
                                    Collapse
                                  </button>
                                </div>

                                <textarea
                                  value={noteDrafts[row.id] ?? row.notes ?? ""}
                                  onChange={(e) => {
                                    const nextValue = e.target.value;

                                    setNoteDrafts((prev) => ({
                                      ...prev,
                                      [row.id]: nextValue,
                                    }));

                                    queueNoteSave(row, nextValue);
                                  }}
                                  onBlur={() => flushNoteSave(row)}
                                  placeholder="Add scheduling notes, special instructions, vehicle info, turf notes, or exceptions..."
                                  rows={4}
                                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#b4b2a9]"
                                />
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })}

                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-[13px] text-[#888780]"
                      >
                        No staff matched the current filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <ScheduleRequestPanel
            projectId={project?.id || project?._id}
            selectedDate={selectedDate}
            scheduledEmployees={scheduledEmployees}
            currentUser={currentUser}
            onRequestCreated={refreshProject}
          />

          {scheduleRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-[#f8f7f5] px-4 py-8 text-center text-[13px] text-[#888780]">
              No schedule requests for this date.
            </div>
          ) : (
            scheduleRequests.map((request) => {
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
                      {request.staffName ||
                        request.name ||
                        `${request.staffFirstName || ""} ${request.staffLastName || ""}`.trim() ||
                        (() => {
                          const fallbackStaff = request.staffId
                            ? scheduledEmployeeMap.get(request.staffId)
                            : null;

                          return fallbackStaff
                            ? fallbackStaff.fullName ||
                                `${fallbackStaff.firstName || ""} ${fallbackStaff.lastName || ""}`.trim()
                            : "Unknown Staff";
                        })()}
                      <span className="ml-1 text-[12px] font-normal text-[#888780]">
                        · {requestTypeLabel(request.type)}
                      </span>
                    </div>
                    <div className="text-[13px] text-[#888780]">
                      {request.detail}
                    </div>
                  </div>

                  <div className="text-[12px] text-[#b4b2a9]">
                    {request.date}
                  </div>

                  <div className="ml-auto">
                    {isPending && userCanResolveRequests ? (
                      <RequestActionMenu
                        request={request}
                        onApprove={async (id) => {
                          await resolveScheduleRequest(id, "approved");
                        }}
                        onDeny={async (id) => {
                          await resolveScheduleRequest(id, "denied");
                        }}
                      />
                    ) : (
                      <span className="text-[12px] font-medium text-[#888780]">
                        {request.status === "approved"
                          ? "✓ Approved"
                          : request.status === "denied"
                            ? "✕ Denied"
                            : "Pending review"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleEmployees;
