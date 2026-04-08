"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/app/context/DashboardContext";
import { useParams, useRouter } from "next/navigation";
import ProjectModal from "@/app/components/ProjectModal";
import * as XLSX from "xlsx";
import { Chart, registerables } from "chart.js";
import "../../project/project.css";

import ProjectHeader from "@/app/components/ProjectHeader";
import DateSelector from "@/app/components/DateSelector";
import Production from "@/app/components/Production";
import ScheduleEmployees from "@/app/components/ScheduleEmployees";
import Projections from "@/app/components/Projections";
import ChartsSection from "@/app/components/ChartsSection";
import HotelDetails from "@/app/components/HotelDetails";
import SurveyBuilder from "@/app/components/SurveyBuilder";
import FundraisingTab from "@/app/components/FundraisingTab";
import CommsTab from "@/app/components/CommsTab";
import ProjectMap from "@/app/components/ProjectMap";
import BlackBox from "@/app/components/BlackBox";
import ProjectRoleManager from "@/app/components/ProjectRoleManager";

Chart.register(...registerables);

const isoDay = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
};

const getProjectId = (p) => p?.id || p?._id || null;
const getEmployeeId = (e) => e?.id || e?._id || null;

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "canvassing", label: "Canvassing" },
  { id: "staff", label: "Staff & Scheduling" },
  { id: "logistics", label: "Logistics" },
  { id: "survey", label: "Survey & Script" },
  { id: "fundraising", label: "Fundraising" },
  { id: "comms", label: "Comms" },
  { id: "blackbox", label: "BlackBox" },
];

