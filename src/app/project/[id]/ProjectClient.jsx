"use client";
import React, { useEffect, useState } from "react";
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

const ProjectClient = ({initialProject}) => {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [matchedData, setMatchedData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [chartRange, setChartRange] = useState(1);
  const { selectedPage } = useDashboard();
  const [responseFile, setResponseFile] = useState(null);
  const [parsedResponseData, setParsedResponseData] = useState([]);

  const handleEditSubmit = async (updatedFormData) => {
    try {
      const res = await fetch(`/api/project/${project._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFormData),
      });
  
      const data = await res.json();
      if (res.ok) {
        setProject(data.project); 
        setIsEditModalOpen(false); 
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };
  

  const assignEmployeeToDate = async (employee) => {
    if (!project || !selectedDate) return;
  
    try {
      const res = await fetch(`/api/project/${project._id}/schedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: selectedDate.toISOString().split("T")[0], employeeId: employee._id }),
      });
  
      const data = await res.json();
  
      if (res.ok) {

        const updatedRes = await fetch(`/api/project/${project._id}`);
        const updatedProject = await updatedRes.json();
  
        if (updatedRes.ok) {
          setProject(updatedProject.project);
        }
      } else {
        console.error("Error scheduling employee:", data.message);
      }
    } catch (error) {
      console.error("Error scheduling employee:", error);
    }
  };  

  const durationDays =
  project && project.startDate && project.endDate
    ? Math.max(
        1,
        Math.ceil(
          (new Date(project.endDate) - new Date(project.startDate)) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const getDaysRemaining = () => {
    if (!project || !project.startDate || !project.endDate) return "N/A"; 
    
    const today = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    let daysTranspired;
    if (today < startDate) {
      daysTranspired = 0;
    } else if (today > endDate) {
      daysTranspired = durationDays;
    } else {
      daysTranspired = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
    }
    
    if (startDate > today) {
      return `Project starts in ${Math.ceil((startDate - today) / (1000 * 60 * 60 * 24))} days`;
    }
    
    const timeDiff = endDate - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysRemaining >= 0 && startDate < today ? `Day ${daysTranspired} of ${durationDays}` : "Project Ended";
  };

  const handleEditChange = (e, section = null, field = null) => {
    const { name, value } = e.target;
  
    if (section) {
      setEditFormData((prevData) => ({
        ...prevData,
        [section]: {
          ...prevData[section],
          [field]: value,
        },
      }));
    } else {
      setEditFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };  

  const refreshProject = async () => {
    try {
      const res = await fetch(`/api/project/${id}`);
      const data = await res.json();
      if (res.ok) {
        // Convert date strings into Date objects
        const start = new Date(data.project.startDate);
        const end = new Date(data.project.endDate);

        setProject({
          ...data.project,
          startDate: start,
          endDate: end,
        });

        setEditFormData({
          campaignName: data.project.campaignName,
          doorCount: data.project.doorCount,
          startDate: data.project.startDate,
          endDate: data.project.endDate,
          stateDirector: data.project.stateDirector,
          managerHotel: data.project.managerHotel || {},
          staffHotel: data.project.staffHotel || {},
        });

        // Build the date range and set the selected date.
        if (start && end) {
          const dates = [];
          let currentDate = new Date(start);
          while (currentDate <= end) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }
          setDateRange(dates);

          const today = new Date();
          let defaultDate;
          if (today < start) defaultDate = start;
          else if (today > end) defaultDate = end;
          else defaultDate = today;

          const foundDefault = dates.find(
            (date) =>
              date.toISOString().split("T")[0] ===
              defaultDate.toISOString().split("T")[0]
          );
          setSelectedDate(foundDefault || dates[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching project.");
    }
  };

  // On mount (or when id changes), refresh the project data.
  useEffect(() => {
    // Even though initialProject comes from SSR, we refresh client-side in case of updates.
    refreshProject();
  }, [id]);
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
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
      const headingRow = data[0];
      const columnIndices = targetHeadings.map((heading) => headingRow.indexOf(heading));

      const extractedData = data.slice(1).map((row) => ({
        userName: row[columnIndices[0]] || "N/A",
        doorsKnocked: row[columnIndices[1]] || 0,
        contactsMade: row[columnIndices[2]] || 0,
      }));

      setParsedData(extractedData);
      matchEmployeesWithData(extractedData);
      setFile(null);
    };

    reader.readAsBinaryString(file);
  };

  const matchEmployeesWithData = (data) => {
    if (!project?.assignedEmployees) return;

    const matchedResults = data.map((entry) => {
      const usernameMatch = entry.userName.match(/^IFS_([^_]+)_([^_]+)$/);
      if (!usernameMatch) return { ...entry, matchedEmployee: "No match" };

      const formattedUserName = usernameMatch[1]; 
      const firstInitial = formattedUserName.charAt(0); 
      const lastName = formattedUserName.slice(1); 

      const match = project.assignedEmployees.find((employee) => {
        return (
          employee.firstName.charAt(0).toUpperCase() === firstInitial.toUpperCase() &&
          employee.lastName.toLowerCase() === lastName.toLowerCase()
        );
      });

      return {
        ...entry,
        matchedEmployee: match ? `${match.firstName} ${match.lastName}` : "No match",
      };
    });

    setMatchedData(matchedResults);
  };

  const applyKnockedDoors = async () => {
    if (!project || !selectedDate) return;
  
    try {
      const res = await fetch(`/api/project/${project._id}/apply-knocked-doors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedDate: selectedDate.toISOString().split("T")[0], 
          matchedData
        }),
      });
  
      const data = await res.json();
      if (res.ok) {
        const updatedRes = await fetch(`/api/project/${project._id}`);
        const updatedProject = await updatedRes.json();
  
        if (updatedRes.ok) {
          setProject(updatedProject.project);
          setFile(null);
          setMatchedData([]);
        }
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error applying knocked doors:", error);
    }
  };
  
  const labels = dateRange.map((date) => date.toISOString().split("T")[0]);

  const doorsKnockedData = labels.map((dateKey) => {
    return Object.values(project?.assignedEmployees || {}).reduce((sum, emp) => {
      return sum + (emp?.doorsKnockedPerDay?.[dateKey] || 0);
    }, 0);
  });


  const getEmployeeChartData = () => {
    if (!project || !selectedDate) {
      return { labels: [], datasets: [] };
    }

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
        const dateKey = current.toISOString().split("T")[0];
        totalDoors += emp?.doorsKnockedPerDay?.[dateKey] || 0;
        totalContacts += emp?.contactsMadePerDay?.[dateKey] || 0;
        current.setDate(current.getDate() + 1);
      }

      employeeNames.push(`${emp.firstName} ${emp.lastName}`);
      knockedDoorsArr.push(totalDoors);

      const contactRate = totalDoors > 0 ? (totalContacts / totalDoors) * 100 : 0;
      contactRateArr.push(contactRate.toFixed(2));
    });


    return {
      labels: employeeNames,
      datasets: [
        {
          type: "bar",
          label: "Knocked Doors",
          data: knockedDoorsArr,
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
      x: {
        grid: {
          display: false,
        }
      },
      y: {
        type: "linear",
        position: "left",
        title: {
          display: true,
          text: "Knocked Doors",
        },
        grid: {
          display: false,
        }
      },
      y1: {
        type: "linear",
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Contact Rate (%)",
        },
        ticks: {
          callback: (val) => val + "%",
        },
      },
    },
  };

  const handleResponseFileChange = (e) => {
    setResponseFile(e.target.files[0]);
  };

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
      const headingRow = data[0];
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
      project && project.surveyResponses && project.surveyResponses.length > 0
        ? project.surveyResponses
        : parsedResponseData;

    const questions = ["1", "2", "3", "4", "5"];
    const responsesByQuestion = {};
    questions.forEach((q) => {
      responsesByQuestion[q] = {};
    });
    responses.forEach((item) => {
      const q = item.question || item.Question; 
      const resp = item.response || item.Response;
      if (responsesByQuestion[q] !== undefined) {
        responsesByQuestion[q][resp] = (responsesByQuestion[q][resp] || 0) + 1;
      }
    });
    const allOptions = new Set();
    questions.forEach((q) => {
      Object.keys(responsesByQuestion[q]).forEach((option) => {
        allOptions.add(option);
      });
    });
    const responseOptions = Array.from(allOptions);
    const datasets = responseOptions.map((option, idx) => ({
      label: option,
      data: questions.map((q) => responsesByQuestion[q][option] || 0),
      backgroundColor: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#888888"][idx % 5],
    }));
    return {
      labels: questions,
      datasets,
    };
  };
  

  const applySurveyResponses = async () => {
    if (!project || parsedResponseData.length === 0) return;
    try {
      const res = await fetch(`/api/project/${project._id}/apply-responses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyResponses: parsedResponseData }),
      });
      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
        setParsedResponseData([]);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error applying survey responses:", error);
    }
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
    calculatedStaffNeeded > 0 ? totalExpectedDoorsPerDay / calculatedStaffNeeded : 0;



  return (
    <div className="min-h-screen p-6">
      
      <div
        className="absolute top-6 right-9 cursor-pointer"
        onClick={() =>
          router.push(`/dashboard?selectedPage=${encodeURIComponent(selectedPage)}`)
        }
      >
        <div className="line one"></div>
        <div className="line two"></div>
      </div>
      <div className="max-w-6xl mx-auto">
        <ProjectHeader project={project} averageCapacity={averageCapacity} getDaysRemaining={getDaysRemaining} selectedDate={selectedDate} setIsEditModalOpen={setIsEditModalOpen} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-6">
            <DateSelector dateRange={dateRange} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            <Production project={project} selectedDate={selectedDate} calculatedDoorsPerStaff={calculatedDoorsPerStaff} />
            <ScheduleEmployees project={project} assignEmployeeToDate={assignEmployeeToDate} />
            <HotelDetails
              managerHotel={project?.managerHotel}
              staffHotel={project?.staffHotel}
        />
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
          onSurveyUpdate={(survey) =>
            setProject((prev) => ({ ...prev, survey }))
          }
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
              [section]: { ...prev[section], [field]: value },
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
