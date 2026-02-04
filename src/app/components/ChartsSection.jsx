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

// ✅ Required for Chart.js v3+ (otherwise charts often render as "nothing")
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
}) {
  const data = getEmployeeChartData?.() ?? { labels: [], datasets: [] };

  return (
    <div className="shadow p-6 rounded-lg bg-white mt-8">
      <h2 className="text-xl font-bold mb-4">Knocked Doors & Contact Rate</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setChartRange(1)}
          className={`px-3 py-1 rounded ${chartRange === 1 ? "lynx-bg text-white" : "bg-gray-200"}`}
        >
          Day
        </button>
        <button
          onClick={() => setChartRange(7)}
          className={`px-3 py-1 rounded ${chartRange === 7 ? "lynx-bg text-white" : "bg-gray-200"}`}
        >
          7 Days
        </button>
        <button
          onClick={() => setChartRange(14)}
          className={`px-3 py-1 rounded ${chartRange === 14 ? "lynx-bg text-white" : "bg-gray-200"}`}
        >
          14 Days
        </button>
        <button
          onClick={() => setChartRange(30)}
          className={`px-3 py-1 rounded ${chartRange === 30 ? "lynx-bg text-white" : "bg-gray-200"}`}
        >
          30 Days
        </button>
      </div>

      <Bar data={data} options={chartOptions} />
    </div>
  );
}
