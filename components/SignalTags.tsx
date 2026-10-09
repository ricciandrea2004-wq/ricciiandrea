import Tag from "./Tag";
import { categoryColor, categoryLabel, statusColor, statusLabel, type Category, type SignalStatus } from "@/lib/domain";

export function CategoryTag({ category }: { category: Category }) {
  return <Tag color={categoryColor[category]}>{categoryLabel[category]}</Tag>;
}

// `live` marks the current status of a signal (not a past one in a history): a signal
// still to verify then carries a slowly breathing dot, the only loop in the workspace.
export function StatusTag({ status, live = false }: { status: SignalStatus; live?: boolean }) {
  if (live && status === "to_verify")
    return (
      <Tag color={statusColor[status]} className="tag--live">
        <span className="tag__pulse" aria-hidden="true" />
        {statusLabel[status]}
      </Tag>
    );
  return <Tag color={statusColor[status]}>{statusLabel[status]}</Tag>;
}
