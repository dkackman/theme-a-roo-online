import { BackdropFilters } from "./BackdropFilters";
interface BackgroundEditorProps {
  className?: string;
}

export function BackgroundEditor({ className = "" }: BackgroundEditorProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-center h-full">
        <BackdropFilters />
      </div>
    </div>
  );
}
