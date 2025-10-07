"use client";
import React from "react";

const Production = ({ project, selectedDate, calculatedDoorsPerStaff }) => {
  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-2">
        Production for {selectedDate ? selectedDate.toDateString() : "—"}
      </h3>
      {selectedDate ? (
        <ul>
          {project?.schedule
            ?.find(
              (entry) =>
                entry.date === selectedDate.toISOString().split("T")[0]
            )
            ?.employees.map((empId) => {
              const emp = project?.assignedEmployees?.find(
                (e) => e._id === empId
              );
              if (!emp) return null;
              const dateKey = selectedDate.toISOString().split("T")[0];
              const doorsKnocked = emp?.doorsKnockedPerDay?.[dateKey] || 0;
              const contactsMade = emp?.contactsMadePerDay?.[dateKey] || 0;
              const requiredDoors = calculatedDoorsPerStaff;
              const bonusPercentage =
                requiredDoors > 0 && doorsKnocked > requiredDoors
                  ? Math.floor(
                      ((doorsKnocked - requiredDoors) / requiredDoors) * 100
                    )
                  : 0;
              const bonusAwarded = bonusPercentage >= 20;
              return (
                <li key={emp._id}>
                  <strong>{emp.firstName} {emp.lastName}:</strong>
                  <br/>
                   {doorsKnocked} doors,{" "}
                  {contactsMade} surveys
                  {bonusAwarded && (
                    <span className="ml-2 text-green-600 font-bold">
                      BONUS (+{bonusPercentage}% OVER GOAL)
                    </span>
                  )}
                </li>
              );
            }) || <p>No employees scheduled.</p>}
        </ul>
      ) : (
        <p className="text-gray-500">Select a date to view schedule.</p>
      )}
    </div>
  );
};

export default Production;
