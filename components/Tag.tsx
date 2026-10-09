import type { TagColor } from "@/lib/domain";

export default function Tag({ color, children }: { color: TagColor; children: React.ReactNode }) {
  return <span className={`tag tag-${color}`}>{children}</span>;
}
