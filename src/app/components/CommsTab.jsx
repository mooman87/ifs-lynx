"use client";

import React, { useMemo, useState } from "react";

const commsData = {
  overview: {
    kpis: [
      {
        label: "Total sends this week",
        value: "148,320",
        tone: "primary",
        subtext: "▲ 18% vs last week",
        subTone: "up",
      },
      {
        label: "Avg delivery rate",
        value: "96.4%",
        subtext: "▲ 0.8pt",
        subTone: "up",
      },
      {
        label: "Avg engagement rate",
        value: "24.1%",
        subtext: "opens + clicks + replies",
        subTone: "muted",
      },
      {
        label: "Conversions",
        value: "1,840",
        subtext: "▲ donations + signups",
        subTone: "up",
      },
    ],
    recentCampaigns: [
      {
        channel: "sms",
        name: "GOTV text blast — Iowa districts",
        meta: "SMS · 42,000 recipients · Mar 19",
        status: "Sent",
        metrics: [
          { value: "94.2%", label: "Delivered" },
          { value: "31.8%", label: "Replied" },
        ],
      },
      {
        channel: "email",
        name: "April fundraising push — donor list",
        meta: "Email · 8,400 recipients · Scheduled Apr 1",
        status: "Scheduled",
        metrics: [
          { value: "—", label: "Delivered" },
          { value: "—", label: "Opened" },
        ],
      },
      {
        channel: "robocall",
        name: "Town hall reminder — robocall",
        meta: "Robocall · 15,200 recipients · Mar 18",
        status: "Sent",
        metrics: [
          { value: "88.1%", label: "Delivered" },
          { value: "62.4%", label: "Listened" },
        ],
      },
      {
        channel: "push",
        name: "Canvasser briefing — push notification",
        meta: "Push · 312 staff · Mar 19 · 7:30am",
        status: "Sent",
        metrics: [
          { value: "99.1%", label: "Delivered" },
          { value: "87.5%", label: "Opened" },
        ],
      },
      {
        channel: "email",
        name: "Welcome series — new donors",
        meta: "Email · 3 message sequence · Sending",
        status: "Sending",
        metrics: [
          { value: "97.8%", label: "Delivered" },
          { value: "44.2%", label: "Opened" },
        ],
      },
    ],
    performance: [
      { label: "SMS delivery", value: "94.2%", width: 94, color: "#1D9E75" },
      { label: "SMS reply rate", value: "31.8%", width: 32, color: "#1D9E75" },
      { label: "Email open rate", value: "44.2%", width: 44, color: "#378ADD" },
      {
        label: "Email click rate",
        value: "18.1%",
        width: 18,
        color: "#378ADD",
      },
      { label: "Push open rate", value: "87.5%", width: 88, color: "#EF9F27" },
      {
        label: "Robocall listen rate",
        value: "62.4%",
        width: 62,
        color: "#D85A30",
      },
      {
        label: "Opt-out rate",
        value: "1.8%",
        width: 2,
        color: "#E24B4A",
        valueTone: "danger",
      },
    ],
  },

  sms: {
    kpis: [
      {
        label: "Total sent",
        value: "42,000",
        tone: "primary",
        subtext: "this campaign",
        subTone: "muted",
      },
      {
        label: "Delivered",
        value: "94.2%",
        subtext: "39,564 messages",
        subTone: "up",
      },
      {
        label: "Reply rate",
        value: "31.8%",
        subtext: "▲ 4pt vs last blast",
        subTone: "up",
      },
      {
        label: "Opt-outs",
        value: "312",
        subtext: "0.7% of recipients",
        subTone: "muted",
      },
    ],
    campaigns: [
      {
        name: "GOTV text blast — Iowa districts",
        meta: "42,000 recipients · Mar 19, 2025",
        status: "Sent",
      },
      {
        name: "Volunteer recruitment — PA contacts",
        meta: "18,500 recipients · Mar 14, 2025",
        status: "Sent",
      },
      {
        name: "Apr 5 rally reminder",
        meta: "55,000 recipients · Scheduled Apr 3",
        status: "Scheduled",
      },
      {
        name: "Donor thank-you series",
        meta: "1,048 donors · Draft",
        status: "Draft",
      },
    ],
    compliance: [
      { label: "TCPA opt-in verified", value: "✓ 100%" },
      { label: "Opt-out honoured", value: "✓ Automatic" },
      { label: "Quiet hours enforced", value: "✓ 8am–9pm local" },
      { label: "Carrier registration", value: "✓ 10DLC verified" },
    ],
  },

  email: {
    kpis: [
      {
        label: "Emails sent",
        value: "11,840",
        tone: "primary",
        subtext: "active sequences",
        subTone: "muted",
      },
      {
        label: "Open rate",
        value: "44.2%",
        subtext: "▲ 6pt vs industry avg",
        subTone: "up",
      },
      {
        label: "Click rate",
        value: "18.1%",
        subtext: "▲ 3pt vs last send",
        subTone: "up",
      },
      {
        label: "Conversions",
        value: "842",
        subtext: "donations + signups",
        subTone: "muted",
      },
    ],
    campaigns: [
      {
        name: "Welcome series — new donors",
        meta: "Email sequence · 3 messages · 3,400 active",
        status: "Sending",
        metrics: [
          { value: "97.8%", label: "Delivered" },
          { value: "44.2%", label: "Opened" },
          { value: "21.4%", label: "Clicked" },
        ],
      },
      {
        name: "April fundraising push",
        meta: "One-time blast · 8,400 donors · Scheduled Apr 1",
        status: "Scheduled",
        metrics: [
          { value: "—", label: "Delivered" },
          { value: "—", label: "Opened" },
          { value: "—", label: "Clicked" },
        ],
      },
      {
        name: "Volunteer onboarding",
        meta: "Email sequence · 5 messages · 312 staff",
        status: "Sent",
        metrics: [
          { value: "99.4%", label: "Delivered" },
          { value: "88.1%", label: "Opened" },
          { value: "64.3%", label: "Clicked" },
        ],
      },
    ],
  },

  push: {
    kpis: [
      {
        label: "Notifications sent",
        value: "312",
        tone: "primary",
        subtext: "staff only · this campaign",
        subTone: "muted",
      },
      {
        label: "Delivery rate",
        value: "99.1%",
        subtext: "309 delivered",
        subTone: "up",
      },
      {
        label: "Open rate",
        value: "87.5%",
        subtext: "▲ industry leading",
        subTone: "up",
      },
      {
        label: "Avg time to open",
        value: "4.2m",
        subtext: "after send",
        subTone: "muted",
      },
    ],
    campaigns: [
      {
        name: "Morning briefing — Mar 19",
        meta: "All canvassers · 312 sent · 7:30am",
        status: "Sent",
        metrics: [{ value: "87.5%", label: "Opened" }],
      },
      {
        name: "Shift change alert — Team B",
        meta: "Team B · 48 sent · Mar 18",
        status: "Sent",
        metrics: [{ value: "95.8%", label: "Opened" }],
      },
      {
        name: "End of day recap — Mar 19",
        meta: "All canvassers · Scheduled 6:00pm",
        status: "Scheduled",
        metrics: [{ value: "—", label: "Opened" }],
      },
    ],
  },

  robocall: {
    kpis: [
      {
        label: "Calls placed",
        value: "15,200",
        tone: "primary",
        subtext: "town hall reminder",
        subTone: "muted",
      },
      {
        label: "Delivery rate",
        value: "88.1%",
        subtext: "13,392 connected",
        subTone: "muted",
      },
      {
        label: "Full listen rate",
        value: "62.4%",
        subtext: "▲ 5pt vs last call",
        subTone: "up",
      },
      {
        label: "Voicemail drops",
        value: "4,820",
        subtext: "31.7% left message",
        subTone: "muted",
      },
    ],
    campaigns: [
      {
        name: "Town hall reminder — Mar 18",
        meta: "15,200 recipients · 45 sec message",
        status: "Sent",
        metrics: [
          { value: "88.1%", label: "Connected" },
          { value: "62.4%", label: "Full listen" },
        ],
      },
      {
        name: "Apr 5 rally GOTV call",
        meta: "60,000 recipients · Scheduled Apr 4, 10am",
        status: "Scheduled",
        metrics: [
          { value: "—", label: "Connected" },
          { value: "—", label: "Full listen" },
        ],
      },
    ],
  },

  social: {
    platforms: [
      {
        icon: "𝕏",
        iconBg: "bg-[#ececec]",
        name: "X / Twitter",
        handle: "@KeepIAClean",
        stat: "48.2K",
        label: "Impressions this week",
        delta: "▲ 22% vs last week",
        deltaTone: "up",
      },
      {
        icon: "f",
        iconBg: "bg-[#e8eaf6]",
        name: "Facebook",
        handle: "Keep Data Centers Out of Iowa",
        stat: "31.5K",
        label: "Reach this week",
        delta: "▲ 14% vs last week",
        deltaTone: "up",
      },
      {
        icon: "◉",
        iconBg: "bg-[#fce4ec]",
        name: "Instagram",
        handle: "@KeepIAClean",
        stat: "12.8K",
        label: "Impressions this week",
        delta: "▲ 8% vs last week",
        deltaTone: "up",
      },
      {
        icon: "in",
        iconBg: "bg-[#e3f2fd]",
        name: "LinkedIn",
        handle: "Keep Data Centers Out of Iowa",
        stat: "4,210",
        label: "Impressions this week",
        delta: "— stable",
        deltaTone: "muted",
      },
    ],
    posts: [
      {
        platform: "𝕏",
        bg: "bg-[#ececec]",
        text: `"Iowa families deserve clean water and reliable power — not corporate data centers draining both. Join us. #KeepIAClean"`,
        stats: ["4,820 impressions", "312 engagements", "6.5% rate"],
        meta: "Posted Mar 19 · 9:00am",
        status: "Posted",
      },
      {
        platform: "f",
        bg: "bg-[#e8eaf6]",
        text: "Canvassers knocked 990 doors today in Iowa. Every door is a conversation. Every conversation moves the needle.",
        stats: ["2,140 reach", "188 reactions"],
        meta: "Posted Mar 19 · 6:30pm",
        status: "Posted",
      },
      {
        platform: "𝕏",
        bg: "bg-[#ececec]",
        text: "Town hall this Thursday in Des Moines. Come tell your story. Link in bio.",
        stats: [],
        meta: "Scheduled Mar 21 · 10:00am",
        status: "Scheduled",
      },
    ],
    breakdown: [
      { label: "X / Twitter", value: "48.2K", width: 100, color: "#7F77DD" },
      { label: "Facebook", value: "31.5K", width: 65, color: "#378ADD" },
      { label: "Instagram", value: "12.8K", width: 27, color: "#D4537E" },
      { label: "LinkedIn", value: "4,210", width: 9, color: "#378ADD" },
    ],
    summaryMetrics: [
      { label: "Avg engagement rate", value: "5.8%" },
      { label: "Total followers gained", value: "+842", tone: "success" },
      { label: "Posts this week", value: "14" },
    ],
  },

  press: {
    kpis: [
      {
        label: "Media mentions",
        value: "38",
        tone: "primary",
        subtext: "▲ 12 this week",
        subTone: "up",
      },
      {
        label: "Estimated reach",
        value: "2.9M",
        subtext: "across print, broadcast, and online",
        subTone: "muted",
      },
      {
        label: "Positive sentiment",
        value: "61%",
        subtext: "▲ 9pt this week",
        subTone: "up",
      },
      {
        label: "Press releases",
        value: "4",
        subtext: "2 distributed this month",
        subTone: "muted",
      },
    ],
    mentions: [
      {
        outlet: "Des Moines Register",
        meta: "Mar 19 · Print + Online",
        headline: `"Grassroots campaign against data center expansion gains momentum in rural Iowa"`,
        sentiment: "Positive",
        reach: "840K reach",
      },
      {
        outlet: "Iowa Public Radio",
        meta: "Mar 18 · Broadcast",
        headline: `"Residents organize against proposed data infrastructure projects"`,
        sentiment: "Neutral",
        reach: "320K reach",
      },
      {
        outlet: "Axios Des Moines",
        meta: "Mar 17 · Online",
        headline: `"Tech industry pushback: locals fight data center water usage"`,
        sentiment: "Positive",
        reach: "210K reach",
      },
      {
        outlet: "Tech Insider",
        meta: "Mar 16 · Online",
        headline: `"Opposition groups slow data center expansion in midwest states"`,
        sentiment: "Negative",
        reach: "1.2M reach",
      },
    ],
  },
};

