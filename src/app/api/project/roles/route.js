import { NextResponse } from "next/server";
import { withUser, canAdminProject } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const PROJECT_CTX = `
query ProjectCtx($id: uuid!) {
  projects_by_pk(id: $id) {
    id
    organization_id
    campaign_name
  }
}
`;

const USER_CTX = `
query UserCtx($id: uuid!) {
  users_by_pk(id: $id) {
    id
    full_name
    email
    role
    organization_id
  }
}
`;

const LIST_PROJECT_ROLES = `
query ListProjectRoles($projectId: uuid!) {
  project_user_roles(
    where: { project_id: { _eq: $projectId } }
    order_by: { created_at: asc }
  ) {
    id
    user_id
    project_role
    created_at
    updated_at
  }
}
`;

const USERS_BY_IDS = `
query UsersByIds($ids: [uuid!]!) {
  users(where: { id: { _in: $ids } }) {
    id
    full_name
    email
    role
    organization_id
  }
}
`;

const UPSERT_PROJECT_ROLE = `
mutation UpsertProjectRole($object: project_user_roles_insert_input!) {
  insert_project_user_roles_one(
    object: $object
    on_conflict: {
      constraint: project_user_roles_project_id_user_id_key
      update_columns: [project_role, updated_at]
    }
  ) {
    id
    user_id
    project_role
    created_at
    updated_at
  }
}
`;

const DELETE_PROJECT_ROLE = `
mutation DeleteProjectRole($projectId: uuid!, $userId: uuid!) {
  delete_project_user_roles(
    where: {
      project_id: { _eq: $projectId }
      user_id: { _eq: $userId }
    }
  ) {
    affected_rows
  }
}
`;

const ALLOWED_PROJECT_ROLES = [
  "Viewer",
  "Field Lead",
  "Scheduler",
  "Project Manager",
  "Project Admin",
];

function normalizeUser(u) {
  if (!u) return null;

  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    orgRole: u.role,
    organizationId: u.organization_id,
  };
}

async function buildRoleRows(projectId) {
  const data = await hasuraFetch(
    LIST_PROJECT_ROLES,
    { projectId },
    { admin: true },
  );

  const rows = data.project_user_roles || [];
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

  let userMap = new Map();

  if (userIds.length > 0) {
    const usersData = await hasuraFetch(
      USERS_BY_IDS,
      { ids: userIds },
      { admin: true },
    );

    userMap = new Map(
      (usersData.users || []).map((u) => [u.id, normalizeUser(u)]),
    );
  }

  return rows.map((row) => ({
    id: row.id,
    projectRole: row.project_role,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: userMap.get(row.user_id) || null,
  }));
}

export const GET = withUser(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { message: "Missing projectId" },
        { status: 400 },
      );
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

    const isSameOrg =
      user.role === "Super Admin" ||
      user.organization?.id === project.organization_id;

    if (!isSameOrg) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const roles = await buildRoleRows(projectId);

    return NextResponse.json({ roles }, { status: 200 });
  } catch (error) {
    console.error("GET /api/project/roles error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const POST = withUser(async (request, user) => {
  try {
    const { projectId, userId, projectRole } = await request.json();

    if (!projectId || !userId || !projectRole) {
      return NextResponse.json(
        { message: "Missing projectId, userId, or projectRole" },
        { status: 400 },
      );
    }

    if (!ALLOWED_PROJECT_ROLES.includes(projectRole)) {
      return NextResponse.json(
        { message: "Invalid projectRole" },
        { status: 400 },
      );
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

    const canAdmin = await canAdminProject(projectId, user);
    if (!canAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const userData = await hasuraFetch(
      USER_CTX,
      { id: userId },
      { admin: true },
    );
    const targetUser = userData.users_by_pk;

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (
      targetUser.organization_id !== project.organization_id &&
      user.role !== "Super Admin"
    ) {
      return NextResponse.json(
        { message: "User and project must belong to the same organization" },
        { status: 400 },
      );
    }

    await hasuraFetch(
      UPSERT_PROJECT_ROLE,
      {
        object: {
          project_id: projectId,
          user_id: userId,
          project_role: projectRole,
          updated_at: new Date().toISOString(),
        },
      },
      { admin: true },
    );

    const roles = await buildRoleRows(projectId);
    const saved = roles.find((r) => r.userId === userId) || null;

    return NextResponse.json(
      {
        message: "Project role saved.",
        role: saved,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/project/roles error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const DELETE = withUser(async (request, user) => {
  try {
    const { projectId, userId } = await request.json();

    if (!projectId || !userId) {
      return NextResponse.json(
        { message: "Missing projectId or userId" },
        { status: 400 },
      );
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

    const canAdmin = await canAdminProject(projectId, user);
    if (!canAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const deleted = await hasuraFetch(
      DELETE_PROJECT_ROLE,
      { projectId, userId },
      { admin: true },
    );

    return NextResponse.json(
      {
        message: "Project role removed.",
        affectedRows: deleted.delete_project_user_roles?.affected_rows ?? 0,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/project/roles error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
