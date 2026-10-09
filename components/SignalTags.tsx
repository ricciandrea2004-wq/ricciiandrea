import Tag from "./Tag";
import { categoryColor, categoryLabel, statusColor, statusLabel, type Category, type SignalStatus } from "@/lib/domain";

export function CategoryTag({ category }: { category: Category }) {
  return <Tag color={categoryColor[category]}>{categoryLabel[category]}</Tag>;
}

export function StatusTag({ status }: { status: SignalStatus }) {
  return <Tag color={statusColor[status]}>{statusLabel[status]}</Tag>;
}
