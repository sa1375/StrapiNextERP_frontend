"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axiosInstance from "@/lib/axios";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

type SalePoints = {
  id: number;
  documentId: string;
  date: string;
  total: number;
};

export const description = "An interactive area chart";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },

  total: {
    label: "Total",
    color: "var(--primary)",
  },
};

export function ChartAreaInteractive() {
  const [chartData, setChartData] = useState<SalePoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/api/sales/chartData/");
        const allData = res?.data || [];

        const filtered = allData.map((item: SalePoints) => {
          const dateObj = new Date(item.date);
          const formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }); // e.g., "May 9"

          return {
            originalDate: item.date,
            date: formattedDate,
            total: Number(item.total),
          };
        });

        setChartData(filtered);
      } catch (err) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Sales</CardTitle>
        <CardDescription>
          {error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            <>
              <span className="hidden @[540px]/card:block">
                Total for the current month
              </span>
              <span className="@[540px]/card:hidden">This month</span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;

                  const value = payload[0].value as number;

                  return (
                    <div className="rounded-md border bg-background px-2 py-1 text-xs shadow">
                      <div className="font-medium">{label}</div>
                      <div>
                        {chartConfig.total.label}: {value}
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="natural"
                dataKey="total"
                stroke={chartConfig.total.color}
                fill={chartConfig.total.color}
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
