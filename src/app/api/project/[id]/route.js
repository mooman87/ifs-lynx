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
          doors_knocked
          doors_knocked_per_day
          contacts_made_per_day
        }
      }

      project_schedules(order_by: { work_date: asc }) {
        id
        work_date
        project_schedule_staff {
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
  update_projects_by_pk(pk_columns: { id: $id }, _set: $set) {
    id
  }
}
`;

const safeObj = (v) => (v && typeof v === "object" ? v : {});

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
    doorsKnocked: s.doors_knocked ?? 0,
    doorsKnockedPerDay: safeObj(s.doors_knocked_per_day),
    contactsMadePerDay: safeObj(s.contacts_made_per_day),
  };
}

function toProjectShape(p) {
  if (!p) return null;

  const assignedEmployees = (p.project_staff || [])
    .map((ps) => toApiStaff(ps.staff))
    .filter(Boolean);

  const schedule = (p.project_schedules || []).map((s) => ({
    id: s.id,
    date: s.work_date,
    employees: (s.project_schedule_staff || [])
      .map((ss) => toApiStaff(ss.staff))
      .filter(Boolean),
  }));

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
