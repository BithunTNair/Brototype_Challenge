import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "submitted" | "in_review" | "in_progress" | "resolved" | "closed";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    submitted: { label: "Submitted", variant: "secondary" as const },
    in_review: { label: "In Review", variant: "default" as const },
    in_progress: { label: "In Progress", variant: "default" as const },
    resolved: { label: "Resolved", variant: "default" as const },
    closed: { label: "Closed", variant: "secondary" as const },
  };

  const config = statusConfig[status];
  
  const getStatusColor = () => {
    switch (status) {
      case "submitted":
        return "bg-status-submitted text-white";
      case "in_review":
        return "bg-status-in-review text-white";
      case "in_progress":
        return "bg-status-in-progress text-white";
      case "resolved":
        return "bg-status-resolved text-white";
      case "closed":
        return "bg-status-closed text-white";
      default:
        return "";
    }
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(getStatusColor(), className)}
    >
      {config.label}
    </Badge>
  );
}
