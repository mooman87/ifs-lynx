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

Chart.register(...registerables);

const isoDay = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
};

const getProjectId = (p) => p?.id || p?._id || null;

const getEmployeeId = (e) => e?.id || e?._id || null;

const ProjectClient = ({ initialProject, project: projectProp }) => {
  const params = useParams();
  const router = useRouter();
  const { selectedPage } = useDashboard();

  const [project, setProject] = useState(initialProject ?? projectProp ?? null);
  const [error, setError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [matchedData, setMatchedData] = useState([]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [chartRange, setChartRange] = useState(1);

  const [responseFile, setResponseFile] = useState(null);
  const [parsedResponseData, setParsedResponseData] = useState([]);

  const projectId = useMemo(() => getProjectId(project), [project]);
  const routeId = useMemo(() => params?.id, [params]);

  // ----------------------------
  // Fetch / refresh
  // ----------------------------
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

      // Coerce start/end into Date objects for DateSelector + range building
      const start = p?.startDate ? new Date(p.startDate) : null;
      const end = p?.endDate ? new Date(p.endDate) : null;

      const hydrated = {
        ...p,
        startDate: start && !Number.isNaN(start.getTime()) ? start : p?.startDate,
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

      // Build date range + sensible default selectedDate
      if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
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
        setSelectedDate(found || dates[0] || null);
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

  // ----------------------------
  // Project meta helpers
  // ----------------------------
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

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "N/A";

    let daysTranspired;
    if (today < startDate) daysTranspired = 0;
    else if (today > endDate) daysTranspired = durationDays;
    else daysTranspired = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

    if (startDate > today) {
      return `Project starts in ${Math.ceil((startDate - today) / (1000 * 60 * 60 * 24))} days`;
    }

    const timeDiff = endDate - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return daysRemaining >= 0 && startDate < today ? `Day ${daysTranspired} of ${durationDays}` : "Project Ended";
  };

  const totalExpectedDoorsPerDay =
    durationDays > 0 && project?.doorsRemaining ? project.doorsRemaining / durationDays : 0;

  const averageCapacity = 150;
  const calculatedStaffNeeded =
    totalExpectedDoorsPerDay > 0 ? Math.ceil(totalExpectedDoorsPerDay / averageCapacity) : 0;

  const calculatedDoorsPerStaff =
    calculatedStaffNeeded > 0 ? totalExpectedDoorsPerDay / calculatedStaffNeeded : 0;

  // ----------------------------
  // Edit project
  // ----------------------------
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

  // ----------------------------
  // Scheduling
  // ----------------------------
const assignEmployeeToDate = async (employee) => {
  if (!project || !selectedDate) return;

  const pid = project.id || project._id;
  const eid = employee.id || employee._id;
  const dateKey = selectedDate.toISOString().slice(0, 10);

  // ---------- optimistic UI update ----------
  setProject((prev) => {
    if (!prev) return prev;

    const prevSchedule = Array.isArray(prev.schedule) ? prev.schedule : [];
    const existingEntryIdx = prevSchedule.findIndex((e) => e?.date === dateKey);

    const employeeSlim = {
      id: eid,
      _id: eid,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
    };

    // clone schedule
    const nextSchedule = prevSchedule.map((e) => ({
      ...e,
      employees: Array.isArray(e?.employees) ? [...e.employees] : [],
    }));

    if (existingEntryIdx >= 0) {
      const entry = nextSchedule[existingEntryIdx];
      const ids = new Set(entry.employees.map((x) => x?.id || x?._id).filter(Boolean));
      if (!ids.has(eid)) entry.employees.push(employeeSlim);
    } else {
      nextSchedule.push({
        id: `tmp-${dateKey}`, // temporary key until server returns
        date: dateKey,
        employees: [employeeSlim],
      });
    }

    return { ...prev, schedule: nextSchedule };
  });

  // ---------- server write ----------
  try {
    const res = await fetch(`/api/project/${pid}/schedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ date: dateKey, employeeId: eid }),
    });

    const data = await res.json();

    if (res.ok) {
      // replace optimistic schedule with authoritative schedule
      if (data?.project) {
        setProject(data.project);
      } else {
        await refreshProject();
      }
    } else {
      console.error("Error scheduling employee:", data.message);
      // rollback to server truth
      await refreshProject();
    }
  } catch (err) {
    console.error("Error scheduling employee:", err);
    await refreshProject();
  }
};


  // ----------------------------
  // XLSX parsing: Production upload -> matchedData
  // ----------------------------
  const handleFileChange = (e) => setFile(e.target.files?.[0] ?? null);

  const matchEmployeesWithData = (data) => {
    const assigned = project?.assignedEmployees || [];
    if (!Array.isArray(assigned) || assigned.length === 0) return;

    const matchedResults = data.map((entry) => {
      const usernameMatch = String(entry.userName || "").match(/^IFS_([^_]+)_([^_]+)$/);
      if (!usernameMatch) return { ...entry, matchedEmployee: "No match" };

      const formattedUserName = usernameMatch[1];
      const firstInitial = formattedUserName.charAt(0);
      const lastName = formattedUserName.slice(1);

      const match = assigned.find((emp) => {
        const fn = emp?.firstName || "";
        const ln = emp?.lastName || "";
        return fn.charAt(0).toUpperCase() === firstInitial.toUpperCase() && ln.toLowerCase() === lastName.toLowerCase();
      });

      return {
        ...entry,
        matchedEmployee: match ? `${match.firstName} ${match.lastName}` : "No match",
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

      const targetHeadings = ["UserName", "Attempted Doors", "Door Took Surveys"];
      const headingRow = data[0] || [];
      const columnIndices = targetHeadings.map((heading) => headingRow.indexOf(heading));

      const extractedData = data.slice(1).map((row) => ({
        userName: row[columnIndices[0]] || "N/A",
        doorsKnocked: Number(row[columnIndices[1]] || 0),
        contactsMade: Number(row[columnIndices[2]] || 0),
      }));

      setParsedData(extractedData);
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

  // ----------------------------
  // Employee chart data (RESTORED)
  // Assumes employee API normalization provides:
  // - emp.doorsKnockedPerDay as object keyed by YYYY-MM-DD
  // - emp.contactsMadePerDay as object keyed by YYYY-MM-DD
  // ----------------------------
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

      const contactRate = totalDoors > 0 ? (totalContacts / totalDoors) * 100 : 0;
      contactRateArr.push(Number(contactRate.toFixed(2)));
    });

    return {
      labels: employeeNames,
      datasets: [
        {
          type: "bar",
          label: "Knocked Doors",
          data: knockedDoorsArr,
          // keep your styling if you want, but chart.js will render fine either way
          backgroundColor: "#8884d8",
          yAxisID: "y",
        },
        {
          type: "bar",
          label: "Contact Rate (%)",
          data: contactRateArr,
          borderColor: "#82ca9d",
          yAxisID: "y1",
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: { grid: { display: false } },
      y: {
        type: "linear",
        position: "left",
        title: { display: true, text: "Knocked Doors" },
        grid: { display: false },
      },
      y1: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Contact Rate (%)" },
        ticks: { callback: (val) => `${val}%` },
      },
    },
  };

  // ----------------------------
  // XLSX survey responses upload (RESTORED)
  // ----------------------------
  const handleResponseFileChange = (e) => setResponseFile(e.target.files?.[0] ?? null);

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
      project?.surveyResponses && project.surveyResponses.length > 0 ? project.surveyResponses : parsedResponseData;

    const questions = ["1", "2", "3", "4", "5"];
    const responsesByQuestion = {};
    questions.forEach((q) => (responsesByQuestion[q] = {}));

    (responses || []).forEach((item) => {
      const q = String(item.question || item.QuestionNo || item.Question || "");
      const resp = String(item.response || item.AnswerCode || item.Response || "");
      if (responsesByQuestion[q] !== undefined) {
        responsesByQuestion[q][resp] = (responsesByQuestion[q][resp] || 0) + 1;
      }
    });

    const allOptions = new Set();
    questions.forEach((q) => Object.keys(responsesByQuestion[q] || {}).forEach((opt) => allOptions.add(opt)));
    const responseOptions = Array.from(allOptions);

    const datasets = responseOptions.map((option, idx) => ({
      label: option,
      data: questions.map((q) => responsesByQuestion[q]?.[option] || 0),
      backgroundColor: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#888888"][idx % 5],
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

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="min-h-screen p-6">
      <div
        className="absolute top-6 right-9 cursor-pointer"
        onClick={() => router.push(`/dashboard?selectedPage=${encodeURIComponent(selectedPage)}`)}
      >
        <div className="line one"></div>
        <div className="line two"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        {error ? <p className="text-red-600">{error}</p> : null}

        <ProjectHeader
          project={project}
          averageCapacity={averageCapacity}
          getDaysRemaining={getDaysRemaining}
          selectedDate={selectedDate}
          setIsEditModalOpen={setIsEditModalOpen}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-6">
            <DateSelector dateRange={dateRange} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

            <Production project={project} selectedDate={selectedDate} calculatedDoorsPerStaff={calculatedDoorsPerStaff} />

            <ScheduleEmployees
              project={project}
              assignEmployeeToDate={assignEmployeeToDate}
              selectedDate={selectedDate}
            />

            <HotelDetails managerHotel={project?.managerHotel} staffHotel={project?.staffHotel} />
          </div>

          <div className="flex flex-col space-y-6">
            <Projections
              durationDays={durationDays}
              totalExpectedDoorsPerDay={totalExpectedDoorsPerDay}
              calculatedStaffNeeded={calculatedStaffNeeded}
              calculatedDoorsPerStaff={calculatedDoorsPerStaff}
              project={project}
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

        <SurveyBuilder
          projectSurvey={project?.survey}
          onSurveyUpdate={(survey) => setProject((prev) => ({ ...prev, survey }))}
        />
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
