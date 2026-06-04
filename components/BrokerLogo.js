import { getBrokerage } from "@/lib/data";

// Deterministic monogram "logo" for a brokerage. Uses the brand color and
// the first two letters of the short name — looks like an official app tile.
export default function BrokerLogo({ id, size = 40, rounded = "rounded-lg" }) {
  const b = getBrokerage(id);
  if (!b) return null;
  const initials = (b.short || b.name).replace(/[^A-Za-z*]/g, "").slice(0, 2).toUpperCase();
  return (
    <span
      className={`grid place-items-center ${rounded} font-bold text-white shadow-sm ring-1 ring-black/5`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${b.color}, ${shade(b.color, -18)})`,
        fontSize: size * 0.34,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

// Darken/lighten a hex color by percent (-100..100).
function shade(hex, percent) {
  const n = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
