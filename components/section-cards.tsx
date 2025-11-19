"use client";

import { IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

type SummaryPeriod = "last-month" | "month" | "two-weeks" | "week";

type Summary = {
  period: SummaryPeriod;
  startDate: string;
  endDate: string;
  count: number;
  totalSales: number;
  totalTax: number;
  totalDiscount: number;
  totalRevenue: number;
};

type SummaryMap = Record<SummaryPeriod, Summary>;

type SummaryResponse = { data: SummaryMap };

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
      </div>
    </div>
  );
}

export function SectionCards() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SummaryMap | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: response } = await axiosInstance.get<SummaryResponse>(
        "/api/sales/summary/"
      );

      setData(response.data);
    } catch (error) {
      console.log("Failed to fetch categories", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const week = data?.week;
  const twoWeeks = data?.["two-weeks"];
  const month = data?.month;
  const lastMonth = data?.["last-month"];

  return (
    <div
      className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card 
    grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 
    @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
    >
      {" "}
      {loading ? (
        [...Array(4)].map((_, idx) => <LoadingSkeleton key={idx} />)
      ) : (
        <>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Current Week Revenue</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                ${Number(week?.totalRevenue ?? 0).toFixed(2)}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp />
                  {week?.count ?? 0}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Total Sales {Number(week?.totalSales ?? 0).toFixed(2)}
              </div>
              <div className="text-muted-foreground">
                Total Discount {Number(week?.totalDiscount ?? 0).toFixed(2)}
              </div>
            </CardFooter>
          </Card>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Last 15 Days Revenue</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                ${Number(twoWeeks?.totalRevenue ?? 0).toFixed(2)}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp /> {twoWeeks?.count ?? 0}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Total Sales {Number(twoWeeks?.totalSales ?? 0).toFixed(2)}
              </div>
              <div className="text-muted-foreground">
                Total Discount {Number(twoWeeks?.totalDiscount ?? 0).toFixed(2)}
              </div>
            </CardFooter>
          </Card>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Current Month Revenue</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                ${Number(month?.totalRevenue ?? 0).toFixed(2)}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp /> {month?.count ?? 0}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Total Sales {Number(month?.totalSales ?? 0).toFixed(2)}
              </div>
              <div className="text-muted-foreground">
                Total Discount {Number(month?.totalDiscount ?? 0).toFixed(2)}
              </div>
            </CardFooter>
          </Card>
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Last Month Revenue</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                ${Number(lastMonth?.totalRevenue ?? 0).toFixed(2)}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp /> {lastMonth?.count ?? 0}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Total Sales {Number(lastMonth?.totalSales ?? 0).toFixed(2)}
              </div>
              <div className="text-muted-foreground">
                Total Discount {Number(lastMonth?.totalDiscount ?? 0).toFixed(2)}
              </div>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
