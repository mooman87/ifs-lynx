// api/project/[id]/schedule/requests/route.js
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

const STAFF_CTX = `
query StaffCtx($id: uuid!) {
  staff_by_pk(id: $id) {
    id
    organization_id
    first_name
    last_name
    full_name
    email
    user_id
    user_legacy_id
    role
    org_role
    staff_type
    can_login
    is_active
    reports_to
  }
}
`;

const REQUESTS_BY_PROJECT = `
query RequestsByProject($projectId: uuid!, $workDate: String!) {
  project_schedule_requests(
    where: {
      project_id: { _eq: $projectId }
      work_date: { _eq: $workDate }
    }
    order_by: [{ status: asc }, { created_at: desc }]
  ) {
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
      first_name
      last_name
      full_name
      email
      user_id
      user_legacy_id
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

const REQUESTS_BY_PROJECT_NO_DATE = `
query RequestsByProjectNoDate($projectId: uuid!) {
  project_schedule_requests(
    where: { project_id: { _eq: $projectId } }
    order_by: [{ status: asc }, { created_at: desc }]
  ) {
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
      first_name
      last_name
      full_name
      email
      user_id
      user_legacy_id
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

const INSERT_REQUEST = `
mutation InsertRequest($object: project_schedule_requests_insert_input!) {
  insert_project_schedule_requests_one(object: $object) {
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
      first_name
      last_name
      full_name
      email
      user_id
      user_legacy_id
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
  const staff = toApiStaff(req.staffByStaffId);
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
    createdAt: req.created_at,
    resolvedAt: req.resolved_at,
    staffName: fullName,
    staffFirstName: staff?.firstName || "",
    staffLastName: staff?.lastName || "",
    initials:
      `${staff?.firstName?.[0] || "?"}${staff?.lastName?.[0] || "?"}`.toUpperCase(),
    staff,
  };
}

export const GET = withUser(async (request, user, ctx) => {
  try {
    const { id } = await ctx.params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const ctxData = await hasuraFetch(PROJECT_CTX, { id }, { admin: true });
    const project = ctxData.projects_by_pk;

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const canManage = await canManageProject(id, user);
    const isSameOrg =
      user.role === "Super Admin" ||
      user.organization?.id === project.organization_id;

    if (!canManage && !isSameOrg) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = date
      ? await hasuraFetch(
          REQUESTS_BY_PROJECT,
          { projectId: id, workDate: normalizeWorkDate(date) },
          { admin: true },
        )
      : await hasuraFetch(
          REQUESTS_BY_PROJECT_NO_DATE,
          { projectId: id },
          { admin: true },
        );
    return NextResponse.json(
      {
        requests: (data.project_schedule_requests || []).map(toApiRequest),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/project/[id]/schedule/requests error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const POST = withUser(async (request, user, ctx) => {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    const staffId = body.staffId || body.employeeId;
    const workDate = normalizeWorkDate(body.date);
    const requestType = body.requestType;
    const currentShiftLabel = body.currentShiftLabel || null;
    const requestedShiftLabel = body.requestedShiftLabel || null;
    const detail = body.detail || null;

    if (!staffId || !workDate || !requestType) {
      return NextResponse.json(
        { message: "Missing staffId, date, or requestType" },
        { status: 400 },
      );
    }

    if (!["day_off", "shift_change"].includes(requestType)) {
      return NextResponse.json(
        { message: "Invalid request type" },
        { status: 400 },
      );
    }

    const ctxData = await hasuraFetch(PROJECT_CTX, { id }, { admin: true });
    const project = ctxData.projects_by_pk;

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const assignedIds = new Set(
      (project.project_staff || []).map((ps) => ps.staff_id),
    );

    if (!assignedIds.has(staffId)) {
      return NextResponse.json(
        { message: "Staff member is not assigned to this project" },
        { status: 400 },
      );
    }

    const staffData = await hasuraFetch(
      STAFF_CTX,
      { id: staffId },
      { admin: true },
    );
    const staff = staffData.staff_by_pk;

    if (!staff) {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 },
      );
    }

    const isSameOrg =
      user.role === "Super Admin" ||
      user.organization?.id === project.organization_id;

    if (!isSameOrg) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const inserted = await hasuraFetch(
      INSERT_REQUEST,
      {
        object: {
          project_id: id,
          staff_id: staffId,
          requested_by_staff_id: user.staffId || user.userId || null,
          work_date: workDate,
          request_type: requestType,
          current_shift_label: currentShiftLabel,
          requested_shift_label: requestedShiftLabel,
          detail,
          status: "pending",
        },
      },
      { admin: true },
    );

    return NextResponse.json(
      {
        message: "Schedule request created successfully",
        request: toApiRequest(inserted.insert_project_schedule_requests_one),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/project/[id]/schedule/requests error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
