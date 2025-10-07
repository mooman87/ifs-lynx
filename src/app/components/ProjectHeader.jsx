"use client";
import React from "react";
import { useDashboard } from "@/app/context/DashboardContext";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

const ProjectHeader = ({ project, getDaysRemaining, setIsEditModalOpen, selectedDate, averageCapacity }) => {
  const { user } = useDashboard(); // assume user is stored in context
  const router = useRouter();

  const generateReport = () => {
    const doc = new jsPDF();

    // Top header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Nightly Report", 105, 20, { align: "center" });

    // Reporter info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Report by:", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.text(` ${user ? user.fullName : "Unknown Reporter"}`, 41, 40);


    doc.setFont("helvetica", "bold");
    doc.text("Date:", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text(` ${selectedDate ? selectedDate.toDateString() : ""}`, 30, 50);

    // Calculate Today's Production values from the project data:
    const dateKey = selectedDate ? selectedDate.toISOString().split("T")[0] : null;
    let totalDoors = 0;
    let scheduledEmployeesCount = 0;
    if (project && dateKey && project.schedule) {
      const scheduleEntry = project.schedule.find((entry) => entry.date === dateKey);
      if (scheduleEntry) {
        scheduledEmployeesCount = scheduleEntry.employees.length;
        totalDoors = project.assignedEmployees.reduce((sum, emp) => {
          return sum + (emp.doorsKnockedPerDay?.[dateKey] || 0);
        }, 0);
      }
    }

    // Expected doors = averageCapacity * number of scheduled employees
    const expectedDoors = averageCapacity * scheduledEmployeesCount;
    const projectionPercentage = expectedDoors > 0 ? ((totalDoors / expectedDoors) * 100).toFixed(0) : "0";
    const avgDoorsPerCanvasser = scheduledEmployeesCount > 0 ? (totalDoors / scheduledEmployeesCount).toFixed(0) : "0";

    // "Today's Production" Section
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

    // Save the PDF file. You could customize the file name based on project name.
    doc.save(`${project.campaignName || "report"}.pdf`);
  };
  
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{project?.campaignName}</h1>
        <h2 className="text-lg text-gray-600 font-semibold">{getDaysRemaining()}</h2>
      </div>
      {user.role === "Super Admin" ? 
            <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center mt-4 md:mt-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
              viewBox="0 0 24 24"
              width={20}
              height={20}
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
          :
          <button
              onClick={generateReport}
              className="flex items-center mt-4 md:mt-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#ffffff"} fill={"none"}>
                <path d="M11 21H10C6.22876 21 4.34315 21 3.17157 19.8284C2 18.6569 2 16.7712 2 13V10C2 6.22876 2 4.34315 3.17157 3.17157C4.34315 2 6.22876 2 10 2H12C15.7712 2 17.6569 2 18.8284 3.17157C20 4.34315 20 6.22876 20 10V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.4069 14.4036C17.6192 13.8655 18.3808 13.8655 18.5931 14.4036L18.6298 14.4969C19.1482 15.8113 20.1887 16.8518 21.5031 17.3702L21.5964 17.4069C22.1345 17.6192 22.1345 18.3808 21.5964 18.5931L21.5031 18.6298C20.1887 19.1482 19.1482 20.1887 18.6298 21.5031L18.5931 21.5964C18.3808 22.1345 17.6192 22.1345 17.4069 21.5964L17.3702 21.5031C16.8518 20.1887 15.8113 19.1482 14.4969 18.6298L14.4036 18.5931C13.8655 18.3808 13.8655 17.6192 14.4036 17.4069L14.4969 17.3702C15.8113 16.8518 16.8518 15.8113 17.3702 14.4969L17.4069 14.4036Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 7H15M7 11.5H15M7 16H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Generate Report
            </button>}
    </header>
  );
};

export default ProjectHeader;
