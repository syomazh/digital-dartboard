export const SEGMENTS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];
export const BOARD_RADIUS = 2;
export const SCORING_RADIUS = 1.7;

export type Hit = { points: number; label: string; x: number; y: number };
export type Target =
  { type: "text"; text: string } | { type: "image"; url: string } | null;

export function scoreHit(x: number, y: number): Hit {
  const radius = Math.hypot(x, y);
  if (radius > SCORING_RADIUS) return { points: 0, label: "Miss", x, y };
  if (radius <= 0.065) return { points: 50, label: "Bullseye", x, y };
  if (radius <= 0.16) return { points: 25, label: "Outer bull", x, y };
  const angle = (Math.atan2(x, y) + Math.PI / 20 + Math.PI * 2) % (Math.PI * 2);
  const value = SEGMENTS[Math.floor(angle / (Math.PI / 10)) % 20];
  const multiplier =
    radius >= 1.59 ? 2 : radius >= 0.96 && radius <= 1.07 ? 3 : 1;
  const label =
    multiplier === 3
      ? `Triple ${value}`
      : multiplier === 2
        ? `Double ${value}`
        : `Single ${value}`;
  return { points: value * multiplier, label, x, y };
}
