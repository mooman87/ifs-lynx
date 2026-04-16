// api/project/[id]/schedule/requests/[requestId]/resolve/route.js
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

const REQUEST_BY_ID = `
query RequestById($id: uuid!) {
  project_schedule_requests_by_pk(id: $id) {
    id
    project_id
    staff_id
    requested_by_staff_id
    resolved_by_staff_id
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
      user_id
      user_legacy_id
      first_name
      last_name
      full_name
      email
      role
      org_role
      staff_type
      can_login
      is_active
      reports_to
    }
  }
}
`;

const PROJECT_CTX = `
query ProjectCtx($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
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
  }
}
`;

const INSERT_SCHEDULE = `
mutation InsertSchedule($object: project_schedule_insert_input!) {
  insert_project_schedule_one(object: $object) {
    id
  }
}
`;

const FIND_SCHEDULE_STAFF = `
query FindScheduleStaff($scheduleId: uuid!, $staffId: uuid!) {
  project_schedule_staff(
    where: {
      schedule_id: { _eq: $scheduleId }
      staff_id: { _eq: $staffId }
    }
    limit: 1
  ) {
    schedule_id
    staff_id
  }
}
`;

const INSERT_SCHEDULE_STAFF = `
mutation InsertScheduleStaff($object: project_schedule_staff_insert_input!) {
  insert_project_schedule_staff_one(object: $object) {
    schedule_id
    staff_id
  }
}
`;

const UPDATE_SCHEDULE_STAFF = `
mutation UpdateScheduleStaff(
  $scheduleId: uuid!,
  $staffId: uuid!,
  $set: project_schedule_staff_set_input!
) {
  update_project_schedule_staff(
    where: {
      schedule_id: { _eq: $scheduleId }
      staff_id: { _eq: $staffId }
    }
    _set: $set
  ) {
    affected_rows
  }
}
`;

const UPDATE_REQUEST = `
mutation UpdateRequest($id: uuid!, $set: project_schedule_requests_set_input!) {
  update_project_schedule_requests_by_pk(pk_columns: { id: $id }, _set: $set) {
    id
    project_id
    staff_id
    requested_by_staff_id
    resolved_by_staff_id
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
      user_id
      user_legacy_id
      first_name
      last_name
      full_name
      email
      role
      org_role
      staff_type
      can_login
      is_active
      reports_to
    }
  }
}
`;

function toApiStaff(s) {
  if (!s) return null;

  return {
    id: s.id,
    _id: s.id,
    userId: s.user_id ?? s.user_legacy_id ?? null,
    firstName: s.first_name ?? "",
    lastName: s.last_name ?? "",
    fullName:
      s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim(),
    email: s.email ?? "",
    role: s.org_role ?? s.role ?? null,
    staffType: s.staff_type ?? "employee",
    canLogin: s.can_login ?? true,
    isActive: s.is_active ?? true,
    reportsTo: s.reports_to ?? null,
  };
}

function toApiRequest(req) {
  const staff = toApiStaff(req?.staffByStaffId);
  const fullName =
    staff?.fullName ||
    `${staff?.firstName || ""} ${staff?.lastName || ""}`.trim() ||
    "Unknown Staff";

  return {
    id: req.id,
    projectId: req.project_id,
    staffId: req.staff_id,
    requestedByStaffId: req.requested_by_staff_id || null,
    resolvedByStaffId: req.resolved_by_staff_id || null,
    type: req.request_type,
    currentShiftLabel: req.current_shift_label || "",
    requestedShiftLabel: req.requested_shift_label || "",
    detail: req.detail || "",
    status: req.status,
    date: normalizeWorkDate(req.work_date),
    createdAt: req.created_at || null,
    resolvedAt: req.resolved_at || null,
    staffName: fullName,
    staffFirstName: staff?.firstName || "",
    staffLastName: staff?.lastName || "",
    initials:
      `${staff?.firstName?.[0] || "?"}${staff?.lastName?.[0] || "?"}`.toUpperCase(),
    staff,
  };
}

