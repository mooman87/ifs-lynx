"use client";
import React from "react";
import { Bar } from "react-chartjs-2";

const ChartsSection = ({
  project,
  chartRange,
  setChartRange,
  getEmployeeChartData,
  chartOptions,
  handleFileChange,
  handleFileUpload,
  matchedData,
  applyKnockedDoors,
  handleResponseFileChange,
  handleResponseFileUpload,
  parsedResponseData,
  getResponseChartData,
  applySurveyResponses,
}) => {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">
          Knocked Doors &amp; Contact Rate
        </h2>
        <div className="mb-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="mb-2 block text-sm"
          />
          <button
            onClick={handleFileUpload}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
          >
            Parse Data
          </button>
        </div>
        {matchedData.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Matched Data</h4>
            <ul>
              {matchedData.map((entry, index) => (
                <li key={index} className="border p-2 mb-2 rounded text-sm">
                  <strong>{entry.matchedEmployee}:</strong> {entry.doorsKnocked} doors,{" "}
                  {entry.contactsMade} contacts
                </li>
              ))}
            </ul>
            <button
              onClick={applyKnockedDoors}
              className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
            >
              Apply to Project
            </button>
          </div>
        )}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setChartRange(1)}
            className={`px-3 py-1 rounded ${
              chartRange === 1 ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setChartRange(7)}
            className={`px-3 py-1 rounded ${
              chartRange === 7 ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setChartRange(14)}
            className={`px-3 py-1 rounded ${
              chartRange === 14 ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
          >
            14 Days
          </button>
          <button
            onClick={() => setChartRange(30)}
            className={`px-3 py-1 rounded ${
              chartRange === 30 ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
          >
            30 Days
          </button>
        </div>
        <Bar data={getEmployeeChartData()} options={chartOptions} />
      </div>

      {/* Survey Responses Chart Section */}
      {/* <div>
        <h2 className="text-xl font-semibold mb-3">Survey Responses</h2>
        <div className="mb-4">
          <input
            type="file"
            onChange={handleResponseFileChange}
            className="mb-2 block text-sm"
          />
          <button
            onClick={handleResponseFileUpload}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium"
          >
            Parse Response Data
          </button>
          {parsedResponseData.length > 0 && (
            <button
              onClick={applySurveyResponses}
              className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
            >
              Apply Responses
            </button>
          )}
        </div>
        {(project?.surveyResponses && project.surveyResponses.length > 0) ||
        parsedResponseData.length > 0 ? (
          <Bar
            data={getResponseChartData()}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: "Survey Response Breakdown by Question",
                },
                tooltip: {
                  mode: "index",
                  intersect: false,
                },
              },
              scales: {
                x: { stacked: true },
                y: { stacked: true },
              },
            }}
          />
        ) : (
          <p>No response data uploaded.</p>
        )}
      </div> */}
    </div>
  );
};

export default ChartsSection;
