// api/auth/register/route.js
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
const ALLOWED_STAFF_TYPES = ["employee", "contractor", "volunteer"];

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
mutation InsertStaff($object: staff_insert_input!) {
  insert_staff_one(object: $object) {
    id
    organization_id
    user_legacy_id
    email
    username
    full_name
    role
    org_role
    first_name
    last_name
    gender
    dob
    phone
    address
    address2
    city
    state
    zip
    available_start
    reports_to
    home_airport
    alt_airport
    rental_car_eligible
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
    const normalizedRole =
      body.role?.trim() || body.orgRole?.trim() || "Campaign Manager";

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

    if (!ALLOWED_STAFF_TYPES.includes(staffType)) {
      return NextResponse.json(
        { message: "Invalid staff type" },
        { status: 400 },
      );
    }

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
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

    if (authUser && authUser.role !== "Super Admin") {
      if (!authUser.organization?.id) {
        return NextResponse.json(
          { message: "Authenticated user is missing organization context." },
          { status: 400 },
        );
      }

      const orgRes = await hasuraFetch(
        CHECK_ORG_EXISTS,
        { orgId: authUser.organization.id },
        { admin: true },
      );

      if (!orgRes.organizations_by_pk) {
        return NextResponse.json(
          { message: "Organization not found" },
          { status: 404 },
        );
      }

      orgRecord = orgRes.organizations_by_pk;

      if (!canManageOrgStaff(authUser)) {
        return NextResponse.json(
          { message: "You do not have permission to create staff users." },
          { status: 403 },
        );
      }
    } else if (organization) {
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
    } else if (organizationName) {
      orgRecord = await createOrganization(organizationName, orgType);
      createdOrgId = orgRecord.id;
    } else {
      return NextResponse.json(
        { message: "An organization ID or organization name is required" },
        { status: 400 },
      );
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
          role: normalizedRole,
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
          user_legacy_id: newUser.id,

          email,
          username,
          full_name: fullName,
          role: normalizedRole,
          org_role: normalizedRole,

          first_name: body.firstName?.trim() || firstName || null,
          last_name: body.lastName?.trim() || lastName || null,
          gender: body.gender?.trim() || null,
          dob: body.dob || null,
          phone: body.phone?.trim() || null,
          address: body.address?.trim() || null,
          address2: body.address2?.trim() || null,
          city: body.city?.trim() || null,
          state: body.state?.trim() || null,
          zip: body.zip?.trim() || null,
          available_start: body.availableStart || null,
          reports_to: body.reportsTo?.trim() || null,
          home_airport: body.homeAirport?.trim() || null,
          alt_airport: body.altAirport?.trim() || null,

          rental_car_eligible: body.rentalCarEligible ?? false,
          can_login: true,
          staff_type: staffType,
          is_active: true,
          password_hash,
          doors_knocked: 0,
          doors_knocked_per_day: {},
          contacts_made_per_day: {},
        },
      },
      { admin: true },
    );

    const staff = staffInsert.insert_staff_one;

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
          username: staff.username,
          fullName: staff.full_name,
          role: staff.org_role ?? staff.role,
          userId: staff.user_legacy_id,
          gender: staff.gender,
          dob: staff.dob,
          phone: staff.phone,
          address: staff.address,
          address2: staff.address2,
          city: staff.city,
          state: staff.state,
          zip: staff.zip,
          availableStart: staff.available_start,
          reportsTo: staff.reports_to,
          homeAirport: staff.home_airport,
          altAirport: staff.alt_airport,
          rentalCarEligible: staff.rental_car_eligible,
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
