// app/dashboard/page.tsx

"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import rawData from "./data.json";
import { useSession } from "next-auth/react";
import { IconLoader } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

type DashboardRow = {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

const columns: ColumnDef<DashboardRow>[] = [
  { accessorKey: "header", header: "Header" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "target", header: "Target" },
  { accessorKey: "limit", header: "Limit" },
  { accessorKey: "reviewer", header: "Reviewer" },
];

const dashboardData = rawData as DashboardRow[];

export default function page() {
  const { status } = useSession();
  const router = useRouter();

  if (status === "loading")
    return (
      <IconLoader className="size-10 animate-spin mx-auto h-screen text-gray-500" />
    );

  if (status === "unauthenticated") {
    router.push("/login");
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable columns={columns} data={dashboardData} />
        </div>
      </div>
    </div>
  );
}
