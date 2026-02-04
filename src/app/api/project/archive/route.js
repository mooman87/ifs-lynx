import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const PROJECT_ORG_QUERY = `
query ProjectOrg($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
  }
}
`;

const ARCHIVE_PROJECT = `
mutation ArchiveProject($id: uuid!, $ts: timestamptz!) {
  update_projects_by_pk(
    pk_columns: { id: $id }
    _set: { archived_at: $ts }
  ) {
    id
    archived_at
  }
}
`;

const roleRank = {
  Canvasser: 1,
  "Field Director": 2,
  "Deputy State Director": 3,
  "State Director": 4,
  "Political Director": 5,
  "C Suite": 6,
  HR: 6,
  Payroll: 6,
  Travel: 6,
  "Super Admin": 99,
  Demo: 4,
};

const MIN_ARCHIVE_ROLE = "State Director";

function canArchive(user, projectOrgId) {
  if (!user) return false;
  if (user.role === "Super Admin") return false; // SA deletes instead

  if (user.organization?.id !== projectOrgId) return false;

  const rank = roleRank[user.role] ?? 0;
  return rank >= roleRank[MIN_ARCHIVE_ROLE];
}

export const POST = withUser(async (request, user) => {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: "Missing project id" }, { status: 400 });
    }

    // fetch project org
    const ctx = await hasuraFetch(PROJECT_ORG_QUERY, { id }, { admin: true });
    const project = ctx.projects_by_pk;

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    if (!canArchive(user, project.organization_id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const ts = new Date().toISOString();

    await hasuraFetch(
      ARCHIVE_PROJECT,
      { id, ts },
      { admin: true }
    );

    return NextResponse.json(
      { message: "Archived", id, archived_at: ts },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/project/archive error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
});
