import { BackdropFilters } from "./BackdropFilters";
import { ThemeColorPicker } from "./ThemeColorPicker";

interface BackgroundEditorProps {
  className?: string;
}

export function BackgroundEditor({ className = "" }: BackgroundEditorProps) {
  return (
    <div className={`${className} w-full`}>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Backdrop Filters</h3>
          <BackdropFilters />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Theme Color</h3>
          <ThemeColorPicker />
        </div>
      </div>
    </div>
  );
}
