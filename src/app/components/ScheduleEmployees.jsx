"use client";
import React from "react";

const ScheduleEmployees = ({ project, assignEmployeeToDate }) => {
  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Schedule Employees</h3>
      <p className="text-sm text-gray-600 mb-2">
        Click on an employee to schedule them for the selected date.
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {project?.assignedEmployees?.map((employee) => (
          <button
            key={employee._id}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-2 text-sm font-medium flex items-center"
            onClick={() => assignEmployeeToDate(employee)}
          >
            <span className="mr-2 font-bold">
              {employee.firstName} {employee.lastName}
            </span>
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
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScheduleEmployees;
