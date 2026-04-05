// Shared layout constants for the Five Areas diagram and modal animation.
// Single source of truth — imported by FiveAreasDiagram and AreaInputModal.

export const VB_W = 320;
export const VB_H = 290;
export const MAX_CANVAS_W = 420;
export const CANVAS_H_PAD = 32; // horizontal padding subtracted from screen width

// Node positions in viewbox coordinates (order matches AREA_KEYS)
export const NODE_POSITIONS = [
  { x: 160, y: 36 }, // situation
  { x: 75, y: 115 }, // thoughts
  { x: 245, y: 115 }, // emotions
  { x: 75, y: 205 }, // physical
  { x: 245, y: 205 }, // behaviours
  { x: 160, y: 260 } // reflection
] as const;
