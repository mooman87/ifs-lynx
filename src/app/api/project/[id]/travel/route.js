import { NextResponse } from "next/server";
import { withUser, canManageProject } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const PROJECT_CTX = `
query ProjectCtx($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    project_staff(order_by: { staff: { last_name: asc } }) {
      staff_id
      staff {
        id
        first_name
        last_name
        full_name
        email
      }
    }
  }
}
`;

const PROJECT_TRAVEL = `
query ProjectTravel($projectId: uuid!) {
  staff_travel(
    where: { project_id: { _eq: $projectId } }
    order_by: { updated_at: desc }
  ) {
    id
    project_id
    staff_id
    organization_id
    details
    created_at
    updated_at
    staff {
      id
      first_name
      last_name
      full_name
      email
    }
  }
}
`;

const STAFF_BY_PK = `
query StaffByPk($id: uuid!) {
  staff_by_pk(id: $id) {
    id
    organization_id
    first_name
    last_name
    full_name
    email
  }
}
`;

const TRAVEL_BY_ID = `
query TravelById($id: uuid!) {
  staff_travel_by_pk(id: $id) {
    id
    project_id
    staff_id
    organization_id
    details
    created_at
    updated_at
    staff {
      id
      first_name
      last_name
      full_name
      email
    }
  }
}
`;

const UPSERT_TRAVEL = `
mutation UpsertTravel($object: staff_travel_insert_input!) {
  insert_staff_travel_one(
    object: $object
    on_conflict: {
      constraint: staff_travel_project_id_staff_id_key
      update_columns: [details, updated_at]
    }
  ) {
    id
    project_id
    staff_id
    organization_id
    details
    created_at
    updated_at
    staff {
      id
      first_name
      last_name
      full_name
      email
    }
  }
}
`;

const DELETE_TRAVEL = `
mutation DeleteTravel($id: uuid!) {
  delete_staff_travel_by_pk(id: $id) {
    id
  }
}
`;

function normalizeTravel(row) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id,
    projectId: row.project_id,
    staffId: row.staff_id,
    employee: row.staff
      ? {
          id: row.staff.id,
          _id: row.staff.id,
          firstName: row.staff.first_name ?? "",
          lastName: row.staff.last_name ?? "",
          fullName:
            row.staff.full_name ||
            [row.staff.first_name, row.staff.last_name]
              .filter(Boolean)
              .join(" "),
          email: row.staff.email ?? null,
        }
      : null,
    ...(row.details && typeof row.details === "object" ? row.details : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function stripReservedFields(body = {}) {
  const clone = { ...body };
  delete clone.id;
  delete clone._id;
  delete clone.projectId;
  delete clone.project_id;
  delete clone.staffId;
  delete clone.staff_id;
  delete clone.employee;
  delete clone.organization_id;
  delete clone.organizationId;
  delete clone.createdAt;
  delete clone.updatedAt;
  return clone;
}

export const GET = withUser(async (_request, user, ctx) => {
  try {
    const { id } = await ctx.params;

    const projectData = await hasuraFetch(PROJECT_CTX, { id }, { admin: true });
    const project = projectData.projects_by_pk;

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

    const travelData = await hasuraFetch(
      PROJECT_TRAVEL,
      { projectId: id },
      { admin: true },
    );

    const staffOptions = (project.project_staff || [])
      .map((ps) => ps.staff)
      .filter(Boolean)
      .map((staff) => ({
        id: staff.id,
        _id: staff.id,
        firstName: staff.first_name ?? "",
        lastName: staff.last_name ?? "",
        fullName:
          staff.full_name ||
          [staff.first_name, staff.last_name].filter(Boolean).join(" "),
        email: staff.email ?? null,
      }));

    return NextResponse.json(
      {
        travels: (travelData.staff_travel || []).map(normalizeTravel),
        staffOptions,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/project/[id]/travel error:", error);
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

    const canManage = await canManageProject(id, user);
    if (!canManage) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const projectData = await hasuraFetch(PROJECT_CTX, { id }, { admin: true });
    const project = projectData.projects_by_pk;

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const staffId = body.staffId || body.employeeId;
    if (!staffId) {
      return NextResponse.json(
        { message: "Staff ID is required" },
        { status: 400 },
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

    const staffRes = await hasuraFetch(
      STAFF_BY_PK,
      { id: staffId },
      { admin: true },
    );
    const staff = staffRes.staff_by_pk;

    if (!staff) {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 },
      );
    }

    if (
      user.role !== "Super Admin" &&
      user.organization?.id !== project.organization_id
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const details = stripReservedFields(body);

    const inserted = await hasuraFetch(
      UPSERT_TRAVEL,
      {
        object: {
          project_id: project.id,
          staff_id: staff.id,
          organization_id: project.organization_id,
          details,
          updated_at: new Date().toISOString(),
        },
      },
      { admin: true },
    );

    return NextResponse.json(
      {
        message: "Project travel saved successfully",
        travel: normalizeTravel(inserted.insert_staff_travel_one),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/project/[id]/travel error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const DELETE = withUser(async (request, user, ctx) => {
  try {
    const { id } = await ctx.params;
    const { travelId } = await request.json();

    if (!travelId) {
      return NextResponse.json(
        { message: "Missing travel id" },
        { status: 400 },
      );
    }

    const canManage = await canManageProject(id, user);
    if (!canManage) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const existingRes = await hasuraFetch(
      TRAVEL_BY_ID,
      { id: travelId },
      { admin: true },
    );
    const existing = existingRes.staff_travel_by_pk;

    if (!existing || existing.project_id !== id) {
      return NextResponse.json(
        { message: "Travel record not found for this project" },
        { status: 404 },
      );
    }

    if (
      user.role !== "Super Admin" &&
      user.organization?.id !== existing.organization_id
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await hasuraFetch(DELETE_TRAVEL, { id: travelId }, { admin: true });

    return NextResponse.json(
      { message: "Project travel deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/project/[id]/travel error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
