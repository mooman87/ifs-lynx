import { NextResponse } from "next/server";
import {
  withUser,
  canCreateProjectByOrgRole,
  canDeleteProjectByOrgRole,
  canDeleteProjectByProjectRole,
  getProjectRole,
} from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const PROJECT_FIELDS = `
  id
  campaign_name
  start_date
  end_date
  doors_remaining
  total_doors_knocked
  state_director
  door_count
  organization_id
  project_staff {
    staff_id
  }
`;

const PROJECT_LIST_QUERY = `
query Projects($orgId: uuid!) {
  projects(
    where: {
      organization_id: { _eq: $orgId }
      archived_at: { _is_null: true }
    }
    order_by: { created_at: desc }
  ) {
    ${PROJECT_FIELDS}
  }
}
`;

const PROJECT_LIST_QUERY_SUPERADMIN = `
query ProjectsSuperAdmin {
  projects(
    where: { archived_at: { _is_null: true } }
    order_by: { created_at: desc }
  ) {
    ${PROJECT_FIELDS}
  }
}
`;

const PROJECT_INSERT_MUTATION = `
mutation CreateProject($object: projects_insert_input!) {
  insert_projects_one(object: $object) {
    id
  }
}
`;

const PROJECT_BY_PK_MIN = `
query ProjectById($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    campaign_name
    start_date
    end_date
    doors_remaining
    total_doors_knocked
    state_director
    door_count
    daily_staff_needed
    manager_hotel
    staff_hotel
    survey
    project_staff(distinct_on: staff_id) {
      staff_id
      staff { id first_name last_name email }
    }
    project_schedules {
      id
      work_date
      project_schedule_staff {
        staff_id
        staff { id first_name last_name email }
      }
    }
  }
}
`;

const PROJECT_ORG_QUERY = `
query ProjectOrg($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
  }
}
`;

const DELETE_PROJECT = `
mutation DeleteProject($id: uuid!) {
  delete_projects(where: { id: { _eq: $id } }) {
    affected_rows
  }
}
`;

const toApiShape = (p) => {
  const assignedStaffIds = (p.project_staff || [])
    .map((ps) => ps.staff_id)
    .filter(Boolean);

  return {
    _id: p.id,
    id: p.id,
    campaignName: p.campaign_name,
    startDate: p.start_date,
    endDate: p.end_date,
    doorsRemaining: p.doors_remaining ?? 0,
    totalDoorsKnocked: p.total_doors_knocked ?? 0,
    stateDirector: p.state_director ?? "",
    doorCount: p.door_count ?? null,
    organization: p.organization_id,
    organizationId: p.organization_id,
    assignedEmployees: assignedStaffIds,
    assignedEmployeesCount: assignedStaffIds.length,
    assignedEmployeesJoin: p.project_staff || [],
    schedule: [],
  };
};

function canDeleteProject(user, projectOrgId, projectRole) {
  if (!user) return false;
  if (user.role === "Super Admin") return true;

  const userOrgId = user.organization?.id || null;
  if (!userOrgId || !projectOrgId) return false;
  if (userOrgId !== projectOrgId) return false;

  if (canDeleteProjectByOrgRole(user)) return true;
  if (canDeleteProjectByProjectRole(projectRole)) return true;

  return false;
}

export const GET = withUser(async (_request, user) => {
  try {
    const isSuperAdmin = user.role === "Super Admin";
    const orgId = user.organization?.id || null;

    if (!isSuperAdmin && !orgId) {
      return NextResponse.json(
        { message: "Missing organization context" },
        { status: 400 },
      );
    }

    const data = isSuperAdmin
      ? await hasuraFetch(PROJECT_LIST_QUERY_SUPERADMIN, {}, { admin: true })
      : await hasuraFetch(PROJECT_LIST_QUERY, { orgId }, { admin: true });

    const projects = (data.projects || []).map(toApiShape);

    return NextResponse.json({ projects }, { status: 200 });
  } catch (e) {
    console.error("GET /api/project error:", e);
    return NextResponse.json(
      { message: "Server error", error: e.message },
      { status: 500 },
    );
  }
});

