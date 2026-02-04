// src/app/api/project/[id]/route.js
import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
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

      project_employees(distinct_on: employee_id) {
        employee_id
        employee {
          id
          first_name
          last_name
          email
          doors_knocked
          doors_knocked_per_day
          contacts_made_per_day
        }
      }

      project_schedules(order_by: { work_date: asc }) {
        id
        work_date
        project_schedule_employees {
          employee_id
          employee {
            id
            first_name
            last_name
            email
            doors_knocked
            doors_knocked_per_day
            contacts_made_per_day
          }
        }
      }
    }
  }
`;

const UPDATE_PROJECT = `
mutation UpdateProject($id: uuid!, $set: projects_set_input!) {
  update_projects_by_pk(pk_columns: {id: $id}, _set: $set) {
    id
  }
}
`;

const safeObj = (v) => (v && typeof v === "object" ? v : {});

function toMongoishEmployee(e) {
  if (!e) return null;
  return {
    _id: e.id,
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
    email: e.email,

    // IMPORTANT: these power Production + Charts
    doorsKnocked: e.doors_knocked ?? 0,
    doorsKnockedPerDay: safeObj(e.doors_knocked_per_day),
    contactsMadePerDay: safeObj(e.contacts_made_per_day),
  };
}

function toMongoishProject(p) {
  if (!p) return null;

  const assignedEmployees =
    (p.project_employees || [])
      .map((pe) => toMongoishEmployee(pe.employee))
      .filter(Boolean);

  const schedule =
    (p.project_schedules || []).map((s) => ({
      id: s.id,
      date: s.work_date,
      employees: (s.project_schedule_employees || [])
        .map((se) => toMongoishEmployee(se.employee))
        .filter(Boolean),
    }));

  return {
    _id: p.id,
    id: p.id,
    organization: p.organization_id,

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
  };
}

export const GET = withUser(async (_request, _user, ctx) => {
  try {
    const { id } = await ctx.params;

    const data = await hasuraFetch(PROJECT_BY_PK, { id }, { admin: true });
    const p = data.projects_by_pk;

    if (!p) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project: toMongoishProject(p) }, { status: 200 });
  } catch (error) {
    console.error("GET /api/project/[id] error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});

export const PUT = withUser(async (request, user, ctx) => {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    // fetch once to enforce org gate
    const existing = await hasuraFetch(PROJECT_BY_PK, { id }, { admin: true });
    const p = existing.projects_by_pk;
    if (!p) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const isSuperAdmin = user.role === "Super Admin";
    if (!isSuperAdmin && user.organization?.id !== p.organization_id) {
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

    // remove undefined keys (Hasura doesn’t like them)
    Object.keys(set).forEach((k) => set[k] === undefined && delete set[k]);

    await hasuraFetch(UPDATE_PROJECT, { id, set }, { admin: true });

    const refreshed = await hasuraFetch(PROJECT_BY_PK, { id }, { admin: true });
    return NextResponse.json(
      { project: toMongoishProject(refreshed.projects_by_pk) },
      { status: 200 }
    );
  } catch (e) {
    console.error("PUT /api/project/[id] error:", e);
    return NextResponse.json({ message: "Server error", error: e.message }, { status: 500 });
  }
});
