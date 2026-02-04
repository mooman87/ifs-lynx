// src/app/api/employee/assign/route.js
import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const PROJECT_CTX = `
query ProjectCtx($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
  }
}
`;

const EMPLOYEE_CTX = `
query EmployeeCtx($id: uuid!) {
  employees_by_pk(id: $id) {
    id
    organization_id
    first_name
    last_name
    email
  }
}
`;

const ASSIGN = `
mutation Assign($objects: [project_employees_insert_input!]!) {
  insert_project_employees(
    objects: $objects,
    on_conflict: {
      constraint: project_employees_project_id_employee_id_key,
      update_columns: []
    }
  ) {
    affected_rows
  }
}
`;

const PROJECT_WITH_ASSIGNED = `
query ProjectWithAssigned($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    campaign_name
    start_date
    end_date
    doors_remaining
    total_doors_knocked
    state_director

    project_employees(distinct_on: employee_id) {
      employee {
        id
        first_name
        last_name
        email
      }
    }
  }
}
`;

function toMongoishProject(p) {
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

    assignedEmployees: (p.project_employees || [])
      .map((pe) => pe.employee)
      .filter(Boolean)
      .map((e) => ({
        _id: e.id,
        id: e.id,
        firstName: e.first_name,
        lastName: e.last_name,
        email: e.email,
      })),
  };
}

export const POST = withUser(async (request, user) => {
  try {
    const { projectId, employeeId } = await request.json();

    if (!projectId || !employeeId) {
      return NextResponse.json(
        { message: "Missing projectId or employeeId" },
        { status: 400 }
      );
    }

    const isSuperAdmin = user.role === "Super Admin";

    // fetch project + employee orgs
    const projData = await hasuraFetch(PROJECT_CTX, { id: projectId }, { admin: true });
    const proj = projData.projects_by_pk;
    if (!proj) return NextResponse.json({ message: "Project not found" }, { status: 404 });

    const empData = await hasuraFetch(EMPLOYEE_CTX, { id: employeeId }, { admin: true });
    const emp = empData.employees_by_pk;
    if (!emp) return NextResponse.json({ message: "Employee not found" }, { status: 404 });

    // org gate: employee + project must match user's org (unless SA)
    if (!isSuperAdmin) {
      const userOrg = user.organization?.id;
      if (!userOrg || proj.organization_id !== userOrg || emp.organization_id !== userOrg) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    } else {
      // even for SA, keep project/employee org consistent
      if (proj.organization_id !== emp.organization_id) {
        return NextResponse.json(
          { message: "Employee and Project must belong to the same organization" },
          { status: 400 }
        );
      }
    }

    // ✅ IMPORTANT FIX: variable name + array type must match ($objects: [...])
    await hasuraFetch(
      ASSIGN,
      { objects: [{ project_id: projectId, employee_id: employeeId }] },
      { admin: true }
    );

    // return refreshed project
    const refreshed = await hasuraFetch(PROJECT_WITH_ASSIGNED, { id: projectId }, { admin: true });

    return NextResponse.json(
      {
        message: "Employee assigned successfully",
        project: toMongoishProject(refreshed.projects_by_pk),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/employee/assign error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
});
