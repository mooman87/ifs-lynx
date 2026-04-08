import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { hasuraFetch } from "@/utils/hasura";

const ME_QUERY = `
query Me($id: uuid!) {
  users_by_pk(id: $id) {
    id
    email
    username
    full_name
    role
    organization {
      id
      name
      slug
      org_type
      timezone
      seat_limit
      plan
      subscription_status
    }
  }
}
`;

const COUNT_USERS_BY_ORG = `
query CountUsersByOrg($orgId: uuid!) {
  users_aggregate(where: { organization_id: { _eq: $orgId } }) {
    aggregate {
      count
    }
  }
}
`;

const ORG_BY_ID = `
query OrgById($id: uuid!) {
  organizations_by_pk(id: $id) {
    id
    name
    slug
    org_type
    seat_limit
    plan
    subscription_status
  }
}
`;

const PROJECT_ROLE_BY_USER = `
query ProjectRoleByUser($projectId: uuid!, $userId: uuid!) {
  project_user_roles(
    where: {
      project_id: { _eq: $projectId }
      user_id: { _eq: $userId }
    }
    limit: 1
  ) {
    project_role
  }
}
`;

export const ORG_ROLE_RANK = {
  Demo: 0,
  Canvasser: 1,
  Organizer: 2,
  "Volunteer Coordinator": 2,
  "Field Director": 3,
  "Data Director": 3,
  "Communications Director": 3,
  "Digital Director": 3,
  "Press Secretary": 3,
  "Finance Director": 3,
  Treasurer: 4,
  "Deputy Campaign Manager": 4,
  "Deputy State Director": 4,
  "Operations Director": 4,
  "Campaign Manager": 5,
  "State Director": 5,
  "Political Director": 6,
  "C Suite": 7,
  HR: 7,
  Payroll: 7,
  Travel: 7,
  "Super Admin": 99,
};

export const PROJECT_ROLE_RANK = {
  Viewer: 1,
  "Field Lead": 2,
  Scheduler: 2,
  "Project Manager": 3,
  "Project Admin": 4,
};

export async function getAuthUser(request) {
  try {
    const token = request.cookies.get("operatorToken")?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const data = await hasuraFetch(
      ME_QUERY,
      { id: payload.id },
      { admin: true },
    );
    const u = data.users_by_pk;
    if (!u) return null;

    return {
      id: u.id,
      email: u.email,
      username: u.username,
      fullName: u.full_name,
      role: u.role,
      organization: u.organization
        ? {
            id: u.organization.id,
            name: u.organization.name,
            slug: u.organization.slug,
            orgType: u.organization.org_type || null,
            seatLimit: u.organization.seat_limit ?? null,
            plan: u.organization.plan ?? null,
            subscriptionStatus: u.organization.subscription_status ?? null,
          }
        : null,
    };
  } catch (err) {
    console.error("getAuthUser error:", err);
    return null;
  }
}

export function getOrgRoleRank(role) {
  return ORG_ROLE_RANK[role] ?? 0;
}

export function getProjectRoleRank(role) {
  return PROJECT_ROLE_RANK[role] ?? 0;
}

export function hasMinOrgRole(user, minRole) {
  if (!user) return false;
  if (user.role === "Super Admin") return true;
  return getOrgRoleRank(user.role) >= (ORG_ROLE_RANK[minRole] ?? Infinity);
}

export async function getProjectRole(projectId, userId) {
  if (!projectId || !userId) return null;

  const data = await hasuraFetch(
    PROJECT_ROLE_BY_USER,
    { projectId, userId },
    { admin: true },
  );

  return data.project_user_roles?.[0]?.project_role || null;
}

export async function canManageProject(projectId, user) {
  if (!user) return false;
  if (user.role === "Super Admin") return true;
  if (hasMinOrgRole(user, "State Director")) return true;

  const projectRole = await getProjectRole(projectId, user.id);
  return (
    getProjectRoleRank(projectRole) >= getProjectRoleRank("Project Manager")
  );
}

export async function canAdminProject(projectId, user) {
  if (!user) return false;
  if (user.role === "Super Admin") return true;
  if (hasMinOrgRole(user, "State Director")) return true;

  const projectRole = await getProjectRole(projectId, user.id);
  return getProjectRoleRank(projectRole) >= getProjectRoleRank("Project Admin");
}

export async function getOrganizationById(orgId) {
  const data = await hasuraFetch(ORG_BY_ID, { id: orgId }, { admin: true });
  return data.organizations_by_pk || null;
}

export async function getSeatsUsed(orgId) {
  const countRes = await hasuraFetch(
    COUNT_USERS_BY_ORG,
    { orgId },
    { admin: true },
  );

  return countRes.users_aggregate?.aggregate?.count || 0;
}

export async function assertSeatAvailable(orgId) {
  const org = await getOrganizationById(orgId);
  if (!org) {
    throw new Error("Organization not found.");
  }

  const seatLimit = Number(org.seat_limit ?? 0);
  const seatsUsed = await getSeatsUsed(orgId);

  if (seatLimit > 0 && seatsUsed >= seatLimit) {
    const error = new Error(
      `This organization has reached its seat limit (${seatLimit}) for the current plan.`,
    );
    error.status = 409;
    throw error;
  }

  return {
    organization: org,
    seatLimit,
    seatsUsed,
  };
}

export function withUser(handler) {
  return async function wrapped(request, ...rest) {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }
    return handler(request, user, ...rest);
  };
}

export function withRole(minRole, handler) {
  return withUser(async (request, user, ...rest) => {
    if (!hasMinOrgRole(user, minRole)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return handler(request, user, ...rest);
  });
}

export function canManageOrgStaff(user) {
  return hasMinOrgRole(user, "Operations Director");
}

export function canCreateProjectByOrgRole(user) {
  return hasMinOrgRole(user, "Political Director");
}

export function canDeleteProjectByOrgRole(user) {
  return hasMinOrgRole(user, "Data Director");
}

export function canDeleteProjectByProjectRole(projectRole) {
  return getProjectRoleRank(projectRole) >= getProjectRoleRank("Project Admin");
}
