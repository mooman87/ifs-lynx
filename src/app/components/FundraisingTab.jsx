"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
);

const currency = (value = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const mockFundraisingData = {
  overview: {
    totalRaised: 184320,
    totalRaisedDelta: "▲ 12% vs last week",
    totalRaisedDeltaTone: "up",
    goal: 250000,
    goalSubtext: "74% to goal",
    donors: 1048,
    donorsDelta: "▲ 38 this week",
    donorsDeltaTone: "up",
    avgDonation: 175,
    avgDonationDelta: "▼ $12 vs last week",
    avgDonationDeltaTone: "warn",
    remaining: 65680,
    deadlineLabel: "Deadline: Apr 15, 2025",
    trend: {
      "7d": {
        labels: [
          "Mar 13",
          "Mar 14",
          "Mar 15",
          "Mar 16",
          "Mar 17",
          "Mar 18",
          "Mar 19",
        ],
        raised: [4200, 6800, 9100, 5500, 11200, 8400, 12300],
        donors: [24, 38, 51, 31, 63, 48, 69],
      },
      "30d": {
        labels: ["Mar 1", "Mar 5", "Mar 10", "Mar 15", "Mar 19"],
        raised: [18000, 32000, 51000, 38000, 45320],
        donors: [102, 181, 288, 215, 262],
      },
      all: {
        labels: ["Jan", "Feb", "Mar"],
        raised: [42000, 68000, 74320],
        donors: [240, 385, 423],
      },
    },
    topFundraisers: [
      {
        rank: 1,
        initials: "JL",
        name: "Jeremy Lese",
        donors: 142,
        amount: 28400,
        tone: "gold",
        width: 100,
      },
      {
        rank: 2,
        initials: "CR",
        name: "Christopher R.",
        donors: 98,
        amount: 19600,
        tone: "silver",
        width: 69,
      },
      {
        rank: 3,
        initials: "NW",
        name: "Nolan W.",
        donors: 87,
        amount: 17400,
        tone: "bronze",
        width: 61,
      },
      {
        rank: 4,
        initials: "LW",
        name: "Laronday W.",
        donors: 76,
        amount: 15200,
        width: 54,
      },
      {
        rank: 5,
        initials: "GC",
        name: "Gary C.",
        donors: 65,
        amount: 13000,
        width: 46,
      },
    ],
    sources: [
      {
        icon: "🚪",
        iconBg: "bg-[#EEEDFE]",
        name: "Door-to-door",
        percent: 48,
        amount: 88474,
        barWidth: 72,
        barColor: "#7F77DD",
      },
      {
        icon: "🌐",
        iconBg: "bg-[#E1F5EE]",
        name: "Online page",
        percent: 30,
        amount: 55296,
        barWidth: 45,
        barColor: "#5DCAA5",
      },
      {
        icon: "🤝",
        iconBg: "bg-[#FAEEDA]",
        name: "Major donor",
        percent: 18,
        amount: 33178,
        barWidth: 28,
        barColor: "#EF9F27",
      },
      {
        icon: "🏛",
        iconBg: "bg-[#f1efe8]",
        name: "PAC / bundled",
        percent: 4,
        amount: 7372,
        barWidth: 10,
        barColor: "#B4B2A9",
      },
    ],
  },
  donors: {
    total: 1048,
    page: 1,
    totalPages: 2,
    rows: [
      {
        id: "1",
        initials: "RH",
        avatarClass: "bg-[#FAEEDA] text-[#633806]",
        name: "Robert Harmon",
        location: "Philadelphia, PA",
        employer: "Self-employed",
        totalGiven: 3300,
        limitUsedPercent: 100,
        limitTone: "red",
        source: "Major donor",
        sourceTone: "major",
        lastGift: "Mar 12, 2025",
        compliance: "At limit",
        complianceTone: "over",
      },
      {
        id: "2",
        initials: "SM",
        avatarClass: "bg-[#CECBF6] text-[#3C3489]",
        name: "Sandra Mills",
        location: "Austin, TX",
        employer: "Mills Realty Group",
        totalGiven: 2100,
        limitUsedPercent: 64,
        limitTone: "amber",
        source: "Online",
        sourceTone: "online",
        lastGift: "Mar 15, 2025",
        compliance: "Near limit",
        complianceTone: "warn",
      },
      {
        id: "3",
        initials: "DK",
        avatarClass: "bg-[#E1F5EE] text-[#085041]",
        name: "David Kim",
        location: "Pittsburgh, PA",
        employer: "Kim & Associates",
        totalGiven: 500,
        limitUsedPercent: 15,
        limitTone: "purple",
        source: "Door-to-door",
        sourceTone: "door",
        lastGift: "Mar 19, 2025",
        compliance: "Clear",
        complianceTone: "ok",
      },
      {
        id: "4",
        initials: "PA",
        avatarClass: "bg-[#f1efe8] text-[#444441]",
        name: "Patriot Action PAC",
        location: "Washington, DC",
        employer: "PAC",
        totalGiven: 7372,
        limitUsedPercent: 100,
        limitTone: "purple",
        limitLabel: "PAC",
        source: "PAC / bundled",
        sourceTone: "pac",
        lastGift: "Mar 10, 2025",
        compliance: "PAC rules",
        complianceTone: "pac",
      },
      {
        id: "5",
        initials: "TW",
        avatarClass: "bg-[#CECBF6] text-[#3C3489]",
        name: "Tamara Webb",
        location: "Houston, TX",
        employer: "Webb Consulting",
        totalGiven: 250,
        limitUsedPercent: 8,
        limitTone: "purple",
        source: "Door-to-door",
        sourceTone: "door",
        lastGift: "Mar 19, 2025",
        compliance: "Clear",
        complianceTone: "ok",
      },
    ],
  },
  compliance: {
    flagsCount: 2,
    flags: [
      {
        id: "flag-1",
        tone: "red",
        title: "Robert Harmon has reached the $3,300 FEC contribution limit",
        detail:
          "Any additional contributions from this donor will be an FEC violation. Lynx will block further collection automatically.",
      },
      {
        id: "flag-2",
        tone: "amber",
        title: "Sandra Mills is at 64% of the FEC limit ($2,100 of $3,300)",
        detail:
          "Canvassers have been notified not to solicit further contributions without manager review.",
      },
    ],
    filings: [
      {
        id: "fec-april",
        tone: "fec",
        name: "FEC Form 3 — April quarterly report",
        detail:
          "Covers Jan 1 – Mar 31, 2025 · $184,320 itemized · 1,048 donors",
        due: "Due Apr 15",
        dueTone: "soon",
        cta: "Prepare filing →",
      },
      {
        id: "pa-april",
        tone: "pa",
        name: "PA DSEB-502 — Campaign finance report",
        detail: "Pennsylvania Dept. of State · covers through Mar 31, 2025",
        due: "Due Apr 14",
        dueTone: "soon",
        cta: "Prepare filing →",
      },
      {
        id: "tx-july",
        tone: "tx",
        name: "TX TEC Form COH — Semiannual report",
        detail: "Texas Ethics Commission · covers Jan 1 – Jun 30, 2025",
        due: "Due Jul 15",
        dueTone: "ok",
        cta: "Prepare filing →",
      },
      {
        id: "fec-jan",
        tone: "fec",
        name: "FEC Form 3 — January quarterly report",
        detail: "Covers Oct 1 – Dec 31, 2024 · Filed on time",
        due: "✓ Filed Jan 31",
        dueTone: "filed",
        cta: "Filed",
        filed: true,
      },
    ],
  },
};

const shellCard = "rounded-[28px] border border-black/10 bg-white shadow-sm";
const sectionCard = "rounded-[24px] border border-black/10 bg-white shadow-sm";
const surfaceCard = "rounded-[20px] border border-black/5 bg-[#fcfbff]";

function ToneText({ tone, children }) {
  const cls =
    tone === "up"
      ? "text-[#3B6D11]"
      : tone === "warn"
        ? "text-[#BA7517]"
        : "text-[#888780]";
  return <div className={`mt-1 text-xs font-medium ${cls}`}>{children}</div>;
}

function WorkspaceTab({ active, children, badge }) {
  return (
    <button
      type="button"
      className={`whitespace-nowrap border-b-2 px-4 py-3 text-[15px] font-semibold transition ${
        active
          ? "border-[#7F77DD] text-[#534AB7]"
          : "border-transparent text-[#6f6e68] hover:text-[#1a1a1a]"
      }`}
    >
      {children}
      {badge ? (
        <span className="ml-1.5 rounded-full bg-[#f1efe8] px-1.5 py-[1px] text-[11px] font-medium text-[#888780]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function SubTabButton({ active, onClick, children, alert }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
        active
          ? "border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489]"
          : "border-transparent bg-transparent text-[#7a7972] hover:bg-[#f3f1ec] hover:text-[#1a1a1a]"
      }`}
    >
      <span>{children}</span>
      {alert ? (
        <span className="ml-1.5 rounded-full bg-[#FCEBEB] px-1.5 py-[1px] text-[11px] font-medium text-[#791F1F]">
          {alert}
        </span>
      ) : null}
    </button>
  );
}

function RangePill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489]"
          : "border-black/10 bg-white text-[#7a7972] hover:bg-[#f3f1ec]"
      }`}
    >
      {children}
    </button>
  );
}

function SectionHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-2 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
            {eyebrow}
          </div>
        ) : null}
        <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#151b2f]">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 text-sm text-[#7a7972]">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

