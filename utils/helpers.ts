export const clamp = (n: number, lo: number, hi: number) => {
  return Math.min(Math.max(n, lo), hi);
};
