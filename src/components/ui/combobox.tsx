"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  popoverClassName?: string;
  allowClear?: boolean;
  disabled?: boolean;
  onCreateNew?: (value: string) => void;
  createNewLabel?: (value: string) => string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  className,
  popoverClassName,
  allowClear = true,
  disabled = false,
  onCreateNew,
  createNewLabel = (value) => `Create "${value}"`,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");

  // Use controlled value if onValueChange is provided, otherwise use internal state
  const isControlled = onValueChange !== undefined;
  const currentValue = isControlled ? value || "" : internalValue;

  const handleValueChange = (newValue: string) => {
    if (isControlled) {
      onValueChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const selectedOption = options.find(
    (option) => option.value === currentValue
  );

  // Check if search value matches any option (case-insensitive)
  const searchMatchesOption = (search: string) => {
    const normalizedSearch = search.toLowerCase().trim();
    return options.some(
      (option) =>
        option.value.toLowerCase() === normalizedSearch ||
        option.label.toLowerCase() === normalizedSearch
    );
  };

  // Check if we should show "create new" option
  const shouldShowCreateNew =
    onCreateNew &&
    searchValue.trim().length > 0 &&
    !searchMatchesOption(searchValue);

  const handleSelect = (selectedValue: string) => {
    // Check if this is a "create new" action
    if (shouldShowCreateNew && selectedValue === searchValue.trim()) {
      onCreateNew(searchValue.trim());
      handleValueChange(searchValue.trim());
      setSearchValue("");
      setOpen(false);
      return;
    }

    const newValue =
      allowClear && selectedValue === currentValue ? "" : selectedValue;
    handleValueChange(newValue);
    setSearchValue("");
    setOpen(false);
  };

  // Handle displaying custom value if it's not in options
  const displayValue = selectedOption
    ? selectedOption.label
    : currentValue || placeholder;

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0 z-[100]",
          popoverClassName
        )}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {options.length === 0 && !shouldShowCreateNew && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup>
              {options
                .filter((option) => {
                  if (!searchValue.trim()) {
                    return true;
                  }
                  const normalizedSearch = searchValue.toLowerCase();
                  return (
                    option.value.toLowerCase().includes(normalizedSearch) ||
                    option.label.toLowerCase().includes(normalizedSearch)
                  );
                })
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    className="flex items-center"
                  >
                    <span className="truncate flex-1">{option.label}</span>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0",
                        currentValue === option.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              {shouldShowCreateNew && (
                <CommandItem
                  value={searchValue.trim()}
                  onSelect={handleSelect}
                  className="text-primary flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">
                    {createNewLabel(searchValue.trim())}
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
            {options.length > 0 &&
              searchValue.trim() &&
              !shouldShowCreateNew && (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
