"use client";
import React from "react";

const MetricCard = ({ label, value, tone = "default", helper }) => {
  return (
    <div className="rounded-[22px] border border-black/5 bg-[#f8f7fb] p-4 shadow-sm">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]">
        {label}
      </div>

      <div
        className={`text-[30px] font-bold leading-none tracking-[-0.03em] ${
          tone === "primary" ? "text-[#534AB7]" : "text-[#151b2f]"
        }`}
      >
        {value}
      </div>

      {helper ? (
        <div className="mt-1 text-xs text-[#94938c]">{helper}</div>
      ) : null}
    </div>
  );
};

const Projections = ({
  totalExpectedDoorsPerDay,
  calculatedStaffNeeded,
  calculatedDoorsPerStaff,
  project,
}) => {
  const currentStaff = project?.assignedEmployees?.length || 0;
  const staffGap = Math.max(0, (calculatedStaffNeeded || 0) - currentStaff);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        label="Doors Remaining"
        value={
          project?.doorsRemaining
            ? project.doorsRemaining.toLocaleString()
            : "--"
        }
        tone="purple"
        helper="Primary countdown metric"
      />
      <MetricCard
        label="Daily Project Goal"
        value={
          totalExpectedDoorsPerDay
            ? totalExpectedDoorsPerDay.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            : "--"
        }
        helper="Expected daily production pace"
      />
      <MetricCard
        label="Staff Needed"
        value={staffGap || 0}
        tone={staffGap > 0 ? "amber" : "default"}
        helper={`${currentStaff} currently assigned`}
      />
      <MetricCard
        label="Daily Canvasser Goal"
        value={
          calculatedDoorsPerStaff ? calculatedDoorsPerStaff.toFixed(0) : "--"
        }
        helper="Target per person per day"
      />
    </div>
  );
};

export default Projections;
