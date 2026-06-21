import { Badge, type BadgeProps } from "@mantine/core";

function phaseColor(phase?: string): string {
  switch (phase) {
    case "Running":
      return "success";
    case "Pending":
      return "warning";
    case "Failed":
    case "CrashLoopBackOff":
      return "danger";
    default:
      return "gray";
  }
}

interface PodPhaseBadgeProps extends BadgeProps {
  phase?: string;
}

export function PodPhaseBadge({ phase, className, ...props }: PodPhaseBadgeProps) {
  const pulse = phase === "Pending";
  const classNames = [pulse ? "pf-badge-pulse" : "", className].filter(Boolean).join(" ");

  return (
    <Badge
      color={phaseColor(phase)}
      variant="light"
      className={classNames || undefined}
      {...props}
    >
      {phase ?? "Unknown"}
    </Badge>
  );
}
