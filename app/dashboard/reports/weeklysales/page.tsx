"use client";

import { getColumns } from "./features/columns";
import { DataTable } from "@/components/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  type PaginationMeta,
  type ReportFilters,
  type ReportFilterChangeHandler,
  type ReportSale,
  type SalesListResponse,
} from "../types";

const Page = () => {
  const [sales, setSales] = useState<ReportSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<ReportFilters>({});

  const handleFilterChange = useCallback<ReportFilterChangeHandler>(
    (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value ?? "" }));
      setPage(1);
    },
    []
  );

  const buildQuery = useCallback((): string => {
    const query = new URLSearchParams();
    query.set("pagination[page]", page.toString());
    query.set("pagination[pageSize]", pageSize.toString());

    if (filters.invoice_number) {
      query.set("filters[invoice_number][$eqi]", filters.invoice_number);
    }

    if (filters.customer_name) {
      query.set("filters[customer_name][$containsi]", filters.customer_name);
    }

    if (filters.customer_email) {
      query.set("filters[customer_email][$containsi]", filters.customer_email);
    }

    if (filters.customer_phone) {
      query.set("filters[customer_phone][$containsi]", filters.customer_phone);
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(0, 0, 0, 0);

    query.set("filters[date][$gte]", startOfWeek.toISOString());
    query.set("filters[date][$lt]", endOfWeek.toISOString());

    return query.toString();
  }, [filters, page, pageSize]);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<SalesListResponse>(
        `/api/sales?${buildQuery()}`
      );
      setSales(response.data.data);
      setMeta(response.data.meta.pagination);
    } catch (error) {
      console.log("Failed to fetch sales:", error);
      toast.error("Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handlePageSizeChange = (value: string): void => {
    setPageSize(Number(value));
    setPage(1);
  };

  const handleDelete = async (item: ReportSale): Promise<void> => {
    if (
      !window.confirm(
        `Are you sure you want to delete invoice "${item.invoice_number}"?`
      )
    ) {
      return;
    }

    try {
      if (item.documentId) {
        await axiosInstance.delete(`/api/sales/${item.documentId}`);
      }
      await fetchData();
      toast.success("Sale deleted successfully");
    } catch (error) {
      console.log("Delete failed: ", error);
      toast.error("Failed to delete sales record");
    }
  };

  const columns = getColumns<ReportSale>(
    filters,
    handleFilterChange,
    handleDelete
  );

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Weekly Sales</CardTitle>
          <CardDescription>
            <span>List of weekly sales</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <DataTable columns={columns} data={sales} />
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center mt-4 text-sm text-muted-foreground">
            {meta && (
              <>
                {sales.length === 0
                  ? "No rows"
                  : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${
                      (meta.page - 1) * meta.pageSize + sales.length
                    } of ${meta.total} rows`}
              </>
            )}

            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>Rows per page</span>
            </div>

            <span className="whitespace-nowrap">
              Page {meta?.page} of {meta?.pageCount}
            </span>

            {/* pagination buttons */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                «
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, meta?.pageCount || 1))
                }
                disabled={page === meta?.pageCount}
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(meta?.pageCount ?? page)}
                disabled={page === meta?.pageCount}
              >
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
