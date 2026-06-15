import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      {showText && (
        <span className="text-lg font-semibold tracking-tight">
          RSBU Task Manager
        </span>
      )}
    </div>
  );
}