function SourcePill({ tone, children }) {
  const cls =
    tone === "door"
      ? "bg-[#EEEDFE] text-[#3C3489]"
      : tone === "online"
        ? "bg-[#E1F5EE] text-[#085041]"
        : tone === "major"
          ? "bg-[#FAEEDA] text-[#633806]"
          : "bg-[#f1efe8] text-[#5F5E5A]";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

function CompliancePill({ tone, children }) {
  const cls =
    tone === "ok"
      ? "bg-[#EAF3DE] text-[#27500A]"
      : tone === "warn"
        ? "bg-[#FAEEDA] text-[#633806]"
        : tone === "over"
          ? "bg-[#FCEBEB] text-[#791F1F]"
          : "bg-[#EEEDFE] text-[#3C3489]";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

function FilingIcon({ tone }) {
  const bg =
    tone === "fec"
      ? "bg-[#EEEDFE]"
      : tone === "pa"
        ? "bg-[#E1F5EE]"
        : "bg-[#FAEEDA]";
  const fill =
    tone === "fec" ? "#AFA9EC" : tone === "pa" ? "#9FE1CB" : "#FAC775";
  const line =
    tone === "fec" ? "#3C3489" : tone === "pa" ? "#085041" : "#633806";

  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" fill={fill} />
        <rect x="4" y="6" width="8" height="1.5" rx=".75" fill={line} />
        <rect x="4" y="9" width="5" height="1.5" rx=".75" fill={line} />
      </svg>
    </div>
  );
}

function ProgressLimit({ percent, tone, label }) {
  const fill =
    tone === "red" ? "#E24B4A" : tone === "amber" ? "#EF9F27" : "#7F77DD";
  const text =
    tone === "red"
      ? "text-[#791F1F]"
      : tone === "amber"
        ? "text-[#BA7517]"
        : "text-[#7a7972]";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-[70px] overflow-hidden rounded-full bg-[#f1efe8]">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: fill }}
        />
      </div>
      <span className={`text-[11px] font-semibold ${text}`}>
        {label || `${percent}%`}
      </span>
    </div>
  );
}

function KpiCard({ label, value, subtext, tone = "default" }) {
  return (
    <div className="rounded-[22px] border border-black/5 bg-[#f8f7fb] p-4 shadow-sm">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]">
        {label}
      </div>
      <div
        className={`text-[30px] font-bold leading-none tracking-[-0.03em] ${
          tone === "primary" ? "text-[#534AB7]" : "text-[#151b2f]"
        }`}
      >
        {value}
      </div>
      {subtext}
    </div>
  );
}

