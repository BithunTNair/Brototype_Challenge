import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high";
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const priorityConfig = {
    low: { 
      label: "Low", 
      icon: Info,
      color: "bg-priority-low text-white"
    },
    medium: { 
      label: "Medium", 
      icon: AlertTriangle,
      color: "bg-priority-medium text-white"
    },
    high: { 
      label: "High", 
      icon: AlertCircle,
      color: "bg-priority-high text-white"
    },
  };

  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge 
      variant="default"
      className={cn(config.color, "flex items-center gap-1", className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
