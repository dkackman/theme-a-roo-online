import { BackdropFilters } from "./BackdropFilters";
import { ThemeColorPicker } from "./ThemeColorPicker";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface BackgroundEditorProps {
  className?: string;
}

export function BackgroundEditor({ className = "" }: BackgroundEditorProps) {
  return (
    <Card className={`${className} w-full`}>
      <CardHeader>
        <CardTitle>Background</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold mb-4">Backdrop Filters</h3>
            <div className="ml-8">
              <BackdropFilters />
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Theme Color</h3>
            <ThemeColorPicker />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
