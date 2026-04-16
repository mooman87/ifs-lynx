"use client";
import { useEffect, useRef, useState } from "react";
import { useDashboard } from "@/app/context/DashboardContext";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const dualUseIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={18}
    height={18}
    color="currentColor"
    fill="none"
  >
    <circle
      cx="8.5"
      cy="10.5"
      r="1.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="14.5"
      cy="15.5"
      r="1.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="18.5"
      cy="7.5"
      r="1.5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M15.4341 14.2963L18 9M9.58251 11.5684L13.2038 14.2963M3 19L7.58957 11.8792"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 21H9C5.70017 21 4.05025 21 3.02513 19.9749C2 18.9497 2 17.2998 2 14V3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const employeeIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={18}
    height={18}
    color="currentColor"
    fill="none"
  >
    <path
      d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

// const travelIcon = (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 24 24"
//     width={18}
//     height={18}
//     color="currentColor"
//     fill="none"
//   >
//     <path
//       d="M2.00031 20H18.0003"
//       stroke="currentColor"
//       strokeWidth="1.5"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />
//     <path
//       d="M3.82527 12.1661C3.55027 11.9661 3.30027 11.7161 3.00028 10.8411C2.91891 10.6241 2.61139 9.53619 2.35028 8.54109C2.13003 7.7017 1.93377 6.93555 2.02528 6.74109C2.10029 6.54109 2.20027 6.39109 2.52527 6.19109C2.72527 6.06802 3.75027 5.81609 3.95027 5.76609C4.15027 5.71609 4.42526 5.69109 4.65027 5.76609C5.07527 5.84109 5.95027 7.11609 6.17527 7.26609C6.27526 7.36609 6.60027 7.657 6.97527 7.69109C7.25027 7.71609 7.52527 7.64109 7.82528 7.51609C8.10027 7.40151 13.5253 4.76609 14.0253 4.54109C18.1003 2.84109 21.0603 5.63609 21.5103 6.23609C21.9753 6.81609 22.0753 6.99109 21.9503 7.49109C21.7887 8.01609 21.3503 8.11609 21.1003 8.19109C20.8503 8.26609 17.4003 9.19109 16.0503 9.56609C15.7554 9.6621 15.6114 9.85492 15.5753 9.89109C15.4003 10.1411 14.6053 11.8411 14.3803 12.2161C14.2253 12.6161 13.8003 13.1161 13.2503 13.3161C12.6753 13.5161 11.6753 13.7411 11.4503 13.8161C11.2253 13.8911 10.7003 14.0411 10.5253 13.9911C10.3003 13.9411 10.0853 13.7161 10.1853 13.3661C10.2853 13.0161 10.4753 12.0411 10.5003 11.8911C10.5253 11.7411 10.7753 11.1161 10.5003 11.0911C10.4503 11.0161 9.92527 11.2411 9.15027 11.4161C8.57449 11.5782 7.9715 11.7386 7.55027 11.8411C5.92527 12.3161 5.04521 12.4411 4.85027 12.4411C4.47527 12.4411 4.20027 12.3911 3.82527 12.1661Z"
//       stroke="currentColor"
//       strokeWidth="1.5"
//     />
//   </svg>
// );

const settingsIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={18}
    height={18}
    color="currentColor"
    fill="none"
  >
    <path
      d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const calendarIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={18}
    height={18}
    color="currentColor"
    fill="none"
  >
    <rect
      x="2"
      y="3"
      width="20"
      height="18"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M2 9h20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect x="7" y="2" width="2" height="3" rx="1" fill="currentColor" />
    <rect x="15" y="2" width="2" height="3" rx="1" fill="currentColor" />
  </svg>
);

const voterIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={18}
    height={18}
    color="currentColor"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M12 3C12 3 8 8 8 12C8 16 12 21 12 21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 3C12 3 16 8 16 12C16 16 12 21 12 21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M3 12h18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const billingIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={18}
    height={18}
    color="currentColor"
    fill="none"
  >
    <rect
      x="2"
      y="5"
      width="20"
      height="14"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const chevronDownIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={14}
    height={14}
    color="currentColor"
    fill="none"
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const SectionLabel = ({ children }) => (
  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.07em] px-3 mb-1 mt-1">
    {children}
  </div>
);

