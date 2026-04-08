import { NextResponse } from "next/server";
import { withUser, canManageProject } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const PROJECT_CTX = `
query ProjectCtx($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    campaign_name
    start_date
    end_date
    doors_remaining
    total_doors_knocked
    state_director
    project_staff(distinct_on: staff_id) {
      staff_id
      staff {
        id
        first_name
        last_name
        full_name
        email
        username
        org_role
        staff_type
        can_login
        is_active
      }
    }
  }
}
`;

const STAFF_CTX = `
query StaffCtx($id: uuid!) {
  staff_by_pk(id: $id) {
    id
    organization_id
    first_name
    last_name
    full_name
    email
    username
    org_role
    staff_type
    can_login
    is_active
  }
}
`;

const ASSIGN = `
mutation Assign($objects: [project_staff_insert_input!]!) {
  insert_project_staff(
    objects: $objects,
    on_conflict: {
      constraint: project_employees_project_id_employee_id_key
      update_columns: []
    }
  ) {
    affected_rows
  }
}
`;

function toStaffShape(s) {
  if (!s) return null;

  return {
    _id: s.id,
    id: s.id,
    firstName: s.first_name ?? "",
    lastName: s.last_name ?? "",
    fullName:
      s.full_name || [s.first_name, s.last_name].filter(Boolean).join(" "),
    email: s.email ?? null,
    username: s.username ?? null,
    role: s.org_role ?? null,
    staffType: s.staff_type ?? "employee",
    canLogin: s.can_login ?? true,
    isActive: s.is_active ?? true,
  };
}

function toProjectShape(p) {
  if (!p) return null;

  return {
    _id: p.id,
    id: p.id,
    organization: p.organization_id,
    campaignName: p.campaign_name,
    startDate: p.start_date,
    endDate: p.end_date,
    doorsRemaining: p.doors_remaining ?? 0,
    totalDoorsKnocked: p.total_doors_knocked ?? 0,
    stateDirector: p.state_director ?? "",
    assignedEmployees: (p.project_staff || [])
      .map((ps) => ps.staff)
      .filter(Boolean)
      .map(toStaffShape),
  };
}

export const POST = withUser(async (request, user) => {
  try {
    const { projectId, staffId, employeeId } = await request.json();
    const resolvedStaffId = staffId || employeeId;

    if (!projectId || !resolvedStaffId) {
      return NextResponse.json(
        { message: "Missing projectId or staffId" },
        { status: 400 },
      );
    }

    const projData = await hasuraFetch(
      PROJECT_CTX,
      { id: projectId },
      { admin: true },
    );
    const proj = projData.projects_by_pk;

    if (!proj) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const canManage = await canManageProject(projectId, user);
    if (!canManage) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const staffData = await hasuraFetch(
      STAFF_CTX,
      { id: resolvedStaffId },
      { admin: true },
    );
    const staff = staffData.staff_by_pk;

    if (!staff) {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 },
      );
    }

    if (
      proj.organization_id !== staff.organization_id &&
      user.role !== "Super Admin"
    ) {
      return NextResponse.json(
        {
          message:
            "Staff member and project must belong to the same organization",
        },
        { status: 400 },
      );
    }

    await hasuraFetch(
      ASSIGN,
      { objects: [{ project_id: projectId, staff_id: resolvedStaffId }] },
      { admin: true },
    );

    const refreshed = await hasuraFetch(
      PROJECT_CTX,
      { id: projectId },
      { admin: true },
    );

    return NextResponse.json(
      {
        message: "Staff member assigned successfully",
        project: toProjectShape(refreshed.projects_by_pk),
        employee: staff
          ? {
              ...toStaffShape(staff),
              assignedProjects: [],
            }
          : null,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/employee/assign error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 },
    );
  }
});