export const POST = withUser(async (request, user) => {
  try {
    if (!canCreateProjectByOrgRole(user)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const isSuperAdmin = user.role === "Super Admin";
    const orgId = isSuperAdmin
      ? body.organizationId || user.organization?.id
      : user.organization?.id;

    if (!orgId) {
      return NextResponse.json(
        { message: "Missing organization context" },
        { status: 400 },
      );
    }

    const required = ["campaignName", "startDate", "endDate", "stateDirector"];
    for (const k of required) {
      if (!body[k]) {
        return NextResponse.json({ message: `Missing ${k}` }, { status: 400 });
      }
    }

    const object = {
      organization_id: orgId,
      campaign_name: body.campaignName,
      start_date: body.startDate,
      end_date: body.endDate,
      door_count: body.doorCount ?? null,
      doors_remaining: body.doorsRemaining ?? 0,
      total_doors_knocked: body.totalDoorsKnocked ?? 0,
      daily_staff_needed: body.dailyStaffNeeded ?? {},
      state_director: body.stateDirector,
      manager_hotel: body.managerHotel ?? null,
      staff_hotel: body.staffHotel ?? null,
      survey: body.survey ?? {},
    };

    const inserted = await hasuraFetch(
      PROJECT_INSERT_MUTATION,
      { object },
      { admin: true },
    );

    const id = inserted?.insert_projects_one?.id;
    if (!id) {
      return NextResponse.json(
        { message: "Failed to create project" },
        { status: 500 },
      );
    }

    const fetched = await hasuraFetch(
      PROJECT_BY_PK_MIN,
      { id },
      { admin: true },
    );
    const p = fetched?.projects_by_pk;

    const project = p
      ? {
          _id: p.id,
          id: p.id,
          organization: p.organization_id,
          campaignName: p.campaign_name,
          startDate: p.start_date,
          endDate: p.end_date,
          doorCount: p.door_count,
          doorsRemaining: p.doors_remaining,
          totalDoorsKnocked: p.total_doors_knocked,
          dailyStaffNeeded: p.daily_staff_needed || {},
          stateDirector: p.state_director,
          managerHotel: p.manager_hotel || null,
          staffHotel: p.staff_hotel || null,
          survey: p.survey || {},
          assignedEmployees: (p.project_staff || [])
            .map((ps) => ps.staff)
            .filter(Boolean)
            .map((s) => ({
              _id: s.id,
              id: s.id,
              firstName: s.first_name,
              lastName: s.last_name,
              email: s.email,
            })),
          schedule: (p.project_schedules || []).map((s) => ({
            id: s.id,
            date: s.work_date,
            employees: (s.project_schedule_staff || [])
              .map((ss) => ss.staff)
              .filter(Boolean)
              .map((st) => ({
                _id: st.id,
                id: st.id,
                firstName: st.first_name,
                lastName: st.last_name,
                email: st.email,
              })),
          })),
        }
      : {
          _id: id,
          id,
          organization: orgId,
          campaignName: body.campaignName,
          startDate: body.startDate,
          endDate: body.endDate,
          doorsRemaining: body.doorsRemaining ?? 0,
          totalDoorsKnocked: body.totalDoorsKnocked ?? 0,
          stateDirector: body.stateDirector,
          assignedEmployees: [],
          schedule: [],
        };

    return NextResponse.json({ message: "Created", project }, { status: 201 });
  } catch (e) {
    console.error("POST /api/project error:", e);
    return NextResponse.json(
      { message: "Server error", error: e.message },
      { status: 500 },
    );
  }
});

export const DELETE = withUser(async (request, user) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    const ctx = await hasuraFetch(PROJECT_ORG_QUERY, { id }, { admin: true });
    const proj = ctx.projects_by_pk;

    if (!proj) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const projectRole = await getProjectRole(id, user.id);

    if (!canDeleteProject(user, proj.organization_id, projectRole)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = await hasuraFetch(DELETE_PROJECT, { id }, { admin: true });
    const affected = data.delete_projects?.affected_rows ?? 0;

    if (affected === 0) {
      return NextResponse.json({ message: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ message: "Deleted", id }, { status: 200 });
  } catch (e) {
    console.error("DELETE /api/project error:", e);
    return NextResponse.json(
      { message: "Server error", error: e.message },
      { status: 500 },
    );
  }
});
