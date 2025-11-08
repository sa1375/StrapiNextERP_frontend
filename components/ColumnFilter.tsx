"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FilterX, Funnel } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

type ColumnFilterProps = {
  label: ReactNode;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * @deprecated Use `placeholder` instead.
   */
  placeHolder?: string;
};

export default function ColumnFilter({
  label,
  value = "",
  onChange,
  placeholder,
  placeHolder,
}: ColumnFilterProps) {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  const resolvedPlaceholder = placeholder ?? placeHolder ?? "Filter value...";

  const handleApply = useCallback(() => {
    onChange(inputValue);
    setOpen(false);
  }, [inputValue, onChange]);

  const handleClear = useCallback(() => {
    setInputValue("");
    onChange("");
  }, [onChange]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
    },
    []
  );

  return (
    <div className="flex items-center gap-1">
      {label}
      {value ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-1 text-primary"
          onClick={handleClear}
        >
          <FilterX className="h-4 w-4" />
        </Button>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-1">
              <Funnel className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52">
            <Input
              placeholder={resolvedPlaceholder}
              value={inputValue}
              onChange={handleInputChange}
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
