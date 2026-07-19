import { TIER_CLASSES, type Tier } from "@/lib/urgencia";

export function Badge({ tier, children }: { tier: Tier; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TIER_CLASSES[tier]}`}
    >
      {children}
    </span>
  );
}
