// Animated SVG success checkmark (draws circle then tick).
export default function SuccessCheck({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle className="check-circle" cx="32" cy="32" r="28" stroke="#10b981" strokeWidth="4" />
      <path className="check-mark" d="M20 33l8 8 16-17" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
