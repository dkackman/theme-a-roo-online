import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { ReactNode } from "react";

interface DeleteButtonProps {
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  trigger?: ReactNode;
  className?: string;
}

export function DeleteButton({
  title,
  description,
  onConfirm,
  disabled = false,
  trigger,
  className,
}: DeleteButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <button
            className={`p-1.5 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${className || ""}`}
            disabled={disabled}
            title={title}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
