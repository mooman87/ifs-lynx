// src/app/api/travel/[id]/route.js
import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const STAFF_TRAVEL_BY_STAFF_ID = `
query StaffTravelByStaffId($staffId: uuid!) {
  staff_travel(
    where: { staff_id: { _eq: $staffId } }
    order_by: { updated_at: desc }
    limit: 1
  ) {
    id
    project_id
    staff_id
    organization_id
    details
    created_at
    updated_at
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
  }
}
`;

const PROJECT_BY_PK = `
query ProjectByPk($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    campaign_name
    organization_id
  }
}
`;

function normalizeTravel(row, staff = null, project = null) {
  if (!row) return null;

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
    employee: staff
      ? {
          id: staff.id,
          _id: staff.id,
          firstName: staff.first_name ?? "",
          lastName: staff.last_name ?? "",
          fullName:
            staff.full_name ||
            [staff.first_name, staff.last_name].filter(Boolean).join(" "),
          email: staff.email ?? null,
        }
      : null,
    ...(row.details && typeof row.details === "object" ? row.details : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const GET = withUser(async (_request, user, { params }) => {
  try {
    const { id } = await params;

    const staffData = await hasuraFetch(STAFF_CTX, { id }, { admin: true });
    const staff = staffData.staff_by_pk;

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

    const data = await hasuraFetch(
      STAFF_TRAVEL_BY_STAFF_ID,
      { staffId: id },
      { admin: true },
    );

    const travelRow = data.staff_travel?.[0];
    if (!travelRow) {
      return NextResponse.json(
        { message: "No travel details found for this staff member" },
        { status: 404 },
      );
    }

    let project = null;
    if (travelRow.project_id) {
      const projectData = await hasuraFetch(
        PROJECT_BY_PK,
        { id: travelRow.project_id },
        { admin: true },
      );
      project = projectData.projects_by_pk || null;
    }

    return NextResponse.json(
      { travel: normalizeTravel(travelRow, staff, project) },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/travel/[id] error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
