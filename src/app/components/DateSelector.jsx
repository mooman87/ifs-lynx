
"use client";
import React, { useEffect, useRef } from "react";

const DateSelector = ({ dateRange, selectedDate, setSelectedDate }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const selectedElement = containerRef.current.querySelector(".selected");
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selectedDate]);

  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Select a Date</h3>
      <div
        ref={containerRef}
        className="flex overflow-x-auto space-x-2 pb-2 scroll-smooth"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {dateRange.map((date, index) => {
          const isSelected =
            selectedDate?.toDateString() === date.toDateString();
          return (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 text-sm rounded-lg transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-indigo-600 text-white font-bold selected"
                  : "bg-gray-200 text-gray-600"
              }`}
              style={{ scrollSnapAlign: "center" }}
            >
              {date.toDateString()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateSelector;
