import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

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

function expandDateKeys(obj) {
  const base = obj && typeof obj === "object" ? obj : {};
  const out = { ...base };

  for (const [k, v] of Object.entries(base)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
      const dt = new Date(`${k}T00:00:00Z`);
      if (!Number.isNaN(dt.getTime())) {
        const dateString = dt.toDateString();
        if (out[dateString] === undefined) out[dateString] = v;
      }
    } else {
      const dt = new Date(k);
      if (!Number.isNaN(dt.getTime())) {
        const ymd = dt.toISOString().slice(0, 10);
        const dateString = dt.toDateString();
        if (out[ymd] === undefined) out[ymd] = v;
        if (out[dateString] === undefined) out[dateString] = v;
      }
    }
  }

  return out;
}

function toStaffRecord(e) {
  return {
    _id: e.id,
    id: e.id,
    organization: e.organization_id,

    userId: e.user_legacy_id ?? e.user_id ?? null,
    canLogin: e.can_login ?? true,
    staffType: e.staff_type ?? "employee",
    isActive: e.is_active ?? true,

    email: e.email ?? null,
    username: e.username ?? null,
    fullName: e.full_name ?? "",

    firstName: e.first_name ?? "",
    lastName: e.last_name ?? "",
    gender: e.gender ?? null,
    dob: e.dob ?? null,
    phone: e.phone ?? null,
    address: e.address ?? null,
    address2: e.address2 ?? null,
    city: e.city ?? null,
    state: e.state ?? null,
    zip: e.zip ?? null,

    availableStart: e.available_start ?? null,
    role: e.org_role ?? e.role ?? null,
    reportsTo: e.reports_to ?? null,

    homeAirport: e.home_airport ?? null,
    altAirport: e.alt_airport ?? null,

    doorsKnocked: e.doors_knocked ?? 0,
    doorsKnockedPerDay: expandDateKeys(e.doors_knocked_per_day),
    contactsMadePerDay: expandDateKeys(e.contacts_made_per_day),

    rentalCarEligible: e.rental_car_eligible ?? true,
  };
}

const STAFF_BY_ORG = `
query StaffByOrg($orgId: uuid!) {
  staff(
    where: { organization_id: { _eq: $orgId } }
    order_by: [{ last_name: asc }, { first_name: asc }]
  ) {
    id
    organization_id
    user_legacy_id
    can_login
    staff_type
    is_active
    email
    username
    full_name
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
    doors_knocked
    doors_knocked_per_day
    contacts_made_per_day
    rental_car_eligible
  }
}
`;

const STAFF_ALL = `
query StaffAll {
  staff(order_by: [{ last_name: asc }, { first_name: asc }]) {
    id
    organization_id
    user_legacy_id
    can_login
    staff_type
    is_active
    email
    username
    full_name
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
    doors_knocked
    doors_knocked_per_day
    contacts_made_per_day
    rental_car_eligible
  }
}
`;

const INSERT_STAFF = `
mutation InsertStaff($object: staff_insert_input!) {
  insert_staff_one(object: $object) {
    id
    organization_id
    user_legacy_id
    can_login
    staff_type
    is_active
    first_name
    last_name
    email
    org_role
    username
    full_name
  }
}
`;

export const GET = withUser(async (request, user) => {
  try {
    const isSuperAdmin = user.role === "Super Admin";
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get("orgId");

    const orgId = isSuperAdmin
      ? orgIdParam || user.organization?.id
      : user.organization?.id;

    const data =
      isSuperAdmin && !orgId
        ? await hasuraFetch(STAFF_ALL, {}, { admin: true })
        : await hasuraFetch(STAFF_BY_ORG, { orgId }, { admin: true });

    const employees = (data.staff || []).map(toStaffRecord);
    return NextResponse.json({ employees }, { status: 200 });
  } catch (e) {
    console.error("GET /api/employee error:", e);
    return NextResponse.json(
      { message: "Server error", error: e.message },
      { status: 500 },
    );
  }
});

export const POST = withUser(async (request, user) => {
  try {
    if (!STAFF_MANAGER_ROLES.has(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const orgId =
      user.role === "Super Admin"
        ? body.organizationId || body.organization || user.organization?.id
        : user.organization?.id;

    if (!orgId) {
      return NextResponse.json(
        { message: "Missing organization context" },
        { status: 400 },
      );
    }

    const object = {
      organization_id: orgId,
      user_legacy_id: body.userId ?? null,
      can_login: body.canLogin ?? true,
      staff_type: body.staffType ?? "employee",
      is_active: body.isActive ?? true,

      email: body.email ?? null,
      username: body.username ?? null,
      full_name: body.fullName ?? null,
      org_role: body.role ?? null,

      first_name: body.firstName ?? body.first_name ?? null,
      last_name: body.lastName ?? body.last_name ?? null,
      gender: body.gender ?? null,
      dob: body.dob ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      address2: body.address2 ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      zip: body.zip ?? null,
      available_start: body.availableStart ?? null,
      reports_to: body.reportsTo ?? null,
      home_airport: body.homeAirport ?? null,
      alt_airport: body.altAirport ?? null,
      doors_knocked: body.doorsKnocked ?? 0,
      doors_knocked_per_day: body.doorsKnockedPerDay ?? {},
      contacts_made_per_day: body.contactsMadePerDay ?? {},
      rental_car_eligible: body.rentalCarEligible ?? true,
      password_hash: body.passwordHash ?? undefined,
    };

    Object.keys(object).forEach(
      (k) => object[k] === undefined && delete object[k],
    );

    const data = await hasuraFetch(INSERT_STAFF, { object }, { admin: true });

    return NextResponse.json(
      {
        message: "Created",
        employee: toStaffRecord(data.insert_staff_one),
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("POST /api/employee error:", e);
    return NextResponse.json(
      { message: "Server error", error: e.message },
      { status: 500 },
    );
  }
});
