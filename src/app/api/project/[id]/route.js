// src/app/api/project/[id]/route.js
import { NextResponse } from "next/server";
import { withUser, canManageProject } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const PROJECT_BY_PK = `
  query ProjectById($id: uuid!) {
    projects_by_pk(id: $id) {
      id
      organization_id
      campaign_name
      start_date
      end_date
      door_count
      doors_remaining
      total_doors_knocked
      daily_staff_needed
      state_director
      manager_hotel
      staff_hotel
      survey

      project_staff(distinct_on: staff_id) {
        staff_id
        staff {
          id
          user_id
          user_legacy_id
          first_name
          last_name
          full_name
          email
          username
          org_role
          staff_type
          can_login
          is_active
          reports_to
          doors_knocked
          doors_knocked_per_day
          contacts_made_per_day
          rental_car_eligible
        }
      }

      project_schedules(order_by: { work_date: asc }) {
        id
        work_date
        project_schedule_staff(order_by: { staff: { last_name: asc } }) {
          staff_id
          status
          shift_label
          notes
          updated_at
          staff {
            id
            user_id
            user_legacy_id
            first_name
            last_name
            full_name
            email
            username
            org_role
            staff_type
            can_login
            is_active
            reports_to
            doors_knocked
            doors_knocked_per_day
            contacts_made_per_day
            rental_car_eligible
          }
        }
      }

project_schedule_requests(
  order_by: [{ status: asc }, { created_at: desc }]
) {
  id
  staff_id
  work_date
  request_type
  current_shift_label
  requested_shift_label
  detail
  status
  created_at
  resolved_at
  staffByStaffId {
    id
    first_name
    last_name
    full_name
  }
}
    }
  }
`;

const UPDATE_PROJECT = `
mutation UpdateProject($id: uuid!, $set: projects_set_input!) {
  update_projects_by_pk(pk_columns: { id: $id }, _set: $set) {
    id
  }
}
`;

const safeObj = (v) => (v && typeof v === "object" ? v : {});

function normalizeWorkDate(input) {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  const dt = new Date(input);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);

  return String(input);
}

function toApiStaff(s) {
  if (!s) return null;

  return {
    _id: s.id,
    id: s.id,
    userId: s.user_id ?? s.user_legacy_id ?? null,
    firstName: s.first_name,
    lastName: s.last_name,
    fullName:
      s.full_name || [s.first_name, s.last_name].filter(Boolean).join(" "),
    email: s.email,
    username: s.username ?? null,
    role: s.org_role ?? null,
    staffType: s.staff_type ?? "employee",
    canLogin: s.can_login ?? true,
    isActive: s.is_active ?? true,
    reportsTo: s.reports_to ?? null,
    doorsKnocked: s.doors_knocked ?? 0,
    doorsKnockedPerDay: safeObj(s.doors_knocked_per_day),
    contactsMadePerDay: safeObj(s.contacts_made_per_day),
    rentalCarEligible: s.rental_car_eligible ?? true,
  };
}

function toApiScheduleRequest(req) {
  const firstName = req?.staffByStaffId?.first_name || "";
  const lastName = req?.staffByStaffId?.last_name || "";
  const fullName =
    req?.staffByStaffId?.full_name ||
    `${firstName} ${lastName}`.trim() ||
    "Unknown Staff";

  return {
    id: req.id,
    type: req.request_type,
    currentShiftLabel: req.current_shift_label || "",
    requestedShiftLabel: req.requested_shift_label || "",
    detail: req.detail || "",
    status: req.status,
    date: normalizeWorkDate(req.work_date),
    createdAt: req.created_at || null,
    resolvedAt: req.resolved_at || null,
    staffId: req?.staffByStaffId?.id || req?.staff_id || null,
    staffName: fullName,
    staffFirstName: firstName,
    staffLastName: lastName,
    initials: `${firstName?.[0] || "?"}${lastName?.[0] || "?"}`.toUpperCase(),
  };
}

function toProjectShape(p) {
  if (!p) return null;

  const assignedEmployees = (p.project_staff || [])
    .map((ps) => toApiStaff(ps.staff))
    .filter(Boolean);

  const schedule = (p.project_schedules || []).map((s) => ({
    id: s.id,
    date: normalizeWorkDate(s.work_date),
    employees: (s.project_schedule_staff || [])
      .map((ss) => {
        const employee = toApiStaff(ss.staff);
        if (!employee) return null;

        return {
          ...employee,
          status: ss.status || "working",
          shiftLabel: ss.shift_label || "",
          notes: ss.notes || "",
          updatedAt: ss.updated_at || null,
        };
      })
      .filter(Boolean),
  }));

  const scheduleRequests = (p.project_schedule_requests || []).map(
    toApiScheduleRequest,
  );

  return {
    _id: p.id,
    id: p.id,
    organization: p.organization_id,
    organizationId: p.organization_id,
    campaignName: p.campaign_name,
    startDate: p.start_date,
    endDate: p.end_date,
    doorCount: p.door_count,
    doorsRemaining: p.doors_remaining,
    totalDoorsKnocked: p.total_doors_knocked,
    dailyStaffNeeded: safeObj(p.daily_staff_needed),
    stateDirector: p.state_director,
    managerHotel: p.manager_hotel || null,
    staffHotel: p.staff_hotel || null,
    survey: safeObj(p.survey),
    assignedEmployees,
    schedule,
    scheduleRequests,
  };
}

export const GET = withUser(async (_request, user, ctx) => {
  try {
    const { id } = await ctx.params;

    const data = await hasuraFetch(PROJECT_BY_PK, { id }, { admin: true });
    const project = data.projects_by_pk;

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const isSameOrg =
      user.role === "Super Admin" ||
      user.organization?.id === project.organization_id;

    if (!isSameOrg) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { project: toProjectShape(project) },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/project/[id] error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const PUT = withUser(async (request, user, ctx) => {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    const existing = await hasuraFetch(PROJECT_BY_PK, { id }, { admin: true });
    const project = existing.projects_by_pk;

    if (!project) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const canManage = await canManageProject(id, user);
    if (!canManage) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const set = {
      campaign_name: body.campaignName ?? undefined,
      start_date: body.startDate ?? undefined,
      end_date: body.endDate ?? undefined,
      door_count: body.doorCount ?? undefined,
      doors_remaining: body.doorsRemaining ?? undefined,
      total_doors_knocked: body.totalDoorsKnocked ?? undefined,
      daily_staff_needed: body.dailyStaffNeeded ?? undefined,
      state_director: body.stateDirector ?? undefined,
      manager_hotel: body.managerHotel ?? undefined,
      staff_hotel: body.staffHotel ?? undefined,
      survey: body.survey ?? undefined,
    };

    Object.keys(set).forEach((k) => {
      if (set[k] === undefined) delete set[k];
    });

    await hasuraFetch(UPDATE_PROJECT, { id, set }, { admin: true });

    const refreshed = await hasuraFetch(PROJECT_BY_PK, { id }, { admin: true });

    return NextResponse.json(
      { project: toProjectShape(refreshed.projects_by_pk) },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/project/[id] error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
