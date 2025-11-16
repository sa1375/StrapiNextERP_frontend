"use client";

import {
  getColumns,
  type FilterChangeHandler,
  type Filters,
} from "./features/columns";
import { DataTable } from "@/components/data-table";
import {
  Card,
  CardAction,
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
import { Sheet } from "@/components/ui/sheet";
import { New, type ProductItem } from "./features/new";
import { toast } from "sonner";

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface ProductsResponse {
  data: ProductItem[];
  meta: {
    pagination: PaginationMeta;
  };
}

const Page = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Filters>({ name: "", barcode: "" });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);

  const handleFilterChange = useCallback<FilterChangeHandler>((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value ?? "" }));
    setPage(1);
  }, []);

  const buildQuery = useCallback(() => {
    const query = new URLSearchParams();
    query.set("pagination[page]", page.toString());
    query.set("pagination[pageSize]", pageSize.toString());
    query.set("populate[0]", "category");
    query.set("populate[1]", "image");

    if (filters.name) {
      query.set("filters[name][$containsi]", filters.name);
    }

    if (filters.barcode) {
      query.set("filters[barcode][$eqi]", filters.barcode);
    }

    return query.toString();
  }, [filters, page, pageSize]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get<ProductsResponse>(
        `/api/products?${buildQuery()}`
      );
      console.log("Fetched products:", data.data);
      setProducts(data.data);
      setMeta(data.meta.pagination);
    } catch (error) {
      console.log("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const handleDelete = async (item: ProductItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name ?? ""}"?`))
      return;

    try {
      await axiosInstance.delete(`/api/products/${item.documentId}`);
      await fetchData();
      toast.success("Product deleted successfully");
    } catch (error) {
      console.log("Delete failed: ", error);
      toast.error("Failed to delete product");
    }
  };

  const columns = getColumns(
    filters,
    handleFilterChange,
    (item) => {
      setSelectedItem(item);
      setSheetOpen(true);
    },
    handleDelete
  );

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            <span>List of products</span>
          </CardDescription>

          <CardAction>
            <Button
              onClick={() => {
                setSelectedItem(null);
                setSheetOpen(true);
              }}
            >
              Add a new record
            </Button>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <New
                item={selectedItem}
                isOpen={sheetOpen}
                onSuccess={() => {
                  setSheetOpen(false);
                  void fetchData();
                }}
              />
            </Sheet>
          </CardAction>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <DataTable columns={columns} data={products} />
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center mt-4 text-sm text-muted-foreground">
            {meta && (
              <>
                {products.length === 0
                  ? "No rows"
                  : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${
                      (meta.page - 1) * meta.pageSize + products.length
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
                onClick={() => {
                  if (meta?.pageCount) {
                    setPage(meta.pageCount);
                  }
                }}
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
