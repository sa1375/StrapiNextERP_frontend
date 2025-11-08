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
import z from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { CategoryItem } from "./new";

export const schema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export type Filters = z.infer<typeof schema>;
export type FilterChangeHandler = <K extends keyof Filters>(
  key: K,
  value: Filters[K]
) => void;

export const getColumns = (
  filters: Filters,
  handleFilterChange: FilterChangeHandler,
  onEdit: (item: CategoryItem) => void,
  onDelete: (item: CategoryItem) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "name",
    header: () => (
      <ColumnFilter
        label="Name"
        value={filters.name ?? ""}
        onChange={(value: string) => handleFilterChange("name", value)}
        placeholder="Filter Name..."
      />
    ),
    cell: (info) => info.getValue<string>(),
  },
  {
    accessorKey: "description",
    header: () => (
      <ColumnFilter
        label="Description"
        placeholder="Filter description..."
        value={filters.description ?? ""}
        onChange={(val: string) => handleFilterChange("description", val)}
      />
    ),
    cell: (info) => info.getValue<string>(),
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
          <DropdownMenuItem
            onClick={() => {
              onEdit(row.original);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              onDelete(row.original); // Call the delete function
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
