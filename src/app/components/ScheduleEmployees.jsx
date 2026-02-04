"use client";
import React, { useMemo } from "react";

const ScheduleEmployees = ({ project, assignEmployeeToDate, selectedDate }) => {
  const dateKey = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;

  const scheduledIds = useMemo(() => {
    if (!dateKey) return new Set();
    const entry = project?.schedule?.find((e) => e?.date === dateKey);
    const emps = entry?.employees || [];
    return new Set(emps.map((e) => e?.id ?? e?._id).filter(Boolean));
  }, [project?.schedule, dateKey]);

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Schedule Employees</h3>
      <p className="text-sm text-gray-600 mb-2">
        Click on an employee to schedule them for the selected date.
      </p>

      {!selectedDate ? (
        <p className="text-gray-500 text-sm">Select a date first.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mt-2">
          {(project?.assignedEmployees || []).map((employee) => {
            const eid = employee.id ?? employee._id;
            const isScheduled = scheduledIds.has(eid);

            return (
              <button
                key={eid}
                className={`rounded px-3 py-2 text-sm font-medium flex items-center ${
                  isScheduled
                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
                disabled={isScheduled}
                onClick={() => assignEmployeeToDate(employee)}
                title={isScheduled ? "Already scheduled for this date" : "Schedule employee"}
              >
                <span className="mr-2 font-bold">
                  {employee.firstName} {employee.lastName}
                </span>
                {!isScheduled && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    className="inline-block"
                  >
                    <path
                      d="M12 4V20M20 12H4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScheduleEmployees;
