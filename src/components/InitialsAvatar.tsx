import { cn } from "@/lib/utils";

type Props = {
  seed: string;
  size?: number;
  className?: string;
};

// Deterministic gradient avatar with initials — consistent across renders.
export const InitialsAvatar = ({ seed, size = 36, className }: Props) => {
  const initials = seed
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Hash seed → hue
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))`,
      }}
      aria-label={seed}
    >
      {initials}
    </div>
  );
};
