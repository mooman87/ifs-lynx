"use client";
import React from "react";

const Projections = ({
  totalExpectedDoorsPerDay,
  calculatedStaffNeeded,
  calculatedDoorsPerStaff,
  project,
}) => {
  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-4">At a Glance</h3>
      <div 
        className="grid grid-cols-2 gap-4" 
        style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}
        suppressHydrationWarning
        >
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold">
            {project?.doorsRemaining
              ? project.doorsRemaining.toLocaleString()
              : "--"}
          </span>
          <span className="text-sm text-gray-600">Doors Remaining</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold">
            {totalExpectedDoorsPerDay
              ? totalExpectedDoorsPerDay.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : "--"}
          </span>
          <span className="text-sm text-gray-600">Daily Project Goal</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold">
            {calculatedStaffNeeded && project?.assignedEmployees
              ? calculatedStaffNeeded - project.assignedEmployees.length
              : "--"}
          </span>
          <span className="text-sm text-gray-600">Staff Needed</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold">
            {calculatedDoorsPerStaff
              ? calculatedDoorsPerStaff.toFixed(0)
              : "--"}
          </span>
          <span className="text-sm text-gray-600">Daily Canvasser Goal</span>
        </div>
      </div>
    </div>
  );
};

export default Projections;
