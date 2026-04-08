import { NextResponse } from "next/server";
import { withUser, canManageProject } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

function normalizeWorkDate(input) {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  const dt = new Date(input);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);

  return String(input);
}

const PROJECT_CTX = `
query ProjectCtx($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    project_staff {
      staff_id
    }
  }
}
`;

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

const INSERT_SCHEDULE = `
mutation InsertSchedule($object: project_schedule_insert_input!) {
  insert_project_schedule_one(object: $object) {
    id
    work_date
  }
}
`;

const FIND_SCHEDULE_STAFF = `
query FindScheduleStaff($scheduleId: uuid!, $staffId: uuid!) {
  project_schedule_staff(
    where: {
      schedule_id: { _eq: $scheduleId },
      staff_id: { _eq: $staffId }
    }
    limit: 1
  ) {
    staff_id
  }
}
`;

const INSERT_SCHEDULE_STAFF = `
mutation InsertScheduleStaff($object: project_schedule_staff_insert_input!) {
  insert_project_schedule_staff_one(object: $object) {
    staff_id
  }
}
`;

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

    project_staff(order_by: { staff: { last_name: asc } }) {
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
      project_schedule_staff(order_by: { staff: { last_name: asc } }) {
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
    doorsKnockedPerDay: s.doors_knocked_per_day ?? {},
    contactsMadePerDay: s.contacts_made_per_day ?? {},
  };
}

function toProjectShape(p) {
  if (!p) return null;

  const assignedEmployees = (p.project_staff || [])
    .map((ps) => ps.staff)
    .filter(Boolean)
    .map(toApiStaff);

  const schedule = (p.project_schedules || []).map((s) => ({
    id: s.id,
    date: normalizeWorkDate(s.work_date),
    employees: (s.project_schedule_staff || [])
      .map((ss) => ss.staff)
      .filter(Boolean)
      .map(toApiStaff),
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
    const staffId = body.staffId || body.employeeId;
    const workDate = normalizeWorkDate(body.date);

    if (!id) {
      return NextResponse.json(
        { message: "Missing project id" },
        { status: 400 },
      );
    }

    if (!workDate || !staffId) {
      return NextResponse.json(
        { message: "Missing date or staffId" },
        { status: 400 },
      );
    }

    const ctxData = await hasuraFetch(PROJECT_CTX, { id }, { admin: true });
    const proj = ctxData.projects_by_pk;

    if (!proj) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const canManage = await canManageProject(id, user);
    if (!canManage) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const assignedIds = new Set(
      (proj.project_staff || []).map((ps) => ps.staff_id),
    );

    if (!assignedIds.has(staffId)) {
      return NextResponse.json(
        { message: "Staff member is not assigned to this project" },
        { status: 400 },
      );
    }

    const findSched = await hasuraFetch(
      FIND_SCHEDULE,
      { projectId: id, workDate },
      { admin: true },
    );

    let scheduleId = findSched.project_schedule?.[0]?.id;

    if (!scheduleId) {
      const inserted = await hasuraFetch(
        INSERT_SCHEDULE,
        { object: { project_id: id, work_date: workDate } },
        { admin: true },
      );
      scheduleId = inserted.insert_project_schedule_one?.id;
    }

    if (!scheduleId) {
      return NextResponse.json(
        { message: "Failed to create/find schedule" },
        { status: 500 },
      );
    }

    const existingLink = await hasuraFetch(
      FIND_SCHEDULE_STAFF,
      { scheduleId, staffId },
      { admin: true },
    );

    if (!existingLink.project_schedule_staff?.length) {
      await hasuraFetch(
        INSERT_SCHEDULE_STAFF,
        { object: { schedule_id: scheduleId, staff_id: staffId } },
        { admin: true },
      );
    }

    const refreshed = await hasuraFetch(PROJECT_BY_PK, { id }, { admin: true });

    return NextResponse.json(
      {
        message: "Schedule updated successfully",
        project: toProjectShape(refreshed.projects_by_pk),
        meta: { projectId: id, scheduleId, workDate },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
