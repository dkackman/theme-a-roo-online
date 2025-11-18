import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  AppWindow,
  Copy,
  Info,
  LinkIcon,
  MoreVertical,
  SendIcon,
  UserRoundPlus,
} from "lucide-react";
import { useState } from "react";
import { type Theme } from "theme-o-rama";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Field, FieldContent, FieldError, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";

interface DemoTableData {
  id: string;
  name: string;
  status: string;
  value: number;
}

// Add demo table columns
const demoColumns: ColumnDef<DemoTableData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "value",
    header: "Value",
  },
];

// Add demo table data
const demoTableData: DemoTableData[] = [
  { id: "1", name: "Item 1", status: "Active", value: 100 },
  { id: "2", name: "Item 2", status: "Inactive", value: 250 },
  { id: "3", name: "Item 3", status: "Active", value: 75 },
  { id: "4", name: "Item 4", status: "Pending", value: 300 },
];
interface ThemePreviewContentProps {
  theme: Theme | null;
}

export function ThemePreviewContent({ theme }: ThemePreviewContentProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [spoons, setSpoons] = useState("");
  const [combineFee, setCombineFee] = useState("");
  const [errors, setErrors] = useState<{
    spoons?: string;
    combineFee?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { spoons?: string; combineFee?: string } = {};

    if (!spoons || spoons.trim().length === 0) {
      newErrors.spoons = "At least one spoon is required";
    } else if (spoons.length > 10) {
      newErrors.spoons = "No more than 10 spoons";
    }

    if (!combineFee || combineFee.trim().length === 0) {
      newErrors.combineFee = "Not enough funds to cover the fee";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle form submission
      setDialogOpen(false);
      // Reset form
      setSpoons("");
      setCombineFee("");
      setErrors({});
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          {theme?.displayName ?? "Theme"} Preview
        </h1>
      </div>

      {/* Current Theme Info */}
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Theme Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>Theme information</CardDescription>
          <div className="space-y-2 text-left">
            <p>
              <strong>Name:</strong> {theme?.name || "None"}
            </p>
            <p>
              <strong>Display Name:</strong> {theme?.displayName || "None"}
            </p>
            <p>
              <strong>Inherits:</strong> {theme?.inherits || "N/A"}
            </p>
            <p>
              <strong>Most Like:</strong> {theme?.mostLike || "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Components */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Test Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription>
            Various test components to preview the theme
          </CardDescription>
          {/* Buttons */}
          <div className="space-y-2">
            <h3 className="font-medium">Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            <h3 className="font-medium">Cards</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="space-y-2">
                <CardHeader>
                  <CardTitle>Card 1</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    This is a card with themed styling.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="space-y-2">
                <CardHeader>
                  <CardTitle>Card 2</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Cards adapt to the current theme.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <h3 className="font-medium">Color Palette</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-sm bg-primary p-3 text-primary-foreground">
                Primary
              </div>
              <div className="rounded-sm bg-secondary p-3 text-secondary-foreground">
                Secondary
              </div>
              <div className="rounded-sm bg-accent p-3 text-accent-foreground">
                Accent
              </div>
              <div className="rounded-sm bg-muted p-3 text-muted-foreground">
                Muted
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">
              Border Radius
            </Label>
            <div className="space-y-4">
              <div>
                Border Radius:{" "}
                <div className="mt-2 flex gap-2">
                  <div className="w-8 h-8 bg-primary rounded-none" />
                  <div className="w-8 h-8 bg-primary rounded-sm" />
                  <div className="w-8 h-8 bg-primary rounded-md" />
                  <div className="w-8 h-8 bg-primary rounded-lg" />
                  <div className="w-8 h-8 bg-primary rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">
              Component Examples
            </Label>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Drop down menu</span>
                    <MoreVertical className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer">
                      <SendIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Transfer</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer"
                      disabled={true}
                    >
                      <UserRoundPlus
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      <span>Disabled</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer">
                      <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Item</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem className="cursor-pointer">
                      <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Copy</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-4">
              <div className="mt-4">
                <Input placeholder="Input field" />
              </div>

              <div className="flex items-center gap-2 my-2">
                <label htmlFor="toggleExample">Toggle Switch</label>
                <Switch id="toggleExample" />
              </div>
              <div>
                <label htmlFor="checkboxExample" className="mr-2">
                  Checkbox
                </label>
                <Checkbox id="checkboxExample" />
              </div>
              <div>
                <label htmlFor="selectExample" className="mr-2">
                  Select
                </label>
                <Select>
                  <SelectTrigger id="selectExample">
                    <SelectValue placeholder="Select a value" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
                    <SelectItem key="none" value="none">
                      None
                    </SelectItem>
                    <SelectItem key="one" value="one">
                      One
                    </SelectItem>
                    <SelectItem key="two" value="two">
                      Two
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tables Theme</CardTitle>
          <CardDescription>
            Preview of the current theme&apos;s color palette and styling for
            tables.
          </CardDescription>
        </CardHeader>
      </Card>
      <DataTable
        columns={demoColumns}
        data={demoTableData}
        rowLabel="item"
        rowLabelPlural="items"
      />

      <Card>
        <CardHeader>
          <CardTitle>Dialogs Theme</CardTitle>
          <CardDescription>
            Preview of the current theme&apos;s dialogs and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>This is an alert.</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            <AppWindow className="mr-2 h-4 w-4" />
            Open Dialog
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Preview of the current theme&apos;s fonts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fonts */}
          <div className="space-y-4">
            {theme?.fonts && (
              <>
                {theme.fonts.heading && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Heading Font
                    </Label>
                    <div
                      className="text-2xl font-semibold"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {theme.fonts.heading}
                    </p>
                  </div>
                )}
                {theme.fonts.body && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Body Font
                    </Label>
                    <div
                      className="text-base"
                      style={{ fontFamily: theme.fonts.body }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {theme.fonts.body}
                    </p>
                  </div>
                )}
                {theme.fonts.sans && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Sans Font
                    </Label>
                    <div
                      className="text-base"
                      style={{ fontFamily: theme.fonts.sans }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {theme.fonts.sans}
                    </p>
                  </div>
                )}
                {theme.fonts.serif && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Serif Font
                    </Label>
                    <div
                      className="text-base"
                      style={{ fontFamily: theme.fonts.serif }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {theme.fonts.serif}
                    </p>
                  </div>
                )}
                {theme.fonts.mono && (
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Monospace Font
                    </Label>
                    <div
                      className="text-base font-mono"
                      style={{ fontFamily: theme.fonts.mono }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {theme.fonts.mono}
                    </p>
                  </div>
                )}
              </>
            )}
            {(!theme?.fonts ||
              Object.keys(theme.fonts).length === 0 ||
              Object.values(theme.fonts).every((f) => !f)) && (
              <p className="text-sm text-muted-foreground">
                No custom fonts defined in this theme.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent theme={theme}>
          <DialogHeader>
            <DialogTitle>Dialog</DialogTitle>
            <DialogDescription>This is a dialog.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel>Number of spoons</FieldLabel>
              <FieldContent>
                <Input
                  value={spoons}
                  onChange={(e) => {
                    setSpoons(e.target.value);
                    if (errors.spoons) {
                      setErrors((prev) => ({ ...prev, spoons: undefined }));
                    }
                  }}
                />
                {errors.spoons && <FieldError>{errors.spoons}</FieldError>}
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Combine Fee</FieldLabel>
              <FieldContent>
                <Input
                  value={combineFee}
                  onChange={(e) => {
                    setCombineFee(e.target.value);
                    if (errors.combineFee) {
                      setErrors((prev) => ({ ...prev, combineFee: undefined }));
                    }
                  }}
                />
                {errors.combineFee && (
                  <FieldError>{errors.combineFee}</FieldError>
                )}
              </FieldContent>
            </Field>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSpoons("");
                  setCombineFee("");
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Ok</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
