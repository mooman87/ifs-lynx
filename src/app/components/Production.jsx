"use client";
import React from "react";

const Production = ({ project, selectedDate, calculatedDoorsPerStaff }) => {
  const dateKey = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;

  const scheduleEntry = dateKey
    ? project?.schedule?.find((entry) => entry?.date === dateKey)
    : null;

  const scheduledEmployees = scheduleEntry?.employees || [];

  const leaderboard = scheduledEmployees
    .map((emp) => {
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

      return {
        ...emp,
        doorsKnocked,
        contactsMade,
        bonusPercentage,
        bonusAwarded: bonusPercentage >= 20,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.doorsKnocked - a.doorsKnocked);

  return (
    <div className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Production leaderboard</h3>
          <p className="text-sm text-gray-500">
            {selectedDate ? `Performance for ${selectedDate.toDateString()}` : "Select a date to view schedule."}
          </p>
        </div>
        {selectedDate ? (
          <div className="rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            Goal: {calculatedDoorsPerStaff ? calculatedDoorsPerStaff.toFixed(0) : 0} doors
          </div>
        ) : null}
      </div>

      {!selectedDate ? (
        <p className="text-gray-500">Select a date to view schedule.</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-gray-500">No employees scheduled.</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((emp, index) => {
            const initials = `${emp.firstName?.[0] || "?"}${emp.lastName?.[0] || "?"}`;
            const progressPercent = calculatedDoorsPerStaff
              ? Math.min(100, Math.round((emp.doorsKnocked / calculatedDoorsPerStaff) * 100))
              : 0;

            return (
              <div
                key={emp._id ?? emp.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`text-sm font-bold w-6 text-center ${index === 0 ? "text-amber-600" : index === 1 ? "text-gray-500" : index === 2 ? "text-orange-700" : "text-gray-400"}`}>
                    {index + 1}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {emp.firstName} {emp.lastName}
                      </p>
                      {emp.bonusAwarded ? (
                        <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                          Bonus +{emp.bonusPercentage}%
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-500">
                      {emp.doorsKnocked} doors • {emp.contactsMade} surveys
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{emp.doorsKnocked}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-400">doors</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${emp.bonusAwarded ? "bg-purple-600" : "bg-amber-500"}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Production;
