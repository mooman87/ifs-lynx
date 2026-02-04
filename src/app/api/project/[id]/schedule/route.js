// src/app/api/project/[id]/schedule/route.js
import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

/**
 * Force any input into YYYY-MM-DD.
 * This keeps DB matching + UI matching consistent.
 */
function normalizeWorkDate(input) {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const dt = new Date(input);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);

  // last resort
  return String(input);
}

// 1) Fetch minimal project context for auth + assignment checks
const PROJECT_CTX = `
query ProjectCtx($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    project_employees {
      employee_id
    }
  }
}
`;

// 2) Find schedule row for (project_id, work_date)
const FIND_SCHEDULE = `
query FindSchedule($projectId: uuid!, $workDate: String!) {
  project_schedule(
    where: {
      project_id: { _eq: $projectId },
      work_date: { _eq: $workDate }
    }
    limit: 1
  ) {
    id
    work_date
  }
}
`;

// 3) Create schedule row (if missing)
const INSERT_SCHEDULE = `
mutation InsertSchedule($object: project_schedule_insert_input!) {
  insert_project_schedule_one(object: $object) {
    id
    work_date
  }
}
`;

// 4) Check if employee already linked to schedule
const FIND_SCHEDULE_EMPLOYEE = `
query FindScheduleEmployee($scheduleId: uuid!, $employeeId: uuid!) {
  project_schedule_employees(
    where: {
      schedule_id: { _eq: $scheduleId },
      employee_id: { _eq: $employeeId }
    }
    limit: 1
  ) {
    employee_id
  }
}
`;

// 5) Insert schedule employee (if missing)
const INSERT_SCHEDULE_EMPLOYEE = `
mutation InsertScheduleEmployee($object: project_schedule_employees_insert_input!) {
  insert_project_schedule_employees_one(object: $object) {
    employee_id
  }
}
`;

// 6) Return updated project in one shot
const PROJECT_BY_PK = `
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

    project_employees(order_by: { employee: { last_name: asc } }) {
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
      project_schedule_employees(order_by: { employee: { last_name: asc } }) {
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

function toMongoishProject(p) {
  if (!p) return null;

  const assignedEmployees =
    (p.project_employees || [])
      .map((pe) => pe.employee)
      .filter(Boolean)
      .map((e) => ({
        _id: e.id,
        id: e.id,
        firstName: e.first_name,
        lastName: e.last_name,
        email: e.email,
      }));

  // IMPORTANT: normalize work_date to YYYY-MM-DD on output too
  const schedule =
    (p.project_schedules || []).map((s) => ({
      id: s.id,
      date: normalizeWorkDate(s.work_date),
      employees: (s.project_schedule_employees || [])
        .map((se) => se.employee)
        .filter(Boolean)
        .map((e) => ({
          _id: e.id,
          id: e.id,
          firstName: e.first_name,
          lastName: e.last_name,
          email: e.email,
          doorsKnocked: e.doors_knocked ?? 0,
          doorsKnockedPerDay: e.doors_knocked_per_day ?? {},
          contactsMadePerDay: e.contacts_made_per_day ?? {},
        })),
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
    dailyStaffNeeded: p.daily_staff_needed || {},
    stateDirector: p.state_director,
    managerHotel: p.manager_hotel || null,
    staffHotel: p.staff_hotel || null,
    survey: p.survey || {},

    assignedEmployees,
    schedule,
  };
}

export const PUT = withUser(async (request, user, ctx) => {
  try {
    const { id } = await ctx.params;

    const body = await request.json();
    const employeeId = body.employeeId;
    const workDate = normalizeWorkDate(body.date);

    if (!id) {
      return NextResponse.json({ message: "Missing project id" }, { status: 400 });
    }
    if (!workDate || !employeeId) {
      return NextResponse.json({ message: "Missing date or employeeId" }, { status: 400 });
    }

    // ---------- auth + assignment gate ----------
    const ctxData = await hasuraFetch(PROJECT_CTX, { id }, { admin: true });
    const proj = ctxData.projects_by_pk;

    if (!proj) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const isSuperAdmin = user.role === "Super Admin";
    if (!isSuperAdmin && user.organization?.id !== proj.organization_id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const assignedIds = new Set((proj.project_employees || []).map((pe) => pe.employee_id));
    if (!assignedIds.has(employeeId)) {
      return NextResponse.json(
        { message: "Employee is not assigned to this project" },
        { status: 400 }
      );
    }

    // ---------- get or create schedule row ----------
    const findSched = await hasuraFetch(
      FIND_SCHEDULE,
      { projectId: id, workDate },
      { admin: true }
    );

    let scheduleId = findSched.project_schedule?.[0]?.id;

    if (!scheduleId) {
      const inserted = await hasuraFetch(
        INSERT_SCHEDULE,
        { object: { project_id: id, work_date: workDate } },
        { admin: true }
      );
      scheduleId = inserted.insert_project_schedule_one?.id;
    }

    if (!scheduleId) {
      return NextResponse.json({ message: "Failed to create/find schedule" }, { status: 500 });
    }

    // ---------- link employee to schedule (if missing) ----------
    const existingLink = await hasuraFetch(
      FIND_SCHEDULE_EMPLOYEE,
      { scheduleId, employeeId },
      { admin: true }
    );

    if (!existingLink.project_schedule_employees?.length) {
      await hasuraFetch(
        INSERT_SCHEDULE_EMPLOYEE,
        { object: { schedule_id: scheduleId, employee_id: employeeId } },
        { admin: true }
      );
    }

    // ---------- return refreshed project ----------
    const refreshed = await hasuraFetch(PROJECT_BY_PK, { id }, { admin: true });
    return NextResponse.json(
      {
        message: "Schedule updated successfully",
        project: toMongoishProject(refreshed.projects_by_pk),

        // extra debug candy (safe to keep or remove)
        meta: { projectId: id, scheduleId, workDate },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});
