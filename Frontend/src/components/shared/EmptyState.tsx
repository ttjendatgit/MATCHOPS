import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
      )}
      <h3 className="mb-1 text-base font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
