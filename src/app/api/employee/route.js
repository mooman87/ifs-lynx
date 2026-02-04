// src/app/api/employee/route.js
import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

// Expand stored jsonb maps so UI can index by either YYYY-MM-DD or "Sat Mar 29 2025"
function expandDateKeys(obj) {
  const base = obj && typeof obj === "object" ? obj : {};
  const out = { ...base };

  for (const [k, v] of Object.entries(base)) {
    // if key is already a date-like string, try expanding
    // support "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
      const dt = new Date(`${k}T00:00:00Z`);
      if (!Number.isNaN(dt.getTime())) {
        const dateString = dt.toDateString(); // "Sat Mar 29 2025"
        if (out[dateString] === undefined) out[dateString] = v;
      }
    } else {
      // support ISO strings as keys (less likely)
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

function toMongoishEmployee(e) {
  return {
    _id: e.id,
    id: e.id,
    organization: e.organization_id,

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
    email: e.email ?? null,

    availableStart: e.available_start ?? null,
    role: e.role ?? null,
    reportsTo: e.reports_to ?? null,

    homeAirport: e.home_airport ?? null,
    altAirport: e.alt_airport ?? null,

    doorsKnocked: e.doors_knocked ?? 0,
    doorsKnockedPerDay: expandDateKeys(e.doors_knocked_per_day),
    contactsMadePerDay: expandDateKeys(e.contacts_made_per_day),

    rentalCarEligible: e.rental_car_eligible ?? true,
  };
}

const EMPLOYEES_BY_ORG = `
query EmployeesByOrg($orgId: uuid!) {
  employees(
    where: { organization_id: { _eq: $orgId } }
    order_by: [{ last_name: asc }, { first_name: asc }]
  ) {
    id
    organization_id
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
    email
    available_start
    role
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

const EMPLOYEES_ALL = `
query EmployeesAll {
  employees(order_by: [{ last_name: asc }, { first_name: asc }]) {
    id
    organization_id
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
    email
    available_start
    role
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

const INSERT_EMPLOYEE = `
mutation InsertEmployee($object: employees_insert_input!) {
  insert_employees_one(object: $object) { id }
}
`;

export const GET = withUser(async (request, user) => {
  try {
    const isSuperAdmin = user.role === "Super Admin";

    // optional ?orgId=... for Super Admin convenience
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get("orgId");

    const orgId = isSuperAdmin ? (orgIdParam || user.organization?.id) : user.organization?.id;

    const data = isSuperAdmin && !orgId
      ? await hasuraFetch(EMPLOYEES_ALL, {}, { admin: true })
      : await hasuraFetch(EMPLOYEES_BY_ORG, { orgId }, { admin: true });

    const employees = (data.employees || []).map(toMongoishEmployee);
    return NextResponse.json({ employees }, { status: 200 });
  } catch (e) {
    console.error("GET /api/employee error:", e);
    return NextResponse.json({ message: "Server error", error: e.message }, { status: 500 });
  }
});

export const POST = withUser(async (request, user) => {
  try {
    // You said “I’m the only one creating employees right now”,
    // so enforce Super Admin for creation (adjust later if needed).
    if (user.role !== "Super Admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // allow SA to create into a selected org; otherwise fall back to SA org
    const orgId = body.organizationId || body.organization || user.organization?.id;
    if (!orgId) return NextResponse.json({ message: "Missing organization context" }, { status: 400 });

    const object = {
      organization_id: orgId,
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
      email: body.email ?? null,
      available_start: body.availableStart ?? null,
      role: body.role ?? null,
      reports_to: body.reportsTo ?? null,
      home_airport: body.homeAirport ?? null,
      alt_airport: body.altAirport ?? null,
      doors_knocked: body.doorsKnocked ?? 0,
      doors_knocked_per_day: body.doorsKnockedPerDay ?? {},
      contacts_made_per_day: body.contactsMadePerDay ?? {},
      rental_car_eligible: body.rentalCarEligible ?? true,
    };

    const data = await hasuraFetch(INSERT_EMPLOYEE, { object }, { admin: true });
    return NextResponse.json({ message: "Created", id: data.insert_employees_one.id }, { status: 201 });
  } catch (e) {
    console.error("POST /api/employee error:", e);
    return NextResponse.json({ message: "Server error", error: e.message }, { status: 500 });
  }
});
