"use client";

import { useEffect } from "react";
import { useDashboard } from "@/app/context/DashboardContext";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export default function SelectedPageHelper() {
  const { selectedPage, setSelectedPage } = useDashboard();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // URL -> state (respond to browser nav / query changes)
  useEffect(() => {
    const qp = searchParams.get("selectedPage") || "Active Projects";
    if (qp !== selectedPage) setSelectedPage(qp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // state -> URL (when user switches tabs via Sidebar, etc.)
  useEffect(() => {
    const current = searchParams.get("selectedPage") || "Active Projects";
    if (!selectedPage || selectedPage === current) return;

    const params = new URLSearchParams(searchParams);
    params.set("selectedPage", selectedPage);

    // Update the URL without a full navigation
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage, pathname]);

  return null;
}