export const POST = withUser(async (request, user, ctx) => {
  try {
    const { id: projectId, requestId } = await ctx.params;
    const body = await request.json();
    const resolution = body.resolution;

    if (!["approved", "denied"].includes(resolution)) {
      return NextResponse.json(
        { message: "Invalid resolution" },
        { status: 400 },
      );
    }

    const canManage = await canManageProject(projectId, user);
    if (!canManage) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const projectData = await hasuraFetch(
      PROJECT_CTX,
      { id: projectId },
      { admin: true },
    );
    const project = projectData.projects_by_pk;

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const reqData = await hasuraFetch(
      REQUEST_BY_ID,
      { id: requestId },
      { admin: true },
    );
    const scheduleRequest = reqData.project_schedule_requests_by_pk;

    if (!scheduleRequest || scheduleRequest.project_id !== projectId) {
      return NextResponse.json(
        { message: "Schedule request not found" },
        { status: 404 },
      );
    }

    if (scheduleRequest.status !== "pending") {
      return NextResponse.json(
        { message: "Schedule request already resolved" },
        { status: 400 },
      );
    }

    if (resolution === "approved") {
      const workDate = normalizeWorkDate(scheduleRequest.work_date);

      const findSched = await hasuraFetch(
        FIND_SCHEDULE,
        { projectId, workDate },
        { admin: true },
      );

      let scheduleId = findSched.project_schedule?.[0]?.id;

      if (!scheduleId) {
        const inserted = await hasuraFetch(
          INSERT_SCHEDULE,
          { object: { project_id: projectId, work_date: workDate } },
          { admin: true },
        );
        scheduleId = inserted.insert_project_schedule_one?.id;
      }

      const existingLink = await hasuraFetch(
        FIND_SCHEDULE_STAFF,
        { scheduleId, staffId: scheduleRequest.staff_id },
        { admin: true },
      );

      if (!existingLink.project_schedule_staff?.length) {
        await hasuraFetch(
          INSERT_SCHEDULE_STAFF,
          {
            object: {
              schedule_id: scheduleId,
              staff_id: scheduleRequest.staff_id,
              status:
                scheduleRequest.request_type === "day_off" ? "off" : "working",
              shift_label:
                scheduleRequest.request_type === "day_off"
                  ? null
                  : scheduleRequest.requested_shift_label ||
                    scheduleRequest.current_shift_label ||
                    null,
              notes:
                scheduleRequest.request_type === "day_off"
                  ? "Approved day off"
                  : "Shift change approved",
              updated_at: new Date().toISOString(),
            },
          },
          { admin: true },
        );
      } else {
        await hasuraFetch(
          UPDATE_SCHEDULE_STAFF,
          {
            scheduleId,
            staffId: scheduleRequest.staff_id,
            set: {
              status:
                scheduleRequest.request_type === "day_off" ? "off" : "working",
              shift_label:
                scheduleRequest.request_type === "day_off"
                  ? null
                  : scheduleRequest.requested_shift_label ||
                    scheduleRequest.current_shift_label ||
                    null,
              notes:
                scheduleRequest.request_type === "day_off"
                  ? "Approved day off"
                  : "Shift change approved",
              updated_at: new Date().toISOString(),
            },
          },
          { admin: true },
        );
      }
    }

    const updated = await hasuraFetch(
      UPDATE_REQUEST,
      {
        id: requestId,
        set: {
          status: resolution,
          resolved_at: new Date().toISOString(),
          resolved_by_staff_id: user.staffId || user.userId || null,
        },
      },
      { admin: true },
    );

    return NextResponse.json(
      {
        message: `Request ${resolution} successfully`,
        request: toApiRequest(updated.update_project_schedule_requests_by_pk),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "POST /api/project/[id]/schedule/requests/[requestId]/resolve error:",
      error,
    );
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
