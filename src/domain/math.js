export function clamp(value, min, max) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function distSq(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function normalize(x, y) {
  const len = Math.hypot(x, y);
  if (len <= 0.00001) {
    return { x: 0, y: 0, len: 0 };
  }
  return { x: x / len, y: y / len, len };
}

export function circlesOverlap(ax, ay, ar, bx, by, br) {
  const sum = ar + br;
  return distSq(ax, ay, bx, by) <= sum * sum;
}

export function angleBetween(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}
