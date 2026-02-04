"use client";
import React from "react";

const Production = ({ project, selectedDate, calculatedDoorsPerStaff }) => {
  const dateKey = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;

  const scheduleEntry = dateKey
    ? project?.schedule?.find((entry) => entry?.date === dateKey)
    : null;

  // Your API now returns employees as objects, not IDs.
  const scheduledEmployees = scheduleEntry?.employees || [];

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-2">
        Production for {selectedDate ? selectedDate.toDateString() : "—"}
      </h3>

      {!selectedDate ? (
        <p className="text-gray-500">Select a date to view schedule.</p>
      ) : scheduledEmployees.length === 0 ? (
        <p>No employees scheduled.</p>
      ) : (
        <ul>
          {scheduledEmployees.map((emp) => {
            if (!emp) return null;

            const doorsMap = emp.doorsKnockedPerDay ?? emp.doors_knocked_per_day ?? {};
            const contactsMap = emp.contactsMadePerDay ?? emp.contacts_made_per_day ?? {};

            const doorsKnocked = doorsMap?.[dateKey] || 0;
            const contactsMade = contactsMap?.[dateKey] || 0;

            const requiredDoors = calculatedDoorsPerStaff || 0;
            const bonusPercentage =
              requiredDoors > 0 && doorsKnocked > requiredDoors
                ? Math.floor(((doorsKnocked - requiredDoors) / requiredDoors) * 100)
                : 0;

            const bonusAwarded = bonusPercentage >= 20;

            return (
              <li key={emp._id ?? emp.id}>
                <strong>
                  {emp.firstName} {emp.lastName}:
                </strong>
                <br />
                {doorsKnocked} doors, {contactsMade} surveys
                {bonusAwarded && (
                  <span className="ml-2 text-green-600 font-bold">
                    BONUS (+{bonusPercentage}% OVER GOAL)
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Production;
