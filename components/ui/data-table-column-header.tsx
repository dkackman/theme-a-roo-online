import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const isSorted = column.getIsSorted();
  const sortDirection = isSorted === "desc" ? "descending" : "ascending";

  const getSortIcon = () => {
    if (isSorted === "desc") {
      return <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />;
    }
    if (isSorted === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />;
    }
    return (
      <ChevronsUpDown
        className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
        aria-hidden="true"
      />
    );
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
        aria-label={
          "Sort by " + title + (isSorted ? ` (${sortDirection})` : "")
        }
        aria-sort={isSorted ? sortDirection : "none"}
      >
        <span>{title}</span>
        {getSortIcon()}
      </Button>
    </div>
  );
}
