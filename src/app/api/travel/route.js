// src/app/api/travel/route.js
import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const STAFF_TRAVEL_ALL = `
query StaffTravelAll($orgId: uuid) {
  staff_travel(
    where: { organization_id: { _eq: $orgId } }
    order_by: [{ project_id: asc_nulls_first }, { updated_at: desc }]
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

const STAFF_TRAVEL_ALL_SUPERADMIN = `
query StaffTravelAllSuperAdmin {
  staff_travel(order_by: [{ project_id: asc_nulls_first }, { updated_at: desc }]) {
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

const PROJECTS_BY_IDS = `
query ProjectsByIds($ids: [uuid!]!) {
  projects(where: { id: { _in: $ids } }) {
    id
    campaign_name
    organization_id
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

const PROJECT_STAFF_CTX = `
query ProjectStaffCtx($projectId: uuid!, $staffId: uuid!) {
  projects_by_pk(id: $projectId) {
    id
    organization_id
    campaign_name
    project_staff(where: { staff_id: { _eq: $staffId } }) {
      staff_id
    }
  }
}
`;

const STAFF_TRAVEL_BY_ID = `
query StaffTravelById($id: uuid!) {
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

const UPSERT_STAFF_TRAVEL = `
mutation UpsertStaffTravel($object: staff_travel_insert_input!) {
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

const UPDATE_STAFF_TRAVEL = `
mutation UpdateStaffTravel($id: uuid!, $details: jsonb!, $updatedAt: timestamptz!) {
  update_staff_travel_by_pk(
    pk_columns: { id: $id }
    _set: { details: $details, updated_at: $updatedAt }
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

const DELETE_STAFF_TRAVEL = `
mutation DeleteStaffTravel($id: uuid!) {
  delete_staff_travel_by_pk(id: $id) {
    id
  }
}
`;

function normalizeTravel(row, projectsById = new Map()) {
  if (!row) return null;

  const project =
    row.project_id && projectsById.has(row.project_id)
      ? projectsById.get(row.project_id)
      : null;

  return {
    id: row.id,
    _id: row.id,
    projectId: row.project_id ?? null,
    project: project
      ? {
          id: project.id,
          name: project.campaign_name || "Untitled project",
        }
      : null,
    projectName: project?.campaign_name || null,
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
  delete clone.staff;
  delete clone.staffId;
  delete clone.staff_id;
  delete clone.employee;
  delete clone.project;
  delete clone.projectId;
  delete clone.project_id;
  delete clone.projectName;
  delete clone.organization_id;
  delete clone.organizationId;
  delete clone.createdAt;
  delete clone.updatedAt;
  return clone;
}

async function buildProjectMap(rows = []) {
  const ids = Array.from(
    new Set(rows.map((row) => row.project_id).filter(Boolean)),
  );

  if (!ids.length) return new Map();

  const data = await hasuraFetch(PROJECTS_BY_IDS, { ids }, { admin: true });
  return new Map((data.projects || []).map((p) => [p.id, p]));
}

export const GET = withUser(async (_request, user) => {
  try {
    const isSuperAdmin = user.role === "Super Admin";

    const data = isSuperAdmin
      ? await hasuraFetch(STAFF_TRAVEL_ALL_SUPERADMIN, {}, { admin: true })
      : await hasuraFetch(
          STAFF_TRAVEL_ALL,
          { orgId: user.organization?.id || null },
          { admin: true },
        );

    const rows = data.staff_travel || [];
    const projectsById = await buildProjectMap(rows);
    const travels = rows.map((row) => normalizeTravel(row, projectsById));

    return NextResponse.json({ travels }, { status: 200 });
  } catch (error) {
    console.error("GET /api/travel error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const POST = withUser(async (request, user) => {
  try {
    const body = await request.json();
    const staffId = body.staffId || body.employee;
    const projectId = body.projectId || body.project_id || null;

    if (!staffId) {
      return NextResponse.json(
        { message: "Staff ID is required" },
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

    const isSameOrg =
      user.role === "Super Admin" ||
      user.organization?.id === staff.organization_id;

    if (!isSameOrg) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (projectId) {
      const projectCtx = await hasuraFetch(
        PROJECT_STAFF_CTX,
        { projectId, staffId },
        { admin: true },
      );

      const project = projectCtx.projects_by_pk;
      const isAssigned = Boolean(project?.project_staff?.length);

      if (!project || !isAssigned) {
        return NextResponse.json(
          { message: "Staff member is not assigned to that project" },
          { status: 400 },
        );
      }

      if (
        user.role !== "Super Admin" &&
        user.organization?.id !== project.organization_id
      ) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    const details = stripReservedFields(body);

    const inserted = await hasuraFetch(
      UPSERT_STAFF_TRAVEL,
      {
        object: {
          staff_id: staff.id,
          project_id: projectId,
          organization_id: staff.organization_id,
          details,
          updated_at: new Date().toISOString(),
        },
      },
      { admin: true },
    );

    const projectMap = await buildProjectMap([
      inserted.insert_staff_travel_one,
    ]);

    return NextResponse.json(
      {
        message: "Travel details created successfully",
        travel: normalizeTravel(inserted.insert_staff_travel_one, projectMap),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/travel error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const PUT = withUser(async (request, user) => {
  try {
    const { id, updates } = await request.json();

    if (!id || !updates || typeof updates !== "object") {
      return NextResponse.json(
        { message: "Missing id or updates" },
        { status: 400 },
      );
    }

    const existingRes = await hasuraFetch(
      STAFF_TRAVEL_BY_ID,
      { id },
      { admin: true },
    );
    const existing = existingRes.staff_travel_by_pk;

    if (!existing) {
      return NextResponse.json(
        { message: "Travel details not found" },
        { status: 404 },
      );
    }

    const isSameOrg =
      user.role === "Super Admin" ||
      user.organization?.id === existing.organization_id;

    if (!isSameOrg) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const mergedDetails = {
      ...(existing.details && typeof existing.details === "object"
        ? existing.details
        : {}),
      ...stripReservedFields(updates),
    };

    const updated = await hasuraFetch(
      UPDATE_STAFF_TRAVEL,
      {
        id,
        details: mergedDetails,
        updatedAt: new Date().toISOString(),
      },
      { admin: true },
    );

    const projectMap = await buildProjectMap([
      updated.update_staff_travel_by_pk,
    ]);

    return NextResponse.json(
      {
        message: "Travel details updated successfully",
        travel: normalizeTravel(updated.update_staff_travel_by_pk, projectMap),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/travel error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const DELETE = withUser(async (request, user) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Missing travel id" },
        { status: 400 },
      );
    }

    const existingRes = await hasuraFetch(
      STAFF_TRAVEL_BY_ID,
      { id },
      { admin: true },
    );
    const existing = existingRes.staff_travel_by_pk;

    if (!existing) {
      return NextResponse.json(
        { message: "Travel details not found" },
        { status: 404 },
      );
    }

    const isSameOrg =
      user.role === "Super Admin" ||
      user.organization?.id === existing.organization_id;

    if (!isSameOrg) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await hasuraFetch(DELETE_STAFF_TRAVEL, { id }, { admin: true });

    return NextResponse.json(
      { message: "Travel details deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/travel error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
