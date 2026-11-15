/**
 * effects.js — the interactive "show-off" layer.
 *
 * Loaded by main.js with a dynamic import() when the browser is idle, so
 * it never competes with the content for the first paint. It is skipped
 * completely when the user prefers reduced motion.
 *
 * Effects
 *  1. WebGL hero      a domain-warped noise shader that bends around the pointer
 *  2. Kinetic title   the letters of the <h1> lean towards the pointer
 *  3. Scramble        eyebrows decode from random glyphs when they scroll in
 *  4. Tilt cards      3D tilt and a pointer-following glow on cards
 *  5. Magnetic        buttons are pulled a little towards the pointer
 *  6. Marquee         the CSS marquee follows the scroll speed and direction
 *  7. Numbers         count-up plus gooey blobs (SVG filter) following the pointer
 *  8. Spring field    a canvas of dots on springs; a click sends a shock wave
 *  9. Spotlight       a gradient text revealed under the pointer
 *
 * Performance rules
 *  - One requestAnimationFrame loop for everything.
 *  - Each effect runs only while its element is on screen (IntersectionObserver).
 *  - Only transform, opacity, clip-path, CSS variables and <canvas> change
 *    per frame, so nothing triggers layout.
 *  - Colours are read from the CSS tokens and re-read when the theme changes.
 */

const root = document.documentElement;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

/* ---- Shared state -------------------------------------------------------- */

const pointer = { x: innerWidth * 0.7, y: innerHeight * 0.4, active: false };
let scrollVelocity = 0;
let lastScroll = scrollY;

const visible = new WeakMap();
const visibility = new IntersectionObserver(
  (entries) => { for (const entry of entries) visible.set(entry.target, entry.isIntersecting); },
  { rootMargin: '120px 0px' },
);
const watch = (element) => { visibility.observe(element); return () => visible.get(element) === true; };

/** @type {Array<(time: number) => void>} */
const tasks = [];

/* ---- Helpers ------------------------------------------------------------- */

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Read a colour token ("#rrggbb" or "#rgb") as [r, g, b] in 0..1. */
function token(name) {
  let hex = getComputedStyle(root).getPropertyValue(name).trim().replace('#', '');
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) return [0.5, 0.5, 0.5];
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
const css = ([r, g, b]) => `rgb(${r * 255 | 0} ${g * 255 | 0} ${b * 255 | 0})`;

const palette = {};
const paletteListeners = [];
function readPalette() {
  palette.bg = token('--color-bg');
  palette.text = token('--color-text');
  palette.muted = token('--color-text-muted');
  palette.border = token('--color-border');
  palette.accent = token('--color-accent');
  palette.fx2 = token('--fx-2');
  palette.fx3 = token('--fx-3');
  palette.dark = palette.bg[0] + palette.bg[1] + palette.bg[2] < 1.5;
  for (const listener of paletteListeners) listener();
}

/** Resize a canvas to its CSS box (times a scale) and return true if it changed. */
function fitCanvas(canvas, scale) {
  const w = Math.max(1, Math.round(canvas.clientWidth * scale));
  const h = Math.max(1, Math.round(canvas.clientHeight * scale));
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w;
  canvas.height = h;
  return true;
}

/* ==========================================================================
   1. WebGL hero
   ========================================================================== */

const VERTEX = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

