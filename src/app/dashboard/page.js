// server component
import { Suspense } from "react";
import SelectedPageHelper from "./SelectedPageHelper";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={null}>
        <SelectedPageHelper />
      </Suspense>
      <DashboardClient />
    </>
  );
}
