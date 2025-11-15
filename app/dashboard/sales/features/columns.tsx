"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";
import ColumnFilter from "@/components/ColumnFilter";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export type Filters = {
  invoice_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  date?: string;
};

export type SaleRow = {
  id: string | number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  date: string | Date | null;
  total: number | null;
  documentId?: string;
  [key: string]: unknown;
};
export type FilterChangeHandler = <K extends keyof Filters>(
  key: K,
  value: Filters[K]
) => void;

export const getColumns = <T extends SaleRow>(
  filters: Filters,
  handleFilterChange: FilterChangeHandler,
  onEdit: (item: T) => void,
  onDelete: (item: T) => void
): ColumnDef<T>[] => [
  {
    accessorKey: "invoice_number",
    header: () => (
      <ColumnFilter
        label="Invoice Number"
        type="text"
        value={filters.invoice_number ?? ""}
        onChange={(value: string) =>
          handleFilterChange("invoice_number", value)
        }
        placeholder="Filter Invoice Number..."
      />
    ),
    cell: (info) => info.getValue<string>(),
  },
  {
    accessorKey: "customer_name",
    header: () => (
      <ColumnFilter
        label="Customer Name"
        type="text"
        value={filters.customer_name ?? ""}
        onChange={(value: string) => handleFilterChange("customer_name", value)}
        placeholder="Filter Customer Name..."
      />
    ),
    cell: (info) => info.getValue<string>(),
  },
  {
    accessorKey: "customer_phone",
    header: () => (
      <ColumnFilter
        label="Customer Phone"
        type="text"
        value={filters.customer_phone ?? ""}
        onChange={(value: string) =>
          handleFilterChange("customer_phone", value)
        }
        placeholder="Filter Customer Phone..."
      />
    ),
    cell: (info) => info.getValue<string>(),
  },
  {
    accessorKey: "customer_email",
    header: () => (
      <ColumnFilter
        label="Customer Email"
        type="email"
        placeholder="Filter Customer Email..."
        value={filters.customer_email ?? ""}
        onChange={(val: string) => handleFilterChange("customer_email", val)}
      />
    ),
    cell: (info) => info.getValue<string>(),
  },
  {
    accessorKey: "date",
    header: () => (
      <ColumnFilter
        label="Date"
        type="date"
        placeholder="Filter Date..."
        value={filters.date ?? ""}
        onChange={(val: string) => handleFilterChange("date", val)}
      />
    ),
    cell: (info) => {
      const dateValue = info.getValue<string | Date | null>();
      return dateValue ? format(new Date(dateValue), "yyyy-MM-dd hh-mm a") : "N/A";
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: (info) => {
      const total = info.getValue<number | null>();
      return typeof total === "number" ? `$${total.toFixed(2)}` : "N/A";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={() => {}}>
            Download Invoice
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              onDelete(row.original as T); // Call the delete function
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
