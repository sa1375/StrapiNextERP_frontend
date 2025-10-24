// components/ColumnFilter.jsx

"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterX, Funnel } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function ColumnFilter({ label, value, onChange, placeHolder }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  function handleApply() {
    onChange(inputValue);
    setOpen(false);
  }

  function handleClear() {
    setInputValue("");
    onChange("");
  }

  return (
    <div className="flex items-center gap-1">
      {label}
      {value ? (
        <Button
          varient="ghost"
          size="icon"
          className="h-6 w-6 p-1 text-primary"
          onClick={handleClear}
        >
          <FilterX className="h4 w4" />
        </Button>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button varient="ghost" size="icon" className="h-6 w-6 p-1">
              <Funnel className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52">
            <Input
              placeholder={placeHolder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleApply} size="sm" className="w-full">
              Apply
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