const Divider = () => <div className="h-px bg-gray-100 mx-3 my-2" />;

const NavItem = ({ icon, label, isActive, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mx-1 text-left transition-colors text-[13px] font-medium ${
      isActive
        ? "bg-[#EEEDFE] text-[#3C3489]"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
    }`}
    style={{ width: "calc(100% - 8px)" }}
  >
    <span
      className={`flex-shrink-0 ${isActive ? "text-[#534AB7]" : "text-gray-400"}`}
    >
      {icon}
    </span>
    <span className="flex-1 truncate">{label}</span>
    {badge && (
      <span className="text-[10px] font-medium bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

const Sidebar = () => {
  const { selectedPage, setSelectedPage, user } = useDashboard();
  const [orgs, setOrgs] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [error, setError] = useState("");
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);

  const orgMenuRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedOrg = orgs.find((org) => org.slug === selectedSlug);
  const orgSlugFromUrl = searchParams.get("orgSlug") || "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target)) {
        setIsOrgMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (orgSlugFromUrl && orgSlugFromUrl !== selectedSlug) {
      setSelectedSlug(orgSlugFromUrl);
    }
  }, [orgSlugFromUrl, selectedSlug]);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await fetch("/api/org");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load orgs");

        setOrgs(data);

        if (data?.length > 0) {
          const matchFromUrl = orgSlugFromUrl
            ? data.find((org) => org.slug === orgSlugFromUrl)
            : null;

          setSelectedSlug(matchFromUrl?.slug || data[0].slug);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchOrgs();
  }, [orgSlugFromUrl]);

  if (!user) {
    return (
      <div className="w-56 bg-white border-r border-gray-100 min-h-screen flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  const isSuperAdmin = user.role === "Super Admin";
  const isDemo = user.role === "Demo";

  const navigate = (key) => {
    setSelectedPage(key);

    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedPage", key);

    if (isSuperAdmin && selectedSlug) {
      params.set("orgSlug", selectedSlug);
    }

    router.push(`/dashboard?${params.toString()}`);
  };

  const isActive = (key) => selectedPage === key;

  const mobileNavItems = [
    isSuperAdmin
      ? { name: "Admin Dashboard", key: "Admin Dashboard" }
      : { name: "Active Projects", key: "Active Projects" },
    { name: "Staff", key: "Staff" },
    ...(!isDemo ? [{ name: "Manage Profile", key: "Manage Profile" }] : []),
  ];

  const mobileIcons = {
    "Admin Dashboard": dualUseIcon,
    "Active Projects": dualUseIcon,
    Staff: employeeIcon,
    "Manage Profile": settingsIcon,
  };

  const handleOrgSelect = (slug) => {
    setSelectedSlug(slug);
    setIsOrgMenuOpen(false);
    setSelectedPage("Active Projects");

    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedPage", "Active Projects");
    params.set("orgSlug", slug);

    router.push(`/dashboard?${params.toString()}`);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <aside className="hidden md:flex md:w-56 h-screen bg-white border-r border-gray-100 flex-col flex-shrink-0 sticky top-0 overflow-hidden">
        <div className="flex justify-center pt-4 pb-2 px-4">
          <Image
            height={180}
            width={180}
            src="/LynxNewLogo.png"
            alt="Lynx logo"
          />
        </div>

        {isSuperAdmin && (
          <div className="px-3 mb-2" ref={orgMenuRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOrgMenuOpen((prev) => !prev)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-5 h-5 rounded-md bg-[#CECBF6] flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L2 4v6l5 3 5-3V4L7 1z" fill="#7F77DD" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  {error ? (
                    <p className="text-red-500 text-sm truncate">{error}</p>
                  ) : (
                    <>
                      <p className="text-[13px] font-medium text-gray-800 truncate">
                        {selectedOrg?.name || "Select organization"}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {selectedOrg?.orgType || "Organization"}
                      </p>
                    </>
                  )}
                </div>

                <span
                  className={`text-gray-400 transition-transform ${
                    isOrgMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  {chevronDownIcon}
                </span>
              </button>

              {isOrgMenuOpen && !error && (
                <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-md z-50">
                  <div className="max-h-64 overflow-y-auto py-1">
                    {orgs.map((org) => {
                      const isSelected = selectedSlug === org.slug;

                      return (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => handleOrgSelect(org.slug)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                            isSelected
                              ? "bg-[#EEEDFE] text-[#3C3489]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                              isSelected ? "bg-[#CECBF6]" : "bg-gray-100"
                            }`}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <path
                                d="M7 1L2 4v6l5 3 5-3V4L7 1z"
                                fill={isSelected ? "#7F77DD" : "#9CA3AF"}
                              />
                            </svg>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate">
                              {org.name}
                            </p>
                            <p
                              className={`text-[11px] truncate ${
                                isSelected ? "text-[#6D63D9]" : "text-gray-400"
                              }`}
                            >
                              {org.orgType || "N/A"}
                            </p>
                          </div>

                          {isSelected && (
                            <span className="text-[#534AB7] text-xs font-semibold">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 px-1 pb-2 overflow-y-auto">
          <SectionLabel>Campaign</SectionLabel>

          {isSuperAdmin ? (
            <NavItem
              icon={dualUseIcon}
              label="Admin Dashboard"
              isActive={isActive("Admin Dashboard")}
              onClick={() => navigate("Admin Dashboard")}
            />
          ) : (
            <NavItem
              icon={dualUseIcon}
              label="Active Projects"
              isActive={isActive("Active Projects")}
              onClick={() => navigate("Active Projects")}
            />
          )}

          <NavItem
            icon={calendarIcon}
            label="Calendar"
            isActive={isActive("Calendar")}
            onClick={() => navigate("Calendar")}
            badge="Soon"
          />

          <NavItem
            icon={voterIcon}
            label="Voter data"
            isActive={isActive("Voter data")}
            onClick={() => navigate("Voter data")}
            badge="Soon"
          />

          <Divider />

          <SectionLabel>Organization</SectionLabel>

          <NavItem
            icon={employeeIcon}
            label="Staff"
            isActive={isActive("Staff")}
            onClick={() => navigate("Staff")}
          />

          <Divider />

          <SectionLabel>Admin</SectionLabel>

          <NavItem
            icon={billingIcon}
            label="Billing"
            isActive={isActive("Billing")}
            onClick={() => navigate("Billing")}
            badge="Soon"
          />

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-3/4 h-10 mx-auto flex items-center justify-center rounded-lg bg-red-100 text-red-700 border border-red-300 text-sm font-semibold shadow-sm hover:bg-red-200 hover:border-red-400 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            Logout
          </button>
        </nav>

        {!isDemo && (
          <div className="border-t border-gray-100 px-3 py-3">
            <button
              onClick={() => navigate("Manage Profile")}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#CECBF6] text-[#3C3489] text-[11px] font-medium flex items-center justify-center flex-shrink-0">
                {getInitials(user?.name ?? user?.email ?? "U")}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-medium text-gray-800 truncate">
                  {user?.name ?? user?.email ?? "My Account"}
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  {user?.role}
                </div>
              </div>
              <span
                className={`flex-shrink-0 transition-colors ${
                  isActive("Manage Profile")
                    ? "text-[#534AB7]"
                    : "text-gray-300"
                }`}
              >
                {settingsIcon}
              </span>
            </button>
          </div>
        )}
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="flex justify-around items-center py-2">
          {mobileNavItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`flex flex-1 items-center justify-center py-1 transition-colors ${
                isActive(item.key) ? "text-[#534AB7]" : "text-gray-400"
              }`}
            >
              {mobileIcons[item.key]}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
