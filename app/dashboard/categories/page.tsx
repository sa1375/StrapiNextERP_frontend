//app/dashboard/categories/page.tsx

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
import { getColumns } from "./features/columns";
import type { Filters, FilterChangeHandler } from "./features/columns";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Sheet } from "@/components/ui/sheet";
import New, { type CategoryItem } from "./features/new";
import { toast } from "sonner";

interface ApiData {
  id: number;
  name: string;
  description: string;
  documentID: string | undefined;
}

export default function Page({}) {
  const [categories, setCategories] = useState<ApiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Filters>({
    name: "",
    description: "",
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<CategoryItem | null>();
  const [alertOpen, setAlertOpen] = useState(false);

  const handleFilterChange = useCallback<FilterChangeHandler>((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value ?? "" }));
    setPage(1);
  }, []);

  const buildQuery = () => {
    const query = new URLSearchParams();
    query.set("pagination[page]", page.toString());
    query.set("pagination[pageSize]", pageSize.toString());

    if (filters.name) {
      query.set("filters[name][$containsi]", filters.name);
    }

    if (filters.description) {
      query.set("filters[description][$containsi]", filters.description);
    }

    return query.toString();
  };

  async function handleDelete(item: CategoryItem) {
    setSelectedItems(item);
    setAlertOpen(true);
  }

  async function handleDeleteConfirmed() {
    if (selectedItems) {
      try {
        await axiosInstance.delete(
          `/api/categories/${selectedItems.documentId}`
        );
        toast.success("Successfully deleted item");
        setAlertOpen(false);
        await fetchData(); // Refresh the data
      } catch (error) {
        console.log("Failed to delete the item: ", error);
        toast.error("Failed to delete the item");
      }
    }
  }
  const columns = getColumns(
    filters,
    handleFilterChange,
    (item) => {
      setSelectedItems(item);
      setSheetOpen(true);
    },
    handleDelete
  );

  const fetchData = () => {
    setLoading(true);
    axiosInstance
      .get(`/api/categories?${buildQuery()}`)
      .then((response) => {
        const apiData: ApiData[] = response.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          documentId: item.documentId,
        }));
        setCategories(apiData);
        setMeta(response.data.meta.pagination);
      })
      .catch((error) => {
        console.log("failed to fetch categories", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, filters]);

  function handlePageSizeChange(value: any) {
    setPageSize(Number(value));
    setPage(1);
  }

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            <span>List Of Categories</span>
          </CardDescription>
          <CardAction>
            <Button
              onClick={() => {
                setSelectedItems(null);
                setSheetOpen(true);
              }}
            >
              Add A New Record
            </Button>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <New
                item={selectedItems}
                isOpen={sheetOpen}
                onSuccess={() => {
                  setSheetOpen(false);
                  fetchData();
                }}
              />
            </Sheet>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-4 md:py-6 px-4 lg:px-6">Loading ... </p>
          ) : (
            <DataTable columns={columns} data={categories} />
          )}
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            {/* pagination */}
            {meta && (
              <>
                {categories.length <= 0
                  ? "No Rows To Show"
                  : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${
                      // computing items number
                      (meta.page - 1) * meta.pageSize + categories.length
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
                {Array.from({ length: meta.pageCount || 1 }, (_, i) => (
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
                        Math.min(next + 1, meta.pageCount || next + 1)
                      )
                    }
                    aria-disabled={page === meta.pageCount}
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
                  this category.
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
