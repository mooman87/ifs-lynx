import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { hasuraFetch } from "@/utils/hasura";
import {
  getAuthUser,
  canManageOrgStaff,
  assertSeatAvailable,
} from "@/utils/auth";

const ALLOWED_ROLES = [
  "Campaign Manager",
  "Deputy Campaign Manager",
  "Treasurer",
  "Finance Director",
  "Communications Director",
  "Press Secretary",
  "Digital Director",
  "Field Director",
  "Organizer",
  "Canvasser",
  "Volunteer Coordinator",
  "Data Director",
  "Operations Director",
  "Deputy State Director",
  "State Director",
  "Political Director",
  "C Suite",
  "HR",
  "Payroll",
  "Travel",
  "Super Admin",
  "Demo",
];

const ALLOWED_ORG_TYPES = ["Vendor", "Campaign", "PAC", "Party", "Demo"];

const STAFF_MANAGER_ROLES = new Set([
  "Super Admin",
  "Campaign Manager",
  "Deputy Campaign Manager",
  "C Suite",
  "HR",
  "Operations Director",
  "State Director",
  "Political Director",
]);

const isUuid = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitFullName(fullName = "") {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "", lastName: "" };

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

const CHECK_USER_EXISTS = `
query CheckUserExists($email: String!, $username: String!) {
  users(
    where: {
      _or: [
        { email: { _eq: $email } }
        { username: { _eq: $username } }
      ]
    }
    limit: 1
  ) {
    id
  }
}
`;

const CHECK_ORG_EXISTS = `
query CheckOrgExists($orgId: uuid!) {
  organizations_by_pk(id: $orgId) {
    id
    name
    slug
    org_type
    seat_limit
    subscription_status
  }
}
`;

const CHECK_SLUG = `
query CheckOrgSlug($slug: String!) {
  organizations(where: { slug: { _eq: $slug } }, limit: 1) {
    id
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

const INSERT_ORG = `
mutation InsertOrg($object: organizations_insert_input!) {
  insert_organizations_one(object: $object) {
    id
    name
    slug
    org_type
  }
}
`;

const DELETE_ORG = `
mutation DeleteOrg($id: uuid!) {
  delete_organizations_by_pk(id: $id) {
    id
  }
}
`;

const INSERT_USER = `
mutation InsertUser($object: users_insert_input!) {
  insert_users_one(object: $object) {
    id
    email
    username
    full_name
    role
    organization_id
  }
}
`;

const DELETE_USER = `
mutation DeleteUser($id: uuid!) {
  delete_users_by_pk(id: $id) {
    id
  }
}
`;

const INSERT_STAFF = `
mutation InsertStaff($object: employees_insert_input!) {
  insert_employees_one(object: $object) {
    id
    first_name
    last_name
    email
    role
    user_id
    can_login
    staff_type
    is_active
  }
}
`;

async function createOrganization(name, orgType) {
  const baseSlug = slugify(name) || "org";
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await hasuraFetch(CHECK_SLUG, { slug }, { admin: true });

    if (!existing.organizations?.length) break;
    slug = `${baseSlug}-${counter++}`;
  }

  const result = await hasuraFetch(
    INSERT_ORG,
    {
      object: {
        name,
        slug,
        org_type: orgType,
      },
    },
    { admin: true },
  );

  return result.insert_organizations_one;
}

export async function POST(request) {
  let createdOrgId = null;
  let createdUserId = null;

  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const fullName = body.fullName?.trim();
    const username = body.username?.trim();
    const password = body.password;
    const role = body.role?.trim() || "Campaign Manager";

    const organization = body.organization?.trim();
    const organizationName =
      body.organizationName?.trim() || body.orgName?.trim();
    const orgType = body.orgType?.trim() || "Campaign";

    const staffType = body.staffType?.trim() || "employee";

    if (!email || !fullName || !username || !password) {
      return NextResponse.json(
        { message: "Missing required user fields" },
        { status: 400 },
      );
    }

    if (!organization && !organizationName) {
      return NextResponse.json(
        { message: "An organization ID or organization name is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    if (!ALLOWED_ORG_TYPES.includes(orgType)) {
      return NextResponse.json(
        { message: "Invalid org type" },
        { status: 400 },
      );
    }

    const existsRes = await hasuraFetch(
      CHECK_USER_EXISTS,
      { email, username },
      { admin: true },
    );

    if (existsRes.users?.length) {
      return NextResponse.json(
        { message: "User already exists (email or username)" },
        { status: 400 },
      );
    }

    let orgRecord;

    if (organization) {
      if (!isUuid(organization)) {
        return NextResponse.json(
          { message: "Invalid organization ID" },
          { status: 400 },
        );
      }

      const orgRes = await hasuraFetch(
        CHECK_ORG_EXISTS,
        { orgId: organization },
        { admin: true },
      );

      if (!orgRes.organizations_by_pk) {
        return NextResponse.json(
          { message: "Organization not found" },
          { status: 404 },
        );
      }

      orgRecord = orgRes.organizations_by_pk;

      if (!authUser) {
        return NextResponse.json(
          {
            message:
              "Authentication required to add users to an existing organization.",
          },
          { status: 401 },
        );
      }

      if (
        authUser.role !== "Super Admin" &&
        authUser.organization?.id !== orgRecord.id
      ) {
        return NextResponse.json(
          { message: "You can only add users to your own organization." },
          { status: 403 },
        );
      }

      if (!canManageOrgStaff(authUser)) {
        return NextResponse.json(
          { message: "You do not have permission to create staff users." },
          { status: 403 },
        );
      }
    } else {
      orgRecord = await createOrganization(organizationName, orgType);
      createdOrgId = orgRecord.id;
    }

    await assertSeatAvailable(orgRecord.id);

    const password_hash = await bcrypt.hash(password, 10);

    const inserted = await hasuraFetch(
      INSERT_USER,
      {
        object: {
          email,
          username,
          full_name: fullName,
          organization_id: orgRecord.id,
          password_hash,
          role,
        },
      },
      { admin: true },
    );

    const newUser = inserted.insert_users_one;
    createdUserId = newUser.id;

    const { firstName, lastName } = splitFullName(fullName);

    const staffInsert = await hasuraFetch(
      INSERT_STAFF,
      {
        object: {
          organization_id: orgRecord.id,
          user_id: newUser.id,
          first_name: firstName || null,
          last_name: lastName || null,
          email,
          role,
          can_login: true,
          staff_type: staffType,
          is_active: true,
        },
      },
      { admin: true },
    );

    const staff = staffInsert.insert_employees_one;

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          fullName: newUser.full_name,
          role: newUser.role,
          organizationId: newUser.organization_id,
        },
        staff: {
          id: staff.id,
          firstName: staff.first_name,
          lastName: staff.last_name,
          email: staff.email,
          role: staff.role,
          userId: staff.user_id,
          canLogin: staff.can_login,
          staffType: staff.staff_type,
          isActive: staff.is_active,
        },
        organization: {
          id: orgRecord.id,
          name: orgRecord.name,
          slug: orgRecord.slug,
          orgType: orgRecord.org_type,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);

    if (createdUserId) {
      try {
        await hasuraFetch(DELETE_USER, { id: createdUserId }, { admin: true });
      } catch (cleanupError) {
        console.error("Register user cleanup error:", cleanupError);
      }
    }

    if (createdOrgId) {
      try {
        await hasuraFetch(DELETE_ORG, { id: createdOrgId }, { admin: true });
      } catch (cleanupError) {
        console.error("Register org cleanup error:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        message: error.message || "Server error",
        error: error.message,
      },
      { status: error.status || 500 },
    );
  }
}
