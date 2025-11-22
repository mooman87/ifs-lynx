"use client";
import React from "react";
import { useDashboard } from "@/app/context/DashboardContext"; 
import { useRouter } from "next/navigation";
import Image from "next/image";

const pageIcons = {
  "Active Projects": (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#6366f1"} fill={"none"}>
      <circle cx="8.5" cy="10.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14.5" cy="15.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.4341 14.2963L18 9M9.58251 11.5684L13.2038 14.2963M3 19L7.58957 11.8792" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
     <path d="M20 21H9C5.70017 21 4.05025 21 3.02513 19.9749C2 18.9497 2 17.2998 2 14V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
  ),
  "Employee List": (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#6366f1"} fill={"none"}>
    <path d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
  ),
  "Travel Management": (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#6366f1"} fill={"none"}>
      <path d="M2.00031 20H18.0003" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.82527 12.1661C3.55027 11.9661 3.30027 11.7161 3.00028 10.8411C2.91891 10.6241 2.61139 9.53619 2.35028 8.54109C2.13003 7.7017 1.93377 6.93555 2.02528 6.74109C2.10029 6.54109 2.20027 6.39109 2.52527 6.19109C2.72527 6.06802 3.75027 5.81609 3.95027 5.76609C4.15027 5.71609 4.42526 5.69109 4.65027 5.76609C5.07527 5.84109 5.95027 7.11609 6.17527 7.26609C6.27526 7.36609 6.60027 7.657 6.97527 7.69109C7.25027 7.71609 7.52527 7.64109 7.82528 7.51609C8.10027 7.40151 13.5253 4.76609 14.0253 4.54109C18.1003 2.84109 21.0603 5.63609 21.5103 6.23609C21.9753 6.81609 22.0753 6.99109 21.9503 7.49109C21.7887 8.01609 21.3503 8.11609 21.1003 8.19109C20.8503 8.26609 17.4003 9.19109 16.0503 9.56609C15.7554 9.6621 15.6114 9.85492 15.5753 9.89109C15.4003 10.1411 14.6053 11.8411 14.3803 12.2161C14.2253 12.6161 13.8003 13.1161 13.2503 13.3161C12.6753 13.5161 11.6753 13.7411 11.4503 13.8161C11.2253 13.8911 10.7003 14.0411 10.5253 13.9911C10.3003 13.9411 10.0853 13.7161 10.1853 13.3661C10.2853 13.0161 10.4753 12.0411 10.5003 11.8911C10.5253 11.7411 10.7753 11.1161 10.5003 11.0911C10.4503 11.0161 9.92527 11.2411 9.15027 11.4161C8.57449 11.5782 7.9715 11.7386 7.55027 11.8411C5.92527 12.3161 5.04521 12.4411 4.85027 12.4411C4.47527 12.4411 4.20027 12.3911 3.82527 12.1661Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  "Resources": (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#6366f1"} fill={"none"}>
      <path d="M8 7L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 21.5V21C13 18.1716 13 16.7574 13.8787 15.8787C14.7574 15 16.1716 15 19 15H19.5M20 13.3431V10C20 6.22876 20 4.34315 18.8284 3.17157C17.6569 2 15.7712 2 12 2C8.22877 2 6.34315 2 5.17157 3.17157C4 4.34314 4 6.22876 4 10L4 14.5442C4 17.7892 4 19.4117 4.88607 20.5107C5.06508 20.7327 5.26731 20.9349 5.48933 21.1139C6.58831 22 8.21082 22 11.4558 22C12.1614 22 12.5141 22 12.8372 21.886C12.9044 21.8623 12.9702 21.835 13.0345 21.8043C13.3436 21.6564 13.593 21.407 14.0919 20.9081L18.8284 16.1716C19.4065 15.5935 19.6955 15.3045 19.8478 14.9369C20 14.5694 20 14.1606 20 13.3431Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "Create User": (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#6366f1"} fill={"none"}>
    <path d="M5.18007 15.2964C3.92249 16.0335 0.625213 17.5386 2.63348 19.422C3.6145 20.342 4.7071 21 6.08077 21H13.9192C15.2929 21 16.3855 20.342 17.3665 19.422C19.3748 17.5386 16.0775 16.0335 14.8199 15.2964C11.8709 13.5679 8.12906 13.5679 5.18007 15.2964Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 7C14 9.20914 12.2091 11 10 11C7.79086 11 6 9.20914 6 7C6 4.79086 7.79086 3 10 3C12.2091 3 14 4.79086 14 7Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M19.5 4V9M22 6.5L17 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
  ),
  "Manage Profile": (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#6366f1"} fill={"none"}>
      <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const Sidebar = () => {
  const { selectedPage, setSelectedPage, user } = useDashboard();
  const router = useRouter();


  if (!user) {
    return (
      <div className="w-64 bg-gray-400 text-white min-h-screen p-4 flex flex-col items-center justify-center">
        Loading...
      </div>
    );
  }

  const navItems = [
    { name: "Active Projects", key: "Active Projects" },
    { name: "Employee List", key: "Employee List" },
    { name: "Travel Management", key: "Travel Management" },
    { name: "Resources", key: "Resources" },
    ...(user.role === "Super Admin" ? [{ name: "Create User", key: "Create User" }] : []),
    ...(user.role === "Demo" ? [] : [{ name: "Manage Profile", key: "Manage Profile" }]),
  ];

  const handleClick = (key) => {
    setSelectedPage(key);
    router.push(`/dashboard?selectedPage=${encodeURIComponent(key)}`);
  };
  return (
    <>
    <aside className="hidden md:flex md:w-64 bg-gray-400 text-white md:min-h-screen p-4 flex-col items-center">
      <div className="w-full flex justify-center -m-7">
        <Image height={250} width={250} src="/sidebarlogo.png" alt="lynx logo" />
      </div>
      <nav className="mt-10">
        {[
          { name: "Active Projects", key: "Active Projects" },
          { name: "Employee List", key: "Employee List" },
          { name: "Travel Management", key: "Travel Management" },
          { name: "Resources", key: "Resources" },
          ...(user.role === "Super Admin" ? [{ name: "Create User", key: "Create User" }] : []),
          ...(user.role === "Demo" ? [] : [{ name: "Manage Profile", key: "Manage Profile" }]),
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setSelectedPage(item.key);
              router.push(`/dashboard?selectedPage=${encodeURIComponent(item.key)}`);
            }}
            className={`w-full flex items-center gap-3 p-2 rounded-lg mb-2 transition-all duration-200 hover:bg-gray-700 ${
              selectedPage === item.key ? "bg-gray-600" : ""
            }`}
          >
            {pageIcons[item.key]}
            <span className="font-bold">{item.name}</span>
          </button>
        ))}
      </nav>
      </aside>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white border-t border-gray-700 z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleClick(item.key)}
              className={`flex flex-1 items-center justify-center py-1 ${
                selectedPage === item.key ? "text-indigo-400" : "text-gray-300"
              }`}
            >
              {/* Icons only on mobile */}
              {pageIcons[item.key]}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