const ProjectClient = ({ initialProject, project: projectProp }) => {
  const params = useParams();
  const router = useRouter();
  const { selectedPage } = useDashboard();

  const [project, setProject] = useState(initialProject ?? projectProp ?? null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const [file, setFile] = useState(null);
  const [matchedData, setMatchedData] = useState([]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [chartRange, setChartRange] = useState(1);

  const [responseFile, setResponseFile] = useState(null);
  const [parsedResponseData, setParsedResponseData] = useState([]);

  const projectId = useMemo(() => getProjectId(project), [project]);
  const routeId = useMemo(() => params?.id, [params]);

  const refreshProject = async () => {
    try {
      const id = routeId || projectId;
      if (!id) return;

      const res = await fetch(`/api/project/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error fetching project.");

      const p = data.project ?? data;
      const start = p?.startDate ? new Date(p.startDate) : null;
      const end = p?.endDate ? new Date(p.endDate) : null;

      const hydrated = {
        ...p,
        startDate:
          start && !Number.isNaN(start.getTime()) ? start : p?.startDate,
        endDate: end && !Number.isNaN(end.getTime()) ? end : p?.endDate,
      };

      setProject(hydrated);
      setEditFormData({
        campaignName: hydrated?.campaignName ?? "",
        doorCount: hydrated?.doorCount ?? "",
        startDate: hydrated?.startDate ?? "",
        endDate: hydrated?.endDate ?? "",
        stateDirector: hydrated?.stateDirector ?? "",
        managerHotel: hydrated?.managerHotel || {},
        staffHotel: hydrated?.staffHotel || {},
      });

      if (
        start &&
        end &&
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime())
      ) {
        const dates = [];
        let cur = new Date(start);
        while (cur <= end) {
          dates.push(new Date(cur));
          cur.setDate(cur.getDate() + 1);
        }
        setDateRange(dates);

        const today = new Date();
        let defaultDate = today;
        if (today < start) defaultDate = start;
        else if (today > end) defaultDate = end;

        const found = dates.find((d) => isoDay(d) === isoDay(defaultDate));
        setSelectedDate((prev) => prev ?? found ?? dates[0] ?? null);
      } else {
        setDateRange([]);
        setSelectedDate(null);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error fetching project.");
    }
  };

  useEffect(() => {
    refreshProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const durationDays = useMemo(() => {
    if (!project?.startDate || !project?.endDate) return 0;
    const a = new Date(project.startDate);
    const b = new Date(project.endDate);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.max(1, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
  }, [project?.startDate, project?.endDate]);

  const getDaysRemaining = () => {
    if (!project?.startDate || !project?.endDate) return "N/A";

    const today = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
      return "N/A";

    let daysTranspired;
    if (today < startDate) daysTranspired = 0;
    else if (today > endDate) daysTranspired = durationDays;
    else
      daysTranspired = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

    if (startDate > today) {
      return `Project starts in ${Math.ceil((startDate - today) / (1000 * 60 * 60 * 24))} days`;
    }

    const timeDiff = endDate - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return daysRemaining >= 0 && startDate < today
      ? `Day ${daysTranspired} of ${durationDays}`
      : "Project Ended";
  };

  const totalExpectedDoorsPerDay =
    durationDays > 0 && project?.doorsRemaining
      ? project.doorsRemaining / durationDays
      : 0;

  const averageCapacity = 150;
  const calculatedStaffNeeded =
    totalExpectedDoorsPerDay > 0
      ? Math.ceil(totalExpectedDoorsPerDay / averageCapacity)
      : 0;

  const calculatedDoorsPerStaff =
    calculatedStaffNeeded > 0
      ? totalExpectedDoorsPerDay / calculatedStaffNeeded
      : 0;

  const selectedDateKey = selectedDate ? isoDay(selectedDate) : null;

  const scheduledEmployeesForSelectedDate = useMemo(() => {
    if (!selectedDateKey) return [];
    const entry = project?.schedule?.find(
      (item) => item?.date === selectedDateKey,
    );
    return entry?.employees || [];
  }, [project?.schedule, selectedDateKey]);

  const todayTotals = useMemo(() => {
    if (!selectedDateKey) return { doors: 0, contacts: 0, contactRate: 0 };

    const totals = (project?.assignedEmployees || []).reduce(
      (acc, emp) => {
        acc.doors += Number(emp?.doorsKnockedPerDay?.[selectedDateKey] || 0);
        acc.contacts += Number(emp?.contactsMadePerDay?.[selectedDateKey] || 0);
        return acc;
      },
      { doors: 0, contacts: 0 },
    );

    return {
      ...totals,
      contactRate:
        totals.doors > 0 ? (totals.contacts / totals.doors) * 100 : 0,
    };
  }, [project?.assignedEmployees, selectedDateKey]);

  const handleEditSubmit = async (updatedFormData) => {
    try {
      const id = getProjectId(project) || routeId;
      const res = await fetch(`/api/project/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedFormData),
      });

      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
        setIsEditModalOpen(false);
        await refreshProject();
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error("Error updating project:", err);
    }
  };

  const assignEmployeeToDate = async (employee) => {
    if (!project || !selectedDate) return;

    const pid = project.id || project._id;
    const eid = employee.id || employee._id;
    const dateKey = selectedDate.toISOString().slice(0, 10);

    setProject((prev) => {
      if (!prev) return prev;

      const prevSchedule = Array.isArray(prev.schedule) ? prev.schedule : [];
      const existingEntryIdx = prevSchedule.findIndex(
        (e) => e?.date === dateKey,
      );

      const employeeSlim = {
        id: eid,
        _id: eid,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
      };

      const nextSchedule = prevSchedule.map((e) => ({
        ...e,
        employees: Array.isArray(e?.employees) ? [...e.employees] : [],
      }));

      if (existingEntryIdx >= 0) {
        const entry = nextSchedule[existingEntryIdx];
        const ids = new Set(
          entry.employees.map((x) => x?.id || x?._id).filter(Boolean),
        );
        if (!ids.has(eid)) entry.employees.push(employeeSlim);
      } else {
        nextSchedule.push({
          id: `tmp-${dateKey}`,
          date: dateKey,
          employees: [employeeSlim],
        });
      }

      return { ...prev, schedule: nextSchedule };
    });

    try {
      const res = await fetch(`/api/project/${pid}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date: dateKey, employeeId: eid }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data?.project) setProject(data.project);
        else await refreshProject();
      } else {
        console.error("Error scheduling employee:", data.message);
        await refreshProject();
      }
    } catch (err) {
      console.error("Error scheduling employee:", err);
      await refreshProject();
    }
  };

  const handleFileChange = (e) => setFile(e.target.files?.[0] ?? null);

  const matchEmployeesWithData = (data) => {
    const assigned = project?.assignedEmployees || [];
    if (!Array.isArray(assigned) || assigned.length === 0) return;

    const matchedResults = data.map((entry) => {
      const usernameMatch = String(entry.userName || "").match(
        /^IFS_([^_]+)_([^_]+)$/,
      );
      if (!usernameMatch) return { ...entry, matchedEmployee: "No match" };

      const formattedUserName = usernameMatch[1];
      const firstInitial = formattedUserName.charAt(0);
      const lastName = formattedUserName.slice(1);

      const match = assigned.find((emp) => {
        const fn = emp?.firstName || "";
        const ln = emp?.lastName || "";
        return (
          fn.charAt(0).toUpperCase() === firstInitial.toUpperCase() &&
          ln.toLowerCase() === lastName.toLowerCase()
        );
      });

      return {
        ...entry,
        matchedEmployee: match
          ? `${match.firstName} ${match.lastName}`
          : "No match",
      };
    });

    setMatchedData(matchedResults);
  };

  const handleFileUpload = () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const targetHeadings = [
        "UserName",
        "Attempted Doors",
        "Door Took Surveys",
      ];
      const headingRow = data[0] || [];
      const columnIndices = targetHeadings.map((heading) =>
        headingRow.indexOf(heading),
      );

      const extractedData = data.slice(1).map((row) => ({
        userName: row[columnIndices[0]] || "N/A",
        doorsKnocked: Number(row[columnIndices[1]] || 0),
        contactsMade: Number(row[columnIndices[2]] || 0),
      }));

      matchEmployeesWithData(extractedData);
      setFile(null);
    };

    reader.readAsBinaryString(file);
  };

  const applyKnockedDoors = async () => {
    if (!project || !selectedDate) return;

    try {
      const id = getProjectId(project) || routeId;
      const res = await fetch(`/api/project/${id}/apply-knocked-doors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          selectedDate: isoDay(selectedDate),
          matchedData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshProject();
        setFile(null);
        setMatchedData([]);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error("Error applying knocked doors:", err);
    }
  };

  const getEmployeeChartData = () => {
    if (!project || !selectedDate) return { labels: [], datasets: [] };

    const endDate = new Date(selectedDate);
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - (chartRange - 1));

    const employeeNames = [];
    const knockedDoorsArr = [];
    const contactRateArr = [];

    (project?.assignedEmployees || []).forEach((emp) => {
      let totalDoors = 0;
      let totalContacts = 0;

      const current = new Date(startDate);
      while (current <= endDate) {
        const dateKey = isoDay(current);
        totalDoors += Number(emp?.doorsKnockedPerDay?.[dateKey] || 0);
        totalContacts += Number(emp?.contactsMadePerDay?.[dateKey] || 0);
        current.setDate(current.getDate() + 1);
      }

      employeeNames.push(`${emp.firstName} ${emp.lastName}`);
      knockedDoorsArr.push(totalDoors);

      const contactRate =
        totalDoors > 0 ? (totalContacts / totalDoors) * 100 : 0;
      contactRateArr.push(Number(contactRate.toFixed(2)));
    });

    return {
      labels: employeeNames,
      datasets: [
        {
          type: "bar",
          label: "Knocked Doors",
          data: knockedDoorsArr,
          backgroundColor: "#7c3aed",
          yAxisID: "y",
          borderRadius: 8,
        },
        {
          type: "line",
          label: "Contact Rate (%)",
          data: contactRateArr,
          backgroundColor: "#f59e0b",
          yAxisID: "y1",
          borderRadius: 8,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { usePointStyle: true, boxWidth: 10 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6b7280" },
      },
      y: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        title: { display: true, text: "Knocked Doors" },
        ticks: { color: "#6b7280" },
        grid: { color: "rgba(124, 58, 237, 0.08)" },
      },
      y1: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Contact Rate (%)" },
        ticks: { callback: (val) => `${val}%`, color: "#6b7280" },
      },
    },
  };

  const handleResponseFileChange = (e) =>
    setResponseFile(e.target.files?.[0] ?? null);

  const handleResponseFileUpload = () => {
    if (!responseFile) {
      alert("Please select a response file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headingRow = data[0] || [];
      const voterIdx = headingRow.indexOf("VoterID");
      const questionIdx = headingRow.indexOf("QuestionNo");
      const responseIdx = headingRow.indexOf("AnswerCode");
      const timestampIdx = headingRow.indexOf("CreatedDate");

      const responses = data.slice(1).map((row) => ({
        VoterID: row[voterIdx],
        QuestionNo: row[questionIdx],
        AnswerCode: row[responseIdx],
        CreatedDate: row[timestampIdx],
      }));

      setParsedResponseData(responses);
      setResponseFile(null);
    };

    reader.readAsBinaryString(responseFile);
  };

  const getResponseChartData = () => {
    const responses =
      project?.surveyResponses && project.surveyResponses.length > 0
        ? project.surveyResponses
        : parsedResponseData;

    const questions = ["1", "2", "3", "4", "5"];
    const responsesByQuestion = {};
    questions.forEach((q) => (responsesByQuestion[q] = {}));

    (responses || []).forEach((item) => {
      const q = String(item.question || item.QuestionNo || item.Question || "");
      const resp = String(
        item.response || item.AnswerCode || item.Response || "",
      );
      if (responsesByQuestion[q] !== undefined) {
        responsesByQuestion[q][resp] = (responsesByQuestion[q][resp] || 0) + 1;
      }
    });

    const allOptions = new Set();
    questions.forEach((q) =>
      Object.keys(responsesByQuestion[q] || {}).forEach((opt) =>
        allOptions.add(opt),
      ),
    );
    const responseOptions = Array.from(allOptions);

    const datasets = responseOptions.map((option, idx) => ({
      label: option,
      data: questions.map((q) => responsesByQuestion[q]?.[option] || 0),
      backgroundColor: ["#7c3aed", "#f59e0b", "#14b8a6", "#ec4899", "#64748b"][
        idx % 5
      ],
      borderRadius: 8,
    }));

    return { labels: questions, datasets };
  };

  const applySurveyResponses = async () => {
    if (!project || parsedResponseData.length === 0) return;

    try {
      const id = getProjectId(project) || routeId;
      const res = await fetch(`/api/project/${id}/apply-responses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ surveyResponses: parsedResponseData }),
      });

      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
        setParsedResponseData([]);
        await refreshProject();
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error("Error applying survey responses:", err);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "canvassing":
        return (
          <div className="space-y-6">
            <DateSelector
              dateRange={dateRange}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.4fr] gap-6 items-start">
              <div className="space-y-6 min-w-0">
                <Production
                  project={project}
                  selectedDate={selectedDate}
                  calculatedDoorsPerStaff={calculatedDoorsPerStaff}
                />
              </div>

              <div className="min-w-0">
                <ChartsSection
                  project={project}
                  chartRange={chartRange}
                  setChartRange={setChartRange}
                  getEmployeeChartData={getEmployeeChartData}
                  chartOptions={chartOptions}
                  handleFileChange={handleFileChange}
                  handleFileUpload={handleFileUpload}
                  matchedData={matchedData}
                  applyKnockedDoors={applyKnockedDoors}
                  handleResponseFileChange={handleResponseFileChange}
                  handleResponseFileUpload={handleResponseFileUpload}
                  parsedResponseData={parsedResponseData}
                  getResponseChartData={getResponseChartData}
                  applySurveyResponses={applySurveyResponses}
                />
              </div>
            </div>

            <div className="w-full min-w-0">
              <ProjectMap />
            </div>
          </div>
        );

      case "staff":
        return (
          <div className="space-y-6">
            <DateSelector
              dateRange={dateRange}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ScheduleEmployees
                project={project}
                assignEmployeeToDate={assignEmployeeToDate}
                selectedDate={selectedDate}
              />
            </div>
            <ProjectRoleManager
              projectId={project.id}
              staff={project.assignedEmployees || []}
            />
          </div>
        );

      case "logistics":
        return (
          <div className="space-y-6">
            <HotelDetails
              managerHotel={project?.managerHotel}
              staffHotel={project?.staffHotel}
            />
            <div className="bg-white border border-dashed border-purple-200 rounded-3xl p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M3 10L12 4L21 10V20H3V10Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 20V14H15V20"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Logistics workspace
              </h3>
              <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                This tab gives you a clean home for hotels now, with room to add
                map view, travel, turf, and other operational logistics next
                without crowding the canvassing workflow.
              </p>
            </div>
          </div>
        );

      case "survey":
        return (
          <div className="space-y-6">
            <SurveyBuilder
              projectSurvey={project?.survey}
              onSurveyUpdate={(survey) =>
                setProject((prev) => ({ ...prev, survey }))
              }
            />
          </div>
        );
      case "fundraising":
        return (
          <div className="space-y-6">
            <FundraisingTab />
          </div>
        );
      case "comms":
        return (
          <div className="space-y-6">
            <CommsTab />
          </div>
        );
      case "blackbox":
        return (
          <div className="space-y-6">
            <BlackBox />
          </div>
        );

      case "overview":
      default:
        return (
          <div className="space-y-6">
            <DateSelector
              dateRange={dateRange}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />

            <Projections
              durationDays={durationDays}
              totalExpectedDoorsPerDay={totalExpectedDoorsPerDay}
              calculatedStaffNeeded={calculatedStaffNeeded}
              calculatedDoorsPerStaff={calculatedDoorsPerStaff}
              project={project}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
                  Doors today
                </p>
                <p className="text-3xl font-bold text-purple-700">
                  {todayTotals.doors.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  For{" "}
                  {selectedDate
                    ? selectedDate.toDateString()
                    : "the selected date"}
                </p>
              </div>
              <div className="bg-white border border-amber-100 rounded-3xl p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
                  Contact rate
                </p>
                <p className="text-3xl font-bold text-amber-600">
                  {todayTotals.contactRate.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Based on doors knocked vs. contacts made
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400 mb-2">
                  Staff in field
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {scheduledEmployeesForSelectedDate.length}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Scheduled for the selected date
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.35fr] gap-6">
              <Production
                project={project}
                selectedDate={selectedDate}
                calculatedDoorsPerStaff={calculatedDoorsPerStaff}
              />
              <ChartsSection
                project={project}
                chartRange={chartRange}
                setChartRange={setChartRange}
                getEmployeeChartData={getEmployeeChartData}
                chartOptions={chartOptions}
                handleFileChange={handleFileChange}
                handleFileUpload={handleFileUpload}
                matchedData={matchedData}
                applyKnockedDoors={applyKnockedDoors}
                handleResponseFileChange={handleResponseFileChange}
                handleResponseFileUpload={handleResponseFileUpload}
                parsedResponseData={parsedResponseData}
                getResponseChartData={getResponseChartData}
                applySurveyResponses={applySurveyResponses}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <button
        type="button"
        className="absolute top-6 right-9 h-9 w-9 rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 flex items-center justify-center"
        onClick={() =>
          router.push(
            `/dashboard?selectedPage=${encodeURIComponent(selectedPage)}`,
          )
        }
        aria-label="Close project details"
      >
        <div className="relative h-4 w-4">
          <span className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 rotate-45 rounded-full bg-current" />
          <span className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
        </div>
      </button>

      <div className="max-w-7xl mx-auto">
        {error ? <p className="text-red-600 mb-4">{error}</p> : null}

        <ProjectHeader
          project={project}
          averageCapacity={averageCapacity}
          getDaysRemaining={getDaysRemaining}
          selectedDate={selectedDate}
          setIsEditModalOpen={setIsEditModalOpen}
        />

        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    isActive
                      ? "border-purple-600 text-purple-700"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {renderTabContent()}
      </div>

      {isEditModalOpen && (
        <ProjectModal
          isOpen={isEditModalOpen}
          toggleModal={() => setIsEditModalOpen(false)}
          formData={editFormData}
          handleChange={(e, section, field) => {
            const { name, value } = e.target;
            if (section) {
              setEditFormData((prev) => ({
                ...prev,
                [section]: { ...(prev[section] || {}), [field]: value },
              }));
            } else {
              setEditFormData((prev) => ({ ...prev, [name]: value }));
            }
          }}
          handleSubmit={handleEditSubmit}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default ProjectClient;
