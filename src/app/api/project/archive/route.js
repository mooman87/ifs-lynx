import { NextResponse } from "next/server";
import { withUser, canAdminProject } from "@/utils/auth";
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

export const POST = withUser(async (request, user) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Missing project id" },
        { status: 400 },
      );
    }

    const ctx = await hasuraFetch(PROJECT_ORG_QUERY, { id }, { admin: true });
    const project = ctx.projects_by_pk;

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    const canArchive = await canAdminProject(id, user);
    if (!canArchive) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const ts = new Date().toISOString();
    await hasuraFetch(ARCHIVE_PROJECT, { id, ts }, { admin: true });

    return NextResponse.json(
      { message: "Archived", id, archived_at: ts },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/project/archive error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 },
    );
  }
});
