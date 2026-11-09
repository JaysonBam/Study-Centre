export type FilamentGeometry = {
  width: number;
  height: number;
  path: string;
  fades: Array<{ x: number; y: number; width: number; height: number }>;
};

export function createFilamentPath(startX: number, startY: number, width: number, height: number) {
  const left = width * 0.09;
  const right = width * 0.91;
  const availableHeight = Math.max(760, height - startY);
  const y1 = startY + availableHeight * 0.2;
  const y2 = startY + availableHeight * 0.5;
  const y3 = startY + availableHeight * 0.79;
  const middle = width * 0.5;
  const firstEndX = startX - width * 0.14;
  const firstEndY = startY + 130;

  return [
    `M ${startX} ${startY}`,
    `C ${startX} ${startY + 54}, ${startX - width * 0.06} ${startY + 95}, ${firstEndX} ${firstEndY}`,
    `C ${startX - width * 0.22} ${startY + 165}, ${left} ${y1 - 105}, ${left} ${y1}`,
    `C ${left} ${y1 + 150}, ${right} ${y2 - 145}, ${right} ${y2}`,
    `C ${right} ${y2 + 155}, ${left} ${y3 - 150}, ${left} ${y3}`,
    `C ${left} ${y3 + 125}, ${middle - width * 0.12} ${height - 105}, ${middle} ${height - 20}`,
  ].join(' ');
}
