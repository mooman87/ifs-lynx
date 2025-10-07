"use client";
import React from "react";

const AssignedStaff = ({ assignedEmployees }) => {
  return (
    <div className="bg-white rounded shadow p-4 mt-8">
      <h2 className="text-xl font-semibold mb-3">Assigned Staff</h2>
      {assignedEmployees && assignedEmployees.length > 0 ? (
        <ul>
          {assignedEmployees.map((employee) => (
            <li key={employee._id} className="py-1">
              {employee.firstName} {employee.lastName}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No staff assigned to this project yet.</p>
      )}
    </div>
  );
};

export default AssignedStaff;
