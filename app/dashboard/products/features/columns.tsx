"use client";

import ColumnFilter from "@/components/ColumnFilter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { IconDotsVertical } from "@tabler/icons-react";
import Image from "next/image";
import type { ProductItem } from "./new";

export type Filters = {
  barcode?: string;
  name?: string;
};

export type FilterChangeHandler = <K extends keyof Filters>(
  key: K,
  value: Filters[K]
) => void;

const resolveImageUrl = (image?: ProductItem["image"]) => {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
  let imagePath: string | undefined;
  
  if (Array.isArray(image)) {
    // If image is an array, take the first image's URL
    imagePath = image[0]?.formats?.thumbnail?.url ?? image[0]?.url;
  } else if (image) {
    // If it's a single image
    imagePath = image.formats?.thumbnail?.url ?? image.url;
  }

  if (!baseUrl || !imagePath) {
    return null;
  }

  return `${baseUrl}${imagePath}`;
};

export const getColumns = (
  filters: Filters,
  handleFilterChange: FilterChangeHandler,
  onEdit: (item: ProductItem) => void,
  onDelete: (item: ProductItem) => void
): ColumnDef<ProductItem>[] => [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = resolveImageUrl(row.original.image);

      return (
        <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={row.original.name ?? "Product image"}
              width={50}
              height={50}
              className="size-12 object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              N/A
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "barcode",
    header: () => (
      <ColumnFilter
        label="Barcode"
        placeholder="Filter barcode..."
        value={filters.barcode ?? ""}
        onChange={(val) => handleFilterChange("barcode", val)}
      />
    ),
    cell: (info) => info.getValue<string>(),
  },
  {
    accessorKey: "name",
    header: () => (
      <ColumnFilter
        label="Name"
        placeholder="Filter name..."
        value={filters.name ?? ""}
        onChange={(val) => handleFilterChange("name", val)}
      />
    ),
    cell: (info) => info.getValue<string>(),
  },
  {
    accessorKey: "category.name",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category;

      if (!category) {
        return "N/A";
      }

      if (typeof category === "string") {
        return category || "N/A";
      }

      return category.name ?? "N/A";
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: (info) => info.getValue<number>(),
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: (info) => info.getValue<number>(),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(row.original)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