function OverviewSection({ data, range, setRange }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const trendData = data.trend[range];

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      data: {
        labels: trendData.labels,
        datasets: [
          {
            type: "bar",
            label: "Raised",
            data: trendData.raised,
            backgroundColor: "#B4AFF2",
            borderRadius: 10,
            maxBarThickness: 52,
            yAxisID: "y",
          },
          {
            type: "line",
            label: "Donors",
            data: trendData.donors,
            borderColor: "#EF9F27",
            backgroundColor: "transparent",
            pointBackgroundColor: "#EF9F27",
            pointRadius: 3,
            tension: 0.35,
            borderWidth: 2,
            yAxisID: "y2",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: "#8a8983" },
            border: { display: false },
          },
          y: {
            position: "left",
            grid: { color: "rgba(34,34,34,0.06)" },
            border: { display: false },
            ticks: {
              font: { size: 11 },
              color: "#8a8983",
              callback: (v) => `$${Math.round(v / 1000)}k`,
            },
          },
          y2: {
            position: "right",
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11 }, color: "#BA7517" },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [trendData]);

  const goalPercent = Math.min((data.totalRaised / data.goal) * 100, 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total raised"
          value={currency(data.totalRaised)}
          tone="primary"
          subtext={
            <ToneText tone={data.totalRaisedDeltaTone}>
              {data.totalRaisedDelta}
            </ToneText>
          }
        />
        <KpiCard
          label="Goal"
          value={currency(data.goal)}
          subtext={<ToneText tone="muted">{data.goalSubtext}</ToneText>}
        />
        <KpiCard
          label="Total donors"
          value={data.donors.toLocaleString()}
          subtext={
            <ToneText tone={data.donorsDeltaTone}>{data.donorsDelta}</ToneText>
          }
        />
        <KpiCard
          label="Avg donation"
          value={currency(data.avgDonation)}
          subtext={
            <ToneText tone={data.avgDonationDeltaTone}>
              {data.avgDonationDelta}
            </ToneText>
          }
        />
      </div>

      <div className={`${shellCard} p-5 md:p-6`}>
        <SectionHeader
          title="Fundraising trend"
          subtitle="Track raised dollars against donor activity over time."
          right={
            <div className="flex gap-2">
              <RangePill active={range === "7d"} onClick={() => setRange("7d")}>
                7 days
              </RangePill>
              <RangePill
                active={range === "30d"}
                onClick={() => setRange("30d")}
              >
                30 days
              </RangePill>
              <RangePill
                active={range === "all"}
                onClick={() => setRange("all")}
              >
                All time
              </RangePill>
            </div>
          }
        />

        <div className="mb-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#8a8983]">
            <span>{currency(data.totalRaised)} raised</span>
            <span>{currency(data.goal)} goal</span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-[#f1efe8]">
            <div
              className="h-full rounded-full bg-[#7F77DD]"
              style={{ width: `${goalPercent}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8a8983]">
            <span>{currency(data.remaining)} remaining</span>
            <span>{data.deadlineLabel}</span>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-4">
          <span className="flex items-center gap-2 text-xs text-[#8a8983]">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-[#B4AFF2]" />
            Raised
          </span>
          <span className="flex items-center gap-2 text-xs text-[#8a8983]">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-[#EF9F27]" />
            Donors
          </span>
        </div>

        <div className="relative h-[260px] w-full">
          <canvas ref={chartRef} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className={`${sectionCard} p-5 md:p-6`}>
          <SectionHeader
            eyebrow="Leaderboard"
            title="Top fundraisers"
            subtitle="Highest-performing staff and leadership by dollars raised."
          />

          <div className="space-y-1">
            {data.topFundraisers.map((row) => (
              <div
                key={`${row.rank}-${row.name}`}
                className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#fcfbff] px-3 py-3"
              >
                <div
                  className={`w-5 shrink-0 text-center text-xs font-bold ${
                    row.tone === "gold"
                      ? "text-[#BA7517]"
                      : row.tone === "silver"
                        ? "text-[#5F5E5A]"
                        : row.tone === "bronze"
                          ? "text-[#993C1D]"
                          : "text-[#888780]"
                  }`}
                >
                  {row.rank}
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#CECBF6] text-[11px] font-semibold text-[#3C3489]">
                  {row.initials}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-[#151b2f]">
                    {row.name}
                  </div>
                  <div className="text-xs text-[#8a8983]">
                    {row.donors} donors
                  </div>
                </div>

                <div className="min-w-[86px] text-right">
                  <div className="text-[14px] font-semibold text-[#151b2f]">
                    {currency(row.amount)}
                  </div>
                </div>

                <div className="h-1.5 w-[64px] shrink-0 overflow-hidden rounded-full bg-[#f1efe8]">
                  <div
                    className="h-full rounded-full bg-[#7F77DD]"
                    style={{ width: `${row.width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${sectionCard} p-5 md:p-6`}>
          <SectionHeader
            eyebrow="Attribution"
            title="By source"
            subtitle="Where contributions are being captured."
          />

          <div className="space-y-2">
            {data.sources.map((source) => (
              <div
                key={source.name}
                className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#fcfbff] px-3 py-3"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${source.iconBg}`}
                >
                  {source.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-[#151b2f]">
                    {source.name}
                  </div>
                  <div className="mt-1 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-[#f1efe8]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${source.barWidth}%`,
                        backgroundColor: source.barColor,
                      }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#8a8983]">
                    {source.percent}%
                  </div>
                  <div className="text-[13px] font-semibold text-[#151b2f]">
                    {currency(source.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DonorsSection({ data, onAddDonor }) {
  return (
    <div className="space-y-4">
      <div className={`${shellCard} p-5 md:p-6`}>
        <SectionHeader
          eyebrow="Donor management"
          title="Contributions"
          subtitle="Search, review, and monitor donor records and compliance exposure."
          right={
            <button
              type="button"
              onClick={onAddDonor}
              className="inline-flex items-center justify-center rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
            >
              + Add donor
            </button>
          }
        />

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search donors by name, employer, zip..."
            className="min-w-[220px] flex-1 rounded-2xl border border-black/10 bg-[#f8f7fb] px-4 py-3 text-sm text-[#151b2f] outline-none placeholder:text-[#8a8983] focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]"
          />
          <button
            type="button"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#7a7972] transition hover:bg-[#f3f1ec]"
          >
            Source ▾
          </button>
          <button
            type="button"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#7a7972] transition hover:bg-[#f3f1ec]"
          >
            Status ▾
          </button>
        </div>
      </div>

      <div className={`${shellCard} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#faf9fd]">
                {[
                  "Donor",
                  "Employer",
                  "Total given",
                  "FEC limit used",
                  "Source",
                  "Last gift",
                  "Compliance",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="border-b border-black/10 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-[#faf9fd]">
                  <td className="border-b border-black/5 px-4 py-3 align-middle">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${row.avatarClass}`}
                      >
                        {row.initials}
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-[#151b2f]">
                          {row.name}
                        </div>
                        <div className="text-xs text-[#8a8983]">
                          {row.location}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="border-b border-black/5 px-4 py-3 text-sm text-[#7a7972]">
                    {row.employer}
                  </td>

                  <td className="border-b border-black/5 px-4 py-3 text-sm font-semibold text-[#151b2f]">
                    {currency(row.totalGiven)}
                  </td>

                  <td className="border-b border-black/5 px-4 py-3">
                    <ProgressLimit
                      percent={row.limitUsedPercent}
                      tone={row.limitTone}
                      label={row.limitLabel}
                    />
                  </td>

                  <td className="border-b border-black/5 px-4 py-3">
                    <SourcePill tone={row.sourceTone}>{row.source}</SourcePill>
                  </td>

                  <td className="border-b border-black/5 px-4 py-3 text-sm text-[#7a7972]">
                    {row.lastGift}
                  </td>

                  <td className="border-b border-black/5 px-4 py-3">
                    <CompliancePill tone={row.complianceTone}>
                      {row.compliance}
                    </CompliancePill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/5 px-4 py-4 text-sm text-[#7a7972] md:flex-row md:items-center md:justify-between">
          <span>
            Showing {data.rows.length} of {data.total.toLocaleString()} donors
          </span>

          <div className="flex gap-1.5">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-xs text-[#7a7972]"
            >
              &#8249;
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#AFA9EC] bg-[#EEEDFE] text-xs font-semibold text-[#3C3489]"
            >
              1
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-xs text-[#7a7972]"
            >
              2
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-xs text-[#7a7972]"
            >
              &#8250;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceSection({ data }) {
  return (
    <div className="space-y-4">
      <div className={`${shellCard} p-5 md:p-6`}>
        <SectionHeader
          eyebrow="Compliance"
          title="Active flags"
          subtitle={`${data.flagsCount} items currently need attention or review.`}
        />

        <div className="space-y-3">
          {data.flags.map((flag) => (
            <div
              key={flag.id}
              className="flex flex-col gap-3 rounded-[22px] border border-black/5 bg-[#fcfbff] p-4 md:flex-row md:items-start md:justify-between"
            >
              <div className="flex gap-3">
                <div
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    flag.tone === "red" ? "bg-[#E24B4A]" : "bg-[#EF9F27]"
                  }`}
                />
                <div>
                  <div className="text-[14px] font-semibold text-[#151b2f]">
                    {flag.title}
                  </div>
                  <div className="mt-1 text-sm text-[#7a7972]">
                    {flag.detail}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="whitespace-nowrap rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
              >
                View donor
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={`${shellCard} p-5 md:p-6`}>
        <SectionHeader
          eyebrow="Calendar"
          title="Filing schedule"
          subtitle="Upcoming and completed reporting obligations."
          right={
            <div className="flex gap-1.5">
              <span className="rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-3 py-1 text-xs font-semibold text-[#3C3489]">
                FEC
              </span>
              <span className="rounded-full border border-[#5DCAA5] bg-[#E1F5EE] px-3 py-1 text-xs font-semibold text-[#085041]">
                PA
              </span>
              <span className="rounded-full border border-[#EF9F27] bg-[#FAEEDA] px-3 py-1 text-xs font-semibold text-[#633806]">
                TX
              </span>
            </div>
          }
        />

        <div className="space-y-3">
          {data.filings.map((filing) => (
            <div
              key={filing.id}
              className="flex flex-col gap-3 rounded-[22px] border border-black/5 bg-[#fcfbff] p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <FilingIcon tone={filing.tone} />

                <div>
                  <div className="text-[14px] font-semibold text-[#151b2f]">
                    {filing.name}
                  </div>
                  <div className="mt-1 text-sm text-[#7a7972]">
                    {filing.detail}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`whitespace-nowrap text-xs font-semibold ${
                    filing.dueTone === "soon"
                      ? "text-[#BA7517]"
                      : filing.dueTone === "filed"
                        ? "text-[#3B6D11]"
                        : "text-[#7a7972]"
                  }`}
                >
                  {filing.due}
                </div>

                <button
                  type="button"
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${
                    filing.filed
                      ? "cursor-default border-[#97C459] bg-[#EAF3DE] text-[#27500A]"
                      : "border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489] transition hover:bg-[#CECBF6]"
                  }`}
                >
                  {filing.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FundraisingTab({
  data = mockFundraisingData,
  onAddDonor = () => {},
}) {
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [range, setRange] = useState("7d");

  const complianceAlert = useMemo(
    () => `${data.compliance.flagsCount} flags`,
    [data.compliance.flagsCount],
  );

  return (
    <div className="px-0 py-6 pb-10">
      <div className="mb-6 flex flex-wrap gap-2">
        <SubTabButton
          active={activeSubTab === "overview"}
          onClick={() => setActiveSubTab("overview")}
        >
          Overview
        </SubTabButton>

        <SubTabButton
          active={activeSubTab === "donors"}
          onClick={() => setActiveSubTab("donors")}
        >
          Donors
        </SubTabButton>

        <SubTabButton
          active={activeSubTab === "compliance"}
          onClick={() => setActiveSubTab("compliance")}
          alert={complianceAlert}
        >
          Compliance & filings
        </SubTabButton>
      </div>

      {activeSubTab === "overview" && (
        <OverviewSection
          data={data.overview}
          range={range}
          setRange={setRange}
        />
      )}

      {activeSubTab === "donors" && (
        <DonorsSection data={data.donors} onAddDonor={onAddDonor} />
      )}

      {activeSubTab === "compliance" && (
        <ComplianceSection data={data.compliance} />
      )}
    </div>
  );
}
