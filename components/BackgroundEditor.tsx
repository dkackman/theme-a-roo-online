interface BackgroundEditorProps {
  className?: string;
}

export function BackgroundEditor({ className = "" }: BackgroundEditorProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Background content coming soon...
        </p>
      </div>
    </div>
  );
}
