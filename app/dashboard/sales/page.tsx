//app/dashboard/sales/page.tsx

"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getColumns, type Filters, type FilterChangeHandler, type SaleRow } from "./features/columns";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { InvoiceForm } from "./new/page";

// Extended sale data type from API response
type SaleItem = Omit<InvoiceForm, "date" | "total"> &
  SaleRow & {
    date: SaleRow["date"];
    total: SaleRow["total"];
  };

// Pagination metadata type
interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

// API response pagination structure
interface ApiPaginationResponse {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  [key: string]: any;
}

// Sales list API response type
interface SalesListResponse {
  data: SaleItem[];
  meta: {
    pagination: PaginationMeta;
  };
}

// Delete handler callback type
type DeleteHandler = (item: SaleItem) => Promise<void>;

// View/Select handler callback type
type SelectHandler = (item: SaleItem) => void;

export default function Page() {
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Filters>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SaleItem | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const router = useRouter();

  const handleFilterChange = useCallback<FilterChangeHandler>((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value ?? "" }));
    setPage(1);
  }, []);

  const buildQuery = (): string => {
    const query = new URLSearchParams();
    query.set("pagination[page]", page.toString());
    query.set("pagination[pageSize]", pageSize.toString());

    if (filters.invoice_number) {
      query.set("filters[invoice_number][$eqi]", filters.invoice_number);
    }

    if (filters.customer_name) {
      query.set(
        "filters[customer_name][$containsi]",
        filters.customer_name
      );
    }

    if (filters.customer_phone) {
      query.set("filters[customer_phone][$eqi]", filters.customer_phone);
    }

    if (filters.customer_email) {
      query.set("filters[customer_email][$eqi]", filters.customer_email);
    }

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setUTCHours(24, 0, 0, 0);

      query.set("filters[date][$gte]", startOfDay.toISOString());
      query.set("filters[date][$lt]", endOfDay.toISOString());
    }

    return query.toString();
  };

  const handleDelete: DeleteHandler = async (item) => {
    setSelectedItems(item);
    setAlertOpen(true);
  };

  const handleDeleteConfirmed = async (): Promise<void> => {
    if (selectedItems?.documentId) {
      try {
        await axiosInstance.delete(`/api/sales/${selectedItems.documentId}`);
        toast.success("Successfully deleted item");
        setAlertOpen(false);
        await fetchData(); // Refresh the data
      } catch (error) {
        console.log("Failed to delete the item: ", error);
        toast.error("Failed to delete the item");
      }
    }
  };
  const columns = getColumns<SaleItem>(
    filters,
    handleFilterChange,
    ((item: SaleItem): void => {
      setSelectedItems(item);
      setSheetOpen(true);
    }) as SelectHandler,
    handleDelete
  );

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<SalesListResponse>(
        `/api/sales?${buildQuery()}`
      );
      setSales(response.data.data);
      setMeta(response.data.meta.pagination);
    } catch (error) {
      console.log("failed to fetch sales data", error);
      toast.error("Failed to fetch sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, filters]);

  function handlePageSizeChange(value: string): void {
    setPageSize(Number(value));
    setPage(1);
  }

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Sales</CardTitle>
          <CardDescription>
            <span>List Of Sales</span>
          </CardDescription>
          <CardAction>
            <Button onClick={() => router.push("/dashboard/sales/new")}>
              Add A New Invoice
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-4 md:py-6 px-4 lg:px-6">Loading ... </p>
          ) : (
            <DataTable columns={columns} data={sales} />
          )}
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            {/* pagination */}
            {meta && (
              <>
                {sales.length <= 0
                  ? "No Rows To Show"
                  : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${
                      // computing items number
                      (meta.page - 1) * meta.pageSize + sales.length
                    } of ${meta.total} rows`}
              </>
            )}
            {/* changing page */}
            <Pagination className="cursor-default">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {meta &&
                  Array.from({ length: meta.pageCount || 1 }, (_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        isActive={page === i + 1} // i starts from 0
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={(next) =>
                      setPage((next) =>
                        Math.min(next + 1, meta?.pageCount || next + 1)
                      )
                    }
                    aria-disabled={page === meta?.pageCount}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            {/* page size */}
            <Select onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Alert Dialog for Deletion Confirmation */}
          <AlertDialog open={alertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this sale.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAlertOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirmed}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
