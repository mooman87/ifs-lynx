// server component
import { Suspense } from "react";
import { DashboardProvider } from "@/app/context/DashboardContext";
import SelectedPageHelper from "./SelectedPageHelper";
import DashboardClient from "./DashboardClient";

export default function DashboardPage({ searchParams }) {
  const initialSelectedPage =
    typeof searchParams?.selectedPage === "string"
      ? searchParams.selectedPage
      : "Active Projects";

  return (
    <DashboardProvider initialSelectedPage={initialSelectedPage}>
      <Suspense fallback={null}>
        <SelectedPageHelper />
      </Suspense>
      <DashboardClient />
    </DashboardProvider>
  );
}
