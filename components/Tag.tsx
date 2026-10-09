import type { TagColor } from "@/lib/domain";

export default function Tag({
  color,
  className = "",
  children,
}: {
  color: TagColor;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={`tag tag-${color} ${className}`.trim()}>{children}</span>;
}