const FRAGMENT = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uKick;
uniform vec3 uBg;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;uniform float uDark;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);
  for(int i=0;i<5;i++){v+=a*noise(p);p=r*p*2.03;a*=.5;}return v;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec2 m=(uMouse-.5*uRes)/uRes.y;
  vec2 dm=uv-m;float d=length(dm);
  uv-=dm*(.4+uKick*1.5)*exp(-d*3.);
  float t=uTime*.1;
  vec2 q=vec2(fbm(uv*1.6+t),fbm(uv*1.6+vec2(5.2,1.3)-t));
  vec2 w=vec2(fbm(uv*1.6+4.*q+vec2(1.7,9.2)+t*1.4),fbm(uv*1.6+4.*q+vec2(8.3,2.8)-t*1.1));
  float f=fbm(uv*1.6+4.*w);
  float s=mix(.75,1.,uDark);
  vec3 col=uBg;
  col=mix(col,uC1,smoothstep(.3,.95,f)*s);
  col=mix(col,uC2,clamp(length(q)*1.1-.5,0.,1.)*s);
  col=mix(col,uC3,clamp(pow(w.x,3.)*2.4-.2,0.,1.)*.85*s);
  col=mix(col,uC2,exp(-d*7.)*(.25+uKick*1.2));
  gl_FragColor=vec4(col,1.);
}`;

function initHero(stage) {
  const canvas = stage?.querySelector('[data-hero-canvas]');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  const compile = (type, src) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  // One triangle that covers the whole screen.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const u = (name) => gl.getUniformLocation(program, name);
  const U = { res: u('uRes'), time: u('uTime'), mouse: u('uMouse'), kick: u('uKick'),
    bg: u('uBg'), c1: u('uC1'), c2: u('uC2'), c3: u('uC3'), dark: u('uDark') };

  const setColors = () => {
    gl.uniform3fv(U.bg, palette.bg);
    gl.uniform3fv(U.c1, palette.accent);
    gl.uniform3fv(U.c2, palette.fx2);
    gl.uniform3fv(U.c3, palette.fx3);
    gl.uniform1f(U.dark, palette.dark ? 1 : 0);
  };
  paletteListeners.push(setColors);
  setColors();

  // A low internal resolution is plenty for soft noise and keeps the GPU cool.
  const scale = Math.min(devicePixelRatio, 1.5) * 0.5;
  const mouse = { x: pointer.x, y: pointer.y };
  let kick = 0;

  stage.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('a, button, input, textarea')) kick = 1;
  });

  const isVisible = watch(stage);
  let ready = false;

  tasks.push((time) => {
    if (!isVisible()) return;
    if (fitCanvas(canvas, scale)) gl.viewport(0, 0, canvas.width, canvas.height);
    const rect = canvas.getBoundingClientRect();

    // Without a mouse, the "pointer" drifts on its own.
    const t = time / 1000;
    const tx = finePointer.matches && pointer.active ? pointer.x - rect.left : rect.width * (0.7 + 0.2 * Math.sin(t * 0.5));
    const ty = finePointer.matches && pointer.active ? pointer.y - rect.top : rect.height * (0.45 + 0.25 * Math.sin(t * 0.7));
    mouse.x = lerp(mouse.x, tx, 0.08);
    mouse.y = lerp(mouse.y, ty, 0.08);
    kick *= 0.94;

    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.time, t);
    gl.uniform2f(U.mouse, mouse.x * scale, (rect.height - mouse.y) * scale);
    gl.uniform1f(U.kick, kick);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!ready) { ready = true; canvas.classList.add('is-ready'); }
  });
}

/* ==========================================================================
   2. Kinetic title
   ========================================================================== */

function initTitle(title) {
  if (!title || !finePointer.matches) return;

  // Screen readers get the original text; the split copy is aria-hidden.
  const label = document.createElement('span');
  label.className = 'visually-hidden';
  label.textContent = title.textContent.replace(/\s+/g, ' ').trim();

  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  visual.append(...[...title.childNodes].map((node) => node.cloneNode(true)));

  /** Split every text node into words (no wrapping inside) and letters. */
  const split = (parent) => {
    for (const node of [...parent.childNodes]) {
      if (node.nodeType === Node.ELEMENT_NODE) { split(node); continue; }
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const fragment = document.createDocumentFragment();
      for (const part of node.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { fragment.append(' '); continue; }
        const word = document.createElement('span');
        word.className = 'fx-word';
        for (const char of part) {
          const span = document.createElement('span');
          span.className = 'fx-char';
          span.textContent = char;
          word.append(span);
        }
        fragment.append(word);
      }
      node.replaceWith(fragment);
    }
  };
  split(visual);
  title.replaceChildren(label, visual);

  const chars = [...visual.querySelectorAll('.fx-char')];
  let centers = [];
  const measure = () => {
    centers = chars.map((char) => {
      const r = char.getBoundingClientRect();
      return { x: r.left + r.width / 2 + scrollX, y: r.top + r.height / 2 + scrollY };
    });
  };
  measure();
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);

  const values = new Float32Array(chars.length);
  const isVisible = watch(title);
  const smooth = { x: pointer.x, y: pointer.y };

  tasks.push(() => {
    if (!isVisible()) return;
    smooth.x = lerp(smooth.x, pointer.x + scrollX, 0.15);
    smooth.y = lerp(smooth.y, pointer.y + scrollY, 0.15);
    const radius = Math.max(140, innerWidth * 0.12);
    chars.forEach((char, i) => {
      const c = centers[i];
      const d = Math.hypot(smooth.x - c.x, smooth.y - c.y);
      const f = pointer.active ? Math.max(0, 1 - d / radius) ** 2 : 0;
      const v = lerp(values[i], f, 0.2);
      if (Math.abs(v - values[i]) > 0.002 || (v === 0) !== (values[i] === 0)) {
        values[i] = v < 0.002 ? 0 : v;
        char.style.setProperty('--f', values[i].toFixed(3));
      }
    });
  });
}

/* ==========================================================================
   3. Scramble eyebrows
   ========================================================================== */

const GLYPHS = '!<>-_/[]{}=+*^?#%01ABCDEFX';

function scramble(element) {
  const text = element.textContent;
  const queue = [...text].map((char) => {
    const start = Math.random() * 14 | 0;
    return { char, start, end: start + 8 + (Math.random() * 18 | 0) };
  });
  let frame = 0;
  const tick = () => {
    let done = 0;
    const fragment = document.createDocumentFragment();
    for (const q of queue) {
      if (frame >= q.end || q.char === ' ') { done++; fragment.append(q.char); continue; }
      if (frame < q.start) { fragment.append(q.char); continue; }
      const glyph = document.createElement('span');
      glyph.className = 'fx-glyph';
      glyph.textContent = GLYPHS[Math.random() * GLYPHS.length | 0];
      fragment.append(glyph);
    }
    element.replaceChildren(fragment);
    frame++;
    if (done < queue.length) requestAnimationFrame(tick);
    else element.textContent = text;
  };
  tick();
}

function initScramble(elements) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      scramble(entry.target);
    }
  }, { threshold: 1 });
  for (const element of elements) observer.observe(element);
}

/* ==========================================================================
   4. Tilt cards  /  5. Magnetic buttons
   ========================================================================== */

function initTilt(cards, max) {
  if (!finePointer.matches) return;
  for (const card of cards) {
    card.addEventListener('pointermove', (event) => {
      const r = card.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width;
      const y = (event.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      card.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
      card.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  }
}

function initMagnetic(elements) {
  if (!finePointer.matches) return;
  for (const element of elements) {
    element.addEventListener('pointermove', (event) => {
      const r = element.getBoundingClientRect();
      const x = event.clientX - r.left - r.width / 2;
      const y = event.clientY - r.top - r.height / 2;
      element.style.translate = `${x * 0.25}px ${y * 0.35}px`;
    });
    element.addEventListener('pointerleave', () => { element.style.translate = ''; });
  }
}

/* ==========================================================================
   6. Marquee follows the scroll
   ========================================================================== */

function initMarquee(marquee) {
  if (!marquee || !marquee.getAnimations) return;
  const isVisible = watch(marquee);
  const rows = [...marquee.querySelectorAll('.fx-marquee__row')];
  let rate = 1;
  tasks.push(() => {
    if (!isVisible()) return;
    const direction = scrollVelocity < -0.5 ? -1 : 1;
    const target = direction * (1 + Math.min(Math.abs(scrollVelocity) * 0.12, 7));
    const next = lerp(rate, target, 0.1);
    if (Math.abs(next - rate) < 0.01) return;
    rate = next;
    for (const row of rows) for (const animation of row.getAnimations()) animation.playbackRate = rate;
  });
}

/* ==========================================================================
   7. Numbers: count-up + gooey blobs
   ========================================================================== */

function addGooFilter() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  // Blur, then a steep alpha curve: overlapping blurs merge like liquid.
  svg.innerHTML = '<filter id="fx-goo"><feGaussianBlur stdDeviation="22"/>'
    + '<feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 24 -10"/></filter>';
  document.body.append(svg);
}

function countUp(element) {
  const target = parseFloat(element.dataset.count);
  if (!Number.isFinite(target)) return;
  const decimals = (element.dataset.count.split('.')[1] ?? '').length;
  const start = performance.now();
  const tick = (now) => {
    const t = clamp((now - start) / 1600, 0, 1);
    const eased = 1 - (1 - t) ** 4;
    element.textContent = (target * eased).toFixed(decimals);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initNumbers(section) {
  if (!section) return;
  addGooFilter();

  const counter = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      counter.unobserve(entry.target);
      countUp(entry.target);
    }
  }, { threshold: 0.8 });
  for (const element of section.querySelectorAll('[data-count]')) counter.observe(element);

  const stage = section.querySelector('[data-fx-numbers-stage]');
  const blob = section.querySelector('[data-fx-cursor-blob]');
  if (!stage || !blob || !finePointer.matches) return;
  const isVisible = watch(stage);
  const pos = { x: 0, y: 0 };
  tasks.push(() => {
    if (!isVisible()) return;
    const r = stage.getBoundingClientRect();
    pos.x = lerp(pos.x, pointer.x - r.left, 0.1);
    pos.y = lerp(pos.y, pointer.y - r.top, 0.1);
    blob.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
  });
}

/* ==========================================================================
   8. Spring field  /  9. Spotlight text
   ========================================================================== */

function initSpot(spot) {
  if (!spot) return;
  const canvas = spot.querySelector('[data-fx-field]');
  const fill = spot.querySelector('[data-fx-spot-fill]');
  const ctx = canvas?.getContext('2d');
  const isVisible = watch(spot);

  let dots = [];
  let waves = [];
  let width = 0;
  let height = 0;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 2);
    if (!fitCanvas(canvas, dpr) && dots.length) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = width < 600 ? 22 : 28;
    dots = [];
    for (let y = gap / 2; y < height; y += gap) {
      for (let x = gap / 2; x < width; x += gap) dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
    }
  };

  spot.addEventListener('pointerdown', (event) => {
    const r = canvas.getBoundingClientRect();
    waves.push({ x: event.clientX - r.left, y: event.clientY - r.top, r: 0, s: 1 });
  });

  let colors = [];
  paletteListeners.push(() => { colors = [css(palette.border), css(palette.accent), css(palette.fx2)]; });
  colors = [css(palette.border), css(palette.accent), css(palette.fx2)];

  const light = { x: 0, y: 0, r: 0 };
  let hovering = false;
  spot.addEventListener('pointerenter', () => { hovering = true; });
  spot.addEventListener('pointerleave', () => { hovering = false; });

  tasks.push((time) => {
    if (!isVisible()) return;
    resize();
    const r = canvas.getBoundingClientRect();
    const t = time / 1000;
    const touchMode = !finePointer.matches;
    const mx = touchMode ? width * (0.5 + 0.38 * Math.sin(t * 0.8)) : pointer.x - r.left;
    const my = touchMode ? height * (0.5 + 0.3 * Math.sin(t * 1.3)) : pointer.y - r.top;

    // Spotlight
    light.x = lerp(light.x, mx, 0.15);
    light.y = lerp(light.y, my, 0.15);
    light.r = lerp(light.r, hovering || touchMode ? Math.min(220, width * 0.28) : 0, 0.1);
    fill.style.setProperty('--x', `${light.x}px`);
    fill.style.setProperty('--y', `${light.y}px`);
    fill.style.setProperty('--r', `${light.r}px`);

    // Springs
    ctx.clearRect(0, 0, width, height);
    for (const w of waves) { w.r += 10; w.s *= 0.975; }
    waves = waves.filter((w) => w.s > 0.05);

    const radius = 120;
    const paths = [new Path2D(), new Path2D(), new Path2D()];
    for (const p of dots) {
      if (hovering || touchMode) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < radius * radius) {
          const d = Math.sqrt(d2) || 1;
          const f = ((radius - d) / radius) * 2.4;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
      }
      for (const w of waves) {
        const wx = p.ox - w.x;
        const wy = p.oy - w.y;
        const wd = Math.hypot(wx, wy) || 1;
        const k = Math.abs(wd - w.r);
        if (k < 50) {
          const f = (1 - k / 50) * w.s * 4.5;
          p.vx += (wx / wd) * f;
          p.vy += (wy / wd) * f;
        }
      }
      p.vx = (p.vx + (p.ox - p.x) * 0.07) * 0.8;
      p.vy = (p.vy + (p.oy - p.y) * 0.07) * 0.8;
      p.x += p.vx;
      p.y += p.vy;
      const moved = Math.hypot(p.x - p.ox, p.y - p.oy);
      const size = 1.3 + Math.min(moved * 0.15, 5);
      const path = paths[moved > 14 ? 2 : moved > 2.5 ? 1 : 0];
      path.moveTo(p.x + size, p.y);
      path.arc(p.x, p.y, size, 0, Math.PI * 2);
    }
    paths.forEach((path, i) => { ctx.fillStyle = colors[i]; ctx.fill(path); });
  });
}

/* ==========================================================================
   Start
   ========================================================================== */

export function initEffects() {
  root.classList.add('has-fx');
  readPalette();

  // Re-read colours when the theme changes (toggle or OS setting).
  new MutationObserver(readPalette).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  systemDark.addEventListener('change', readPalette);

  addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.active = false; });

  initHero(document.querySelector('[data-hero]'));
  initTitle(document.querySelector('[data-fx-title]'));
  initScramble(document.querySelectorAll('.eyebrow'));
  initTilt(document.querySelectorAll('.skill-card'), 12);
  initTilt(document.querySelectorAll('.project-card'), 4);
  initMagnetic(document.querySelectorAll('.button'));
  initMarquee(document.querySelector('[data-fx-marquee]'));
  initNumbers(document.querySelector('[data-fx-numbers]'));
  initSpot(document.querySelector('[data-fx-spot]'));

  const loop = (time) => {
    const y = scrollY;
    scrollVelocity = lerp(scrollVelocity, y - lastScroll, 0.15);
    lastScroll = y;
    for (const task of tasks) task(time);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