const channels = [
  { id: "overview", label: "All channels", dot: "#7F77DD" },
  { id: "sms", label: "SMS / text", dot: "#1D9E75" },
  { id: "email", label: "Email", dot: "#378ADD" },
  { id: "push", label: "Push", dot: "#EF9F27" },
  { id: "robocall", label: "Robocall / voicemail", dot: "#D85A30" },
  { id: "social", label: "Social media", dot: "#D4537E" },
  { id: "press", label: "Press & media", dot: "#888780" },
];

const shellCard = "rounded-[28px] border border-black/10 bg-white shadow-sm";
const innerCard = "rounded-[24px] border border-black/10 bg-white shadow-sm";
const softSurface = "rounded-[20px] border border-black/5 bg-[#fcfbff]";

function KpiCard({
  label,
  value,
  subtext,
  tone = "default",
  subTone = "muted",
}) {
  const subToneClass =
    subTone === "up"
      ? "text-[#3B6D11]"
      : subTone === "down"
        ? "text-[#993C1D]"
        : "text-[#8a8983]";

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
      {subtext ? (
        <div className={`mt-1 text-xs font-medium ${subToneClass}`}>
          {subtext}
        </div>
      ) : null}
    </div>
  );
}

function ChannelButton({ active, color, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-2xl border px-4 py-2.5 text-[13px] font-semibold transition ${
        active
          ? "border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489]"
          : "border-black/10 bg-white text-[#7a7972] hover:bg-[#f3f1ec] hover:text-[#151b2f]"
      }`}
    >
      <span
        className="mr-2 h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}

function StatusPill({ status }) {
  const map = {
    Sent: "bg-[#EAF3DE] text-[#27500A]",
    Posted: "bg-[#EAF3DE] text-[#27500A]",
    Draft: "bg-[#f1efe8] text-[#7a7972]",
    Scheduled: "bg-[#EEEDFE] text-[#3C3489]",
    Sending: "bg-[#FAEEDA] text-[#633806]",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${map[status] || "bg-[#f1efe8] text-[#7a7972]"}`}
    >
      {status}
    </span>
  );
}

