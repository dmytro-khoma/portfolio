/**
 * state.js — the few values shared between the DOM effects (app.js) and the
 * WebGL scene (scene.js), plus small helpers both of them use.
 */

export const root = document.documentElement;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

export const state = {
  /** Pointer position in viewport pixels. */
  pointer: { x: innerWidth * 0.7, y: innerHeight * 0.4, active: false },
  /** Progress of each particle morph (0..1), written by ScrollTrigger. */
  segments: [0, 0, 0, 0],
  /** Set to 1 on a click; the scene lets it decay (a shock wave). */
  kick: 0,
  /** Scroll speed (px per frame, signed), written from Lenis. */
  velocity: 0,
};

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Read a colour token ("#rrggbb" or "#rgb") as [r, g, b] in 0..1. */
function token(name) {
  let hex = getComputedStyle(root).getPropertyValue(name).trim().replace('#', '');
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) return [0.5, 0.5, 0.5];
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

/** Colours from the CSS tokens; re-read when the theme changes. */
export const palette = {};
const listeners = [];

export function onPalette(listener) {
  listeners.push(listener);
}

function readPalette() {
  palette.bg = token('--color-bg');
  palette.accent = token('--color-accent');
  palette.fx2 = token('--fx-2');
  palette.fx3 = token('--fx-3');
  palette.dark = palette.bg[0] + palette.bg[1] + palette.bg[2] < 1.5;
  for (const listener of listeners) listener();
}

export function watchPalette() {
  readPalette();
  new MutationObserver(readPalette).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readPalette);
}
