"use client";
import React from "react";
import { useDashboard } from "@/app/context/DashboardContext";
import jsPDF from "jspdf";

const ProjectHeader = ({
  project,
  getDaysRemaining,
  setIsEditModalOpen,
  selectedDate,
  averageCapacity,
}) => {
  const { user } = useDashboard();

  const generateReport = () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Nightly Report", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Report by:", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.text(` ${user ? user.fullName : "Unknown Reporter"}`, 41, 40);

    doc.setFont("helvetica", "bold");
    doc.text("Date:", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text(` ${selectedDate ? selectedDate.toDateString() : ""}`, 30, 50);

    const dateKey = selectedDate
      ? selectedDate.toISOString().split("T")[0]
      : null;
    let totalDoors = 0;
    let scheduledEmployeesCount = 0;
    if (project && dateKey && project.schedule) {
      const scheduleEntry = project.schedule.find(
        (entry) => entry.date === dateKey,
      );
      if (scheduleEntry) {
        scheduledEmployeesCount = scheduleEntry.employees.length;
        totalDoors = project.assignedEmployees.reduce((sum, emp) => {
          return sum + (emp.doorsKnockedPerDay?.[dateKey] || 0);
        }, 0);
      }
    }

    const expectedDoors = averageCapacity * scheduledEmployeesCount;
    const projectionPercentage =
      expectedDoors > 0 ? ((totalDoors / expectedDoors) * 100).toFixed(0) : "0";
    const avgDoorsPerCanvasser =
      scheduledEmployeesCount > 0
        ? (totalDoors / scheduledEmployeesCount).toFixed(0)
        : "0";

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Today's Production", 20, 70);
    doc.setFontSize(12);

    let y = 80;
    doc.setFont("helvetica", "bold");
    doc.text("Total Doors:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(` ${totalDoors}`, 45, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("% of Projection:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(` ${projectionPercentage}%`, 51, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("# of Canvassers in Field:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(` ${scheduledEmployeesCount}`, 69, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Average Doors/Canvasser:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(` ${avgDoorsPerCanvasser}`, 73, y);

    doc.save(`${project.campaignName || "report"}.pdf`);
  };

  return (
    <header className="mt-10 mb-6 rounded-[28px] border border-purple-100 bg-white/90 backdrop-blur px-6 py-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {getDaysRemaining()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              {project?.campaignName}
            </h1>
          </div>
        </div>

        {user?.role === "Super Admin" ? (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill="none"
            >
              <path
                d="M15.2141 5.98239L16.6158 4.58063C17.39 3.80646 18.6452 3.80646 19.4194 4.58063C20.1935 5.3548 20.1935 6.60998 19.4194 7.38415L18.0176 8.78591M15.2141 5.98239L6.98023 14.2163C5.93493 15.2616 5.41226 15.7842 5.05637 16.4211C4.70047 17.058 4.3424 18.5619 4 20C5.43809 19.6576 6.94199 19.2995 7.57889 18.9436C8.21579 18.5877 8.73844 18.0651 9.78375 17.0198L18.0176 8.78591M15.2141 5.98239L18.0176 8.78591"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 20H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Edit Project
          </button>
        ) : (
          <button
            onClick={generateReport}
            className="inline-flex items-center justify-center rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill="none"
              className="mr-2"
            >
              <path
                d="M11 21H10C6.22876 21 4.34315 21 3.17157 19.8284C2 18.6569 2 16.7712 2 13V10C2 6.22876 2 4.34315 3.17157 3.17157C4.34315 2 6.22876 2 10 2H12C15.7712 2 17.6569 2 18.8284 3.17157C20 4.34315 20 6.22876 20 10V10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 21H18C19.1046 21 20 20.1046 20 19V15M20 15L16.5 18.5M20 15L16.5 11.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Export Nightly Report
          </button>
        )}
      </div>
    </header>
  );
};

export default ProjectHeader;