function ChannelDot({ channel }) {
  const colorMap = {
    sms: "#1D9E75",
    email: "#378ADD",
    push: "#EF9F27",
    robocall: "#D85A30",
    social: "#D4537E",
    press: "#888780",
  };

  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: colorMap[channel] || "#7F77DD" }}
    />
  );
}

function MetricRow({ label, value, width, color, valueTone }) {
  return (
    <div className="flex items-center gap-3 border-b border-black/5 py-2.5 last:border-b-0">
      <span className="min-w-0 flex-1 text-sm text-[#7a7972]">{label}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#f1efe8]">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span
        className={`min-w-[52px] text-right text-sm font-semibold ${
          valueTone === "danger" ? "text-[#791F1F]" : "text-[#151b2f]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function CampaignListCard({ title, actionLabel, rows }) {
  return (
    <div className={`${innerCard} p-5 md:p-6`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[15px] font-semibold text-[#151b2f]">{title}</div>
        {actionLabel ? (
          <button
            type="button"
            className="rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div
            key={`${row.name}-${idx}`}
            className={`${softSurface} flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center`}
          >
            {row.channel ? <ChannelDot channel={row.channel} /> : null}

            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-[#151b2f]">
                {row.name}
              </div>
              <div className="mt-0.5 text-xs text-[#8a8983]">{row.meta}</div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:gap-5">
              <StatusPill status={row.status} />

              {row.metrics?.map((metric, metricIdx) => (
                <div
                  key={`${metric.label}-${metricIdx}`}
                  className="text-right"
                >
                  <div className="text-[13px] font-semibold text-[#151b2f]">
                    {metric.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.08em] text-[#94938c]">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewPanel() {
  const data = commsData.overview;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <CampaignListCard
          title="Recent campaigns"
          actionLabel="+ New campaign"
          rows={data.recentCampaigns}
        />

        <div className={`${innerCard} p-5 md:p-6`}>
          <div className="mb-4 text-[15px] font-semibold text-[#151b2f]">
            Performance by channel
          </div>

          {data.performance.map((metric) => (
            <MetricRow key={metric.label} {...metric} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SMSPanel() {
  const data = commsData.sms;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CampaignListCard
          title="SMS campaigns"
          actionLabel="+ New text blast"
          rows={data.campaigns}
        />

        <div className={`${innerCard} p-5 md:p-6`}>
          <div className="mb-4 text-[15px] font-semibold text-[#151b2f]">
            Compliance
          </div>

          <div className="rounded-[22px] border border-[#97C459] bg-[#EAF3DE] p-4">
            <div className="space-y-2">
              {data.compliance.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-[#3B6D11]">{row.label}</span>
                  <span className="font-semibold text-[#27500A]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailPanel() {
  const data = commsData.email;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <CampaignListCard
        title="Email campaigns"
        actionLabel="+ New email campaign"
        rows={data.campaigns}
      />
    </div>
  );
}

function PushPanel() {
  const data = commsData.push;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <CampaignListCard
        title="Push notifications"
        actionLabel="+ Send notification"
        rows={data.campaigns}
      />
    </div>
  );
}

function RobocallPanel() {
  const data = commsData.robocall;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <CampaignListCard
        title="Robocall campaigns"
        actionLabel="+ New campaign"
        rows={data.campaigns}
      />
    </div>
  );
}

function SocialPanel() {
  const data = commsData.social;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.platforms.map((platform) => (
          <div
            key={platform.name}
            className="rounded-[22px] border border-black/5 bg-[#f8f7fb] p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-semibold text-[#151b2f] ${platform.iconBg}`}
              >
                {platform.icon}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-[#151b2f]">
                  {platform.name}
                </div>
                <div className="truncate text-[11px] text-[#8a8983]">
                  {platform.handle}
                </div>
              </div>
            </div>

            <div className="text-[28px] font-bold leading-none tracking-[-0.03em] text-[#151b2f]">
              {platform.stat}
            </div>
            <div className="mt-1 text-[11px] text-[#8a8983]">
              {platform.label}
            </div>
            <div
              className={`mt-2 text-xs font-medium ${
                platform.deltaTone === "up"
                  ? "text-[#3B6D11]"
                  : "text-[#8a8983]"
              }`}
            >
              {platform.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={`${innerCard} p-5 md:p-6`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-[15px] font-semibold text-[#151b2f]">
              Post calendar
            </div>
            <button
              type="button"
              className="rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
            >
              + Schedule post
            </button>
          </div>

          <div className="space-y-2">
            {data.posts.map((post, idx) => (
              <div
                key={`${post.text}-${idx}`}
                className={`${softSurface} flex gap-3 px-4 py-3`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold text-[#151b2f] ${post.bg}`}
                >
                  {post.platform}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[13px] leading-6 text-[#151b2f]">
                    {post.text}
                  </div>

                  {post.stats?.length ? (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#7a7972]">
                      {post.stats.map((stat) => (
                        <span key={stat}>{stat}</span>
                      ))}
                    </div>
                  ) : null}

                  <div
                    className={`mt-2 text-[11px] ${
                      post.status === "Scheduled"
                        ? "font-semibold text-[#534AB7]"
                        : "text-[#8a8983]"
                    }`}
                  >
                    {post.meta}
                  </div>
                </div>

                <StatusPill status={post.status} />
              </div>
            ))}
          </div>
        </div>

        <div className={`${innerCard} p-5 md:p-6`}>
          <div className="mb-4 text-[15px] font-semibold text-[#151b2f]">
            Engagement breakdown
          </div>

          {data.breakdown.map((metric) => (
            <MetricRow key={metric.label} {...metric} />
          ))}

          <div className="mt-3 rounded-[20px] border border-black/5 bg-[#fcfbff] p-3">
            <div className="space-y-2">
              {data.summaryMetrics.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-[#7a7972]">{item.label}</span>
                  <span
                    className={`font-semibold ${
                      item.tone === "success"
                        ? "text-[#3B6D11]"
                        : "text-[#151b2f]"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PressPanel() {
  const data = commsData.press;

  const sentimentClass = (sentiment) => {
    if (sentiment === "Positive") return "bg-[#EAF3DE] text-[#27500A]";
    if (sentiment === "Negative") return "bg-[#FCEBEB] text-[#791F1F]";
    return "bg-[#f1efe8] text-[#7a7972]";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={`${innerCard} p-5 md:p-6`}>
          <div className="mb-4 text-[15px] font-semibold text-[#151b2f]">
            Media monitoring
          </div>

          <div className="space-y-2">
            {data.mentions.map((item) => (
              <div
                key={`${item.outlet}-${item.headline}`}
                className={`${softSurface} flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-start`}
              >
                <div className="min-w-[132px]">
                  <div className="text-xs font-semibold text-[#151b2f]">
                    {item.outlet}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#8a8983]">
                    {item.meta}
                  </div>
                </div>

                <div className="min-w-0 flex-1 text-[13px] leading-6 text-[#151b2f]">
                  {item.headline}
                </div>

                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${sentimentClass(
                    item.sentiment,
                  )}`}
                >
                  {item.sentiment}
                </span>

                <div className="min-w-[76px] text-right text-xs text-[#7a7972]">
                  {item.reach}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${innerCard} p-5 md:p-6`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-[15px] font-semibold text-[#151b2f]">
              Press release builder
            </div>
            <button
              type="button"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#7a7972] transition hover:bg-[#f3f1ec]"
            >
              View sent
            </button>
          </div>

          <div className="rounded-[22px] border border-black/5 bg-[#f8f7fb] p-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]">
                  Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Campaign reaches 100,000 doors in Iowa"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#151b2f] outline-none placeholder:text-[#8a8983] focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]">
                  Dateline
                </label>
                <input
                  type="text"
                  placeholder="e.g. DES MOINES, Iowa — March 19, 2025"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#151b2f] outline-none placeholder:text-[#8a8983] focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]">
                  Body
                </label>
                <textarea
                  placeholder="Write your press release body copy here..."
                  className="min-h-[120px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#151b2f] outline-none placeholder:text-[#8a8983] focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#7a7972] transition hover:bg-[#f3f1ec]"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-2 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
                >
                  Distribute →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommsTab() {
  const [activeChannel, setActiveChannel] = useState("overview");

  const panel = useMemo(() => {
    switch (activeChannel) {
      case "sms":
        return <SMSPanel />;
      case "email":
        return <EmailPanel />;
      case "push":
        return <PushPanel />;
      case "robocall":
        return <RobocallPanel />;
      case "social":
        return <SocialPanel />;
      case "press":
        return <PressPanel />;
      default:
        return <OverviewPanel />;
    }
  }, [activeChannel]);

  return (
    <div className="px-0 py-6 pb-10">
      <div className="mb-6 flex flex-wrap gap-2">
        {channels.map((channel) => (
          <ChannelButton
            key={channel.id}
            active={activeChannel === channel.id}
            color={channel.dot}
            label={channel.label}
            onClick={() => setActiveChannel(channel.id)}
          />
        ))}
      </div>

      {panel}
    </div>
  );
}
