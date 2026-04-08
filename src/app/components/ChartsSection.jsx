"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function ChartsSection({
  getEmployeeChartData,
  chartOptions,
  chartRange,
  setChartRange,
  handleFileChange,
  handleFileUpload,
  matchedData,
  applyKnockedDoors,
  handleResponseFileChange,
  handleResponseFileUpload,
  parsedResponseData,
  applySurveyResponses,
}) {
  const data = getEmployeeChartData?.() ?? { labels: [], datasets: [] };

  return (
    <div className="rounded-[28px] border border-purple-100 bg-white p-5 shadow-sm h-full">
      <div className="flex flex-col gap-4 mb-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Doors knocked & contact rate</h2>
          <p className="text-sm text-gray-500">Range controls keep the chart inside the canvassing workflow instead of turning it into a separate page.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 7, 14, 30].map((range) => (
            <button
              key={range}
              onClick={() => setChartRange(range)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold border transition-colors ${
                chartRange === range
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-purple-200 hover:text-purple-700 hover:bg-purple-50"
              }`}
            >
              {range === 1 ? "Day" : `${range} Days`}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[360px]">
        <Bar data={data} options={chartOptions} />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Upload production</h3>
          <p className="text-sm text-gray-500 mb-3">Import doors knocked and survey totals from your source file.</p>
          <div className="flex flex-col gap-3">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="text-sm" />
            <div className="flex flex-wrap gap-2">
              <button onClick={handleFileUpload} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors">
                Parse file
              </button>
              {matchedData?.length > 0 ? (
                <button onClick={applyKnockedDoors} className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-colors">
                  Apply matched results
                </button>
              ) : null}
            </div>
            {matchedData?.length > 0 ? (
              <p className="text-xs text-gray-500">{matchedData.length} rows matched and ready to apply.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Upload survey responses</h3>
          <p className="text-sm text-gray-500 mb-3">Keep survey import available without stealing the spotlight from the main chart.</p>
          <div className="flex flex-col gap-3">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleResponseFileChange} className="text-sm" />
            <div className="flex flex-wrap gap-2">
              <button onClick={handleResponseFileUpload} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">
                Parse responses
              </button>
              {parsedResponseData?.length > 0 ? (
                <button onClick={applySurveyResponses} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                  Apply responses
                </button>
              ) : null}
            </div>
            {parsedResponseData?.length > 0 ? (
              <p className="text-xs text-gray-500">{parsedResponseData.length} responses parsed and ready to import.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
