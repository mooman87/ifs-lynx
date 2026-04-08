"use client";
import React, { useMemo, useEffect } from "react";

const sameDay = (a, b) => {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
};

const formatCompact = (date) => {
  if (!date) return "No date selected";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

const DateSelector = ({ dateRange = [], selectedDate, setSelectedDate }) => {
  const selectedIndex = useMemo(() => {
    if (!selectedDate || !Array.isArray(dateRange)) return -1;
    return dateRange.findIndex((date) => sameDay(date, selectedDate));
  }, [dateRange, selectedDate]);

  const goToDateByOffset = (offset) => {
    if (!Array.isArray(dateRange) || dateRange.length === 0) return;

    if (selectedIndex === -1) {
      setSelectedDate(dateRange[0]);
      return;
    }

    const nextIndex = selectedIndex + offset;
    if (nextIndex < 0 || nextIndex >= dateRange.length) return;

    setSelectedDate(dateRange[nextIndex]);
  };

  useEffect(() => {
    if (!selectedDate && Array.isArray(dateRange) && dateRange.length > 0) {
      setSelectedDate(dateRange[0]);
    }
  }, [selectedDate, dateRange, setSelectedDate]);
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 rounded-[18px] border border-black/10 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => goToDateByOffset(-1)}
          disabled={selectedIndex <= 0}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-black/10 text-sm text-[#888780] transition hover:bg-[#f1efe8] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous date"
        >
          &#8249;
        </button>

        <div className="min-w-[92px] text-center text-[13px] font-medium text-[#1a1a1a]">
          {formatCompact(selectedDate)}
        </div>

        <button
          type="button"
          onClick={() => goToDateByOffset(1)}
          disabled={
            selectedIndex === -1 || selectedIndex >= dateRange.length - 1
          }
          className="flex h-7 w-7 items-center justify-center rounded-md border border-black/10 text-sm text-[#888780] transition hover:bg-[#f1efe8] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next date"
        >
          &#8250;
        </button>
      </div>
    </div>
  );
};

export default DateSelector;
