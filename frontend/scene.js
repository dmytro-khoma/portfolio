/**
 * scene.js — one particle cloud that lives behind the whole page (three.js).
 *
 * The same particles are re-used for every section. Each section has a
 * "shape" (a list of target positions); scrolling moves a morph value from
 * one shape to the next, so the cloud flows:
 *
 *   halo around the crystal (hero) → wave field (projects) → torus knot (skills)
 *   → loose cloud (about) → the words "Let’s talk" (contact)
 *
 * The hero also has a real lit object: a crystal made of separate shards
 * (the triangles of an icosphere) around a glowing core. Shards lift under
 * the pointer, a click blows them apart for a moment, and when the hero
 * scrolls out the crystal shatters while the particles take over.
 *
 * How it stays cheap
 *  - All movement happens in the vertex shader; JavaScript only sends a few
 *    uniforms per frame and never touches the particle buffers, except when
 *    the pair of shapes changes.
 *  - Shapes that belong to an element (orb, text) read that element's
 *    box every frame, so they scroll with the page like normal content.
 *  - Bloom runs only in the dark theme on devices with a mouse, and the
 *    scene lowers its own quality if the frame rate is poor.
 *
 * This file is loaded with import() by app.js, so three.js is a separate
 * chunk that never blocks the content.
 */

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Euler, IcosahedronGeometry, Matrix3, Matrix4,
  Mesh, NormalBlending, PerspectiveCamera, Points, Scene, ShaderMaterial, SRGBColorSpace,
  Vector2, Vector3, Vector4, WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { state, palette, onPalette, finePointer, lerp, clamp, root } from './state.js';

const FOV = 40;
const CAMERA_Z = 6;
/** World height of the screen at z = 0. */
const WORLD_H = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360);

/* ---- Shaders ------------------------------------------------------------- */

const VERTEX = /* glsl */ `
uniform float uTime, uMix, uPx, uMaxSize, uKick, uMouseStr, uFade;
uniform mat3 uRotA, uRotB;
uniform vec3 uPosA, uPosB;
uniform float uScaleA, uScaleB;
uniform vec4 uFxA, uFxB;            // x flow, y wave, z point size, w alpha
uniform vec3 uMouse;
uniform vec3 uC1, uC2, uC3;
attribute vec3 aTo;
attribute vec4 aRnd;
varying vec3 vColor;
varying float vAlpha;

// A shape in its own unit space, gently animated, then placed in the world.
vec3 place(vec3 p, vec4 fx, mat3 rot, vec3 pos, float scale) {
  float t = uTime;
  p += fx.x * vec3(sin(p.y * 3.1 + t), sin(p.z * 2.7 + t * 1.3 + p.x * 2.0), sin(p.x * 3.3 + t * 0.9));
  p.y += fx.y * (sin(p.x * 4.0 + t * 1.1) + sin(p.z * 5.0 - t * 1.4 + p.x * 1.5));
  return rot * p * scale + pos;
}

void main() {
  // Every particle starts its trip at a slightly different moment.
  float m = clamp(uMix * 1.6 - aRnd.x * 0.6, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);

  vec3 p = mix(place(position, uFxA, uRotA, uPosA, uScaleA), place(aTo, uFxB, uRotB, uPosB, uScaleB), m);

  // Half-way through a morph the cloud loosens a little.
  p += (aRnd.yzw - 0.5) * sin(m * 3.14159) * mix(uScaleA, uScaleB, m) * 0.12;

  // The pointer pushes particles away; a click widens the push (uKick).
  vec2 d = p.xy - uMouse.xy;
  float r = 0.5 + uKick * 1.3;
  float f = exp(-dot(d, d) / (r * r)) * (uMouseStr + uKick * 0.7);
  p.xy += normalize(d + vec2(1e-4)) * f * 0.45;
  p.z += f * 0.35;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(mix(uFxA.z, uFxB.z, m) * (0.55 + aRnd.y * 0.9) * uPx / -mv.z, uMaxSize);

  // Dimmer while a morph is half-way and while the page scrolls fast (uFade).
  vAlpha = mix(uFxA.w, uFxB.w, m) * (0.45 + aRnd.z * 0.55) * uFade * (1.0 - 0.45 * sin(m * 3.14159));
  vColor = mix(mix(uC1, uC2, smoothstep(0.55, 0.7, aRnd.w)), uC3, smoothstep(0.86, 0.92, aRnd.w));
  vColor = mix(vColor, uC2, clamp(f * 1.5, 0.0, 0.8));
}`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float a = smoothstep(0.5, 0.12, length(gl_PointCoord - 0.5)) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
  #include <colorspace_fragment>
}`;

/* ---- Crystal (hero) --------------------------------------------------------- */

const GEM_VERTEX = /* glsl */ `
uniform float uTime, uExplode, uPointer;
uniform vec3 uMouse;
attribute vec3 aCenter;   // centre of the shard this vertex belongs to
attribute vec3 aFace;     // flat normal of the shard
attribute vec3 aBary;     // barycentric corner, for the edge lines
attribute float aSeed;    // one random number per shard
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vBary;
varying float vSeed;

mat3 rotation(vec3 a, float angle) {
  float s = sin(angle), c = cos(angle), o = 1.0 - c;
  return mat3(
    o * a.x * a.x + c,       o * a.x * a.y + a.z * s, o * a.z * a.x - a.y * s,
    o * a.x * a.y - a.z * s, o * a.y * a.y + c,       o * a.y * a.z + a.x * s,
    o * a.z * a.x + a.y * s, o * a.y * a.z - a.x * s, o * a.z * a.z + c);
}

void main() {
  // How far this shard is pushed out: explosion + pointer + slow breathing.
  vec3 centre = (modelMatrix * vec4(aCenter, 1.0)).xyz;
  vec3 facing = mat3(modelMatrix) * aFace;
  float size = length(modelMatrix[0].xyz);
  vec2 d = centre.xy - uMouse.xy;
  float near = exp(-dot(d, d) / (0.22 * size * size + 1e-5)) * smoothstep(-0.1, 0.4, facing.z / size) * uPointer;
  float lift = uExplode * (0.25 + aSeed * 1.2) + near * 0.32 + (sin(uTime * 1.3 + aSeed * 40.0) * 0.5 + 0.5) * 0.03;

  // A lifted shard also tumbles around its own centre and gets smaller.
  mat3 spin = rotation(normalize(vec3(aSeed, 1.0 - aSeed, 0.5)), lift * (aSeed - 0.5) * 5.0);
  float shrink = 0.87 * (1.0 - smoothstep(0.9, 1.7, uExplode));
  vec3 p = aCenter + spin * (position - aCenter) * shrink + aFace * lift;

  vSeed = aSeed;
  vBary = aBary;
  vNormal = normalize(mat3(modelMatrix) * (spin * aFace));
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const GEM_FRAGMENT = /* glsl */ `
uniform float uTime, uTint, uShade, uSpec, uGlow, uInside, uEdgeMix;
uniform vec3 uC1, uC2, uC3, uBody, uEdge;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vBary;
varying float vSeed;
void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(vec3(-0.5, 0.8, 0.9));
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.0);

  // Every facet has its own tint, shifting with the angle and the time.
  float band = vSeed * 1.7 + dot(N, vec3(0.3, 0.8, 0.5)) * 0.6 + uTime * 0.05;
  vec3 film = mix(uC1, uC2, sin(band * 6.2832) * 0.5 + 0.5);
  film = mix(film, uC3, smoothstep(0.6, 1.0, sin(band * 9.0 + 2.0) * 0.5 + 0.5) * 0.5);

  float diffuse = dot(N, L) * 0.5 + 0.5;
  vec3 color = mix(uBody, film, uTint + fresnel * (1.0 - uTint)) * mix(uShade, 1.0, diffuse);
  color += pow(max(dot(reflect(-L, N), V), 0.0), 30.0) * uSpec;
  color += film * fresnel * uGlow;

  // A thin line along the edges of the shard.
  float b = min(min(vBary.x, vBary.y), vBary.z);
  float edge = 1.0 - smoothstep(0.02, 0.02 + fwidth(b) * 1.5, b);
  color = mix(color, uEdge, edge * uEdgeMix);

  if (!gl_FrontFacing) color *= uInside;
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`;

const CORE_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const CORE_FRAGMENT = /* glsl */ `
uniform vec3 uC2, uC3;
uniform float uGain;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(cameraPosition - vWorld)), 0.0), 1.5);
  gl_FragColor = vec4(mix(uC2, uC3, fresnel) * uGain, 1.0);
  #include <colorspace_fragment>
}`;

/** An icosphere whose triangles are separate shards, with per-shard attributes. */
function makeGemGeometry(detail) {
  const geometry = new IcosahedronGeometry(1, detail); // already one vertex set per triangle
  const position = geometry.getAttribute('position').array;
  const vertices = position.length / 3;
  const centre = new Float32Array(vertices * 3);
  const face = new Float32Array(vertices * 3);
  const bary = new Float32Array(vertices * 3);
  const seed = new Float32Array(vertices);

  for (let v = 0; v < vertices; v += 3) {
    const i = v * 3;
    const ax = position[i], ay = position[i + 1], az = position[i + 2];
    const bx = position[i + 3], by = position[i + 4], bz = position[i + 5];
    const cx = position[i + 6], cy = position[i + 7], cz = position[i + 8];
    // Flat normal: cross product of two edges.
    let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
    let ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    let nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const length = Math.hypot(nx, ny, nz) || 1;
    nx /= length; ny /= length; nz /= length;
    const random = Math.random();
    for (let k = 0; k < 3; k++) {
      const j = i + k * 3;
      centre[j] = (ax + bx + cx) / 3; centre[j + 1] = (ay + by + cy) / 3; centre[j + 2] = (az + bz + cz) / 3;
      face[j] = nx; face[j + 1] = ny; face[j + 2] = nz;
      bary[j + k] = 1;
      seed[v + k] = random;
    }
  }
  geometry.setAttribute('aCenter', new BufferAttribute(centre, 3));
  geometry.setAttribute('aFace', new BufferAttribute(face, 3));
  geometry.setAttribute('aBary', new BufferAttribute(bary, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seed, 1));
  return geometry;
}

/* ---- Shapes: N points each, in a unit space around the origin ------------- */

function makeShapes(count) {
  const make = (fn) => {
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) fn(out, i * 3, i);
    return out;
  };
  const rnd = Math.random;

  const orb = make((o, j, i) => {
    // Fibonacci sphere directions; a halo that is dense near the crystal and
    // thins out with the distance.
    const y = 1 - (2 * (i + 0.5)) / count;
    const ring = Math.sqrt(1 - y * y);
    const a = i * 2.39996323;
    const r = 1.02 + rnd() ** 2.6 * 0.62;
    o[j] = Math.cos(a) * ring * r; o[j + 1] = y * r; o[j + 2] = Math.sin(a) * ring * r;
  });

  const cols = Math.round(Math.sqrt(count * 2.6));
  const rows = Math.ceil(count / cols);
  const field = make((o, j, i) => {
    o[j] = ((i % cols) / (cols - 1) - 0.5) * 3.6;
    o[j + 1] = 0;
    o[j + 2] = -1 + (Math.floor(i / cols) / (rows - 1)) * 1.4;
  });

  const knot = make((o, j) => {
    const t = rnd() * Math.PI * 2;
    const tube = 0.13 * Math.sqrt(rnd());
    const a = rnd() * Math.PI * 2;
    const R = 2 + Math.cos(3 * t);
    o[j] = (R * Math.cos(2 * t)) / 3 + Math.cos(a) * tube;
    o[j + 1] = (R * Math.sin(2 * t)) / 3 + Math.sin(a) * tube;
    o[j + 2] = Math.sin(3 * t) / 3 + (rnd() - 0.5) * tube * 2;
  });

  const cloud = make((o, j) => {
    o[j] = (rnd() - 0.5) * 3.4; o[j + 1] = (rnd() - 0.5) * 2.2; o[j + 2] = -1.6 + rnd() * 2;
  });

  return [orb, field, knot, cloud, makeText(count, 'Let’s talk') ?? cloud];
}

/** Sample the filled pixels of a word; x spans -1..1. */
function makeText(count, text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const family = getComputedStyle(root).getPropertyValue('--font-serif') || 'Georgia, serif';
  const font = `italic 600 220px ${family}`;
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width);
  if (!width) return null;
  canvas.width = width + 40;
  canvas.height = 320;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 20, 160);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const filled = [];
  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      if (data[(y * canvas.width + x) * 4 + 3] > 128) filled.push(x, y);
    }
  }
  if (filled.length < 2) return null;

  const out = new Float32Array(count * 3);
  const half = width / 2;
  for (let i = 0; i < count; i++) {
    const k = (Math.random() * (filled.length / 2) | 0) * 2;
    out[i * 3] = (filled[k] + Math.random() * 2 - 20 - half) / half;
    out[i * 3 + 1] = -(filled[k + 1] + Math.random() * 2 - 160) / half;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
  }
  return out;
}

/* ---- Scene ---------------------------------------------------------------- */

/**
 * @returns {{ render: (seconds: number) => void } | null} null without WebGL.
 */
export function createScene() {
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-scene';
  canvas.setAttribute('aria-hidden', 'true');

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  document.body.prepend(canvas);

  const mobile = !finePointer.matches;
  const count = mobile ? 9000 : 20000;
  let pixelRatio = Math.min(devicePixelRatio, mobile ? 1.5 : 1.75);

  const scene = new Scene();
  scene.background = new Color();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.z = CAMERA_Z;

  const shapes = makeShapes(count);
  const geometry = new BufferGeometry();
  const from = new BufferAttribute(new Float32Array(shapes[0]), 3);
  const to = new BufferAttribute(new Float32Array(shapes[1]), 3);
  const random = new Float32Array(count * 4).map(() => Math.random());
  geometry.setAttribute('position', from);
  geometry.setAttribute('aTo', to);
  geometry.setAttribute('aRnd', new BufferAttribute(random, 4));

  const uniforms = {
    uTime: { value: 0 }, uMix: { value: 0 }, uPx: { value: 1 }, uMaxSize: { value: 16 },
    uKick: { value: 0 }, uMouseStr: { value: 0 }, uFade: { value: 1 },
    uRotA: { value: new Matrix3() }, uRotB: { value: new Matrix3() },
    uPosA: { value: new Vector3() }, uPosB: { value: new Vector3() },
    uScaleA: { value: 1 }, uScaleB: { value: 1 },
    uFxA: { value: new Vector4() }, uFxB: { value: new Vector4() },
    uMouse: { value: new Vector3() },
    uC1: { value: new Color() }, uC2: { value: new Color() }, uC3: { value: new Color() },
  };
  const material = new ShaderMaterial({
    uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT,
    transparent: true, depthTest: true, depthWrite: false,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  // The crystal shares the time, pointer and colour uniforms with the particles.
  const gemUniforms = {
    uTime: uniforms.uTime, uMouse: uniforms.uMouse,
    uC1: uniforms.uC1, uC2: uniforms.uC2, uC3: uniforms.uC3,
    uExplode: { value: 0 }, uPointer: { value: 0 },
    uBody: { value: new Color() }, uEdge: { value: new Color() },
    uTint: { value: 0.2 }, uShade: { value: 0.35 }, uSpec: { value: 0.5 },
    uGlow: { value: 0.6 }, uInside: { value: 0.35 }, uEdgeMix: { value: 0.9 },
  };
  const gem = new Mesh(makeGemGeometry(4), new ShaderMaterial({
    uniforms: gemUniforms, vertexShader: GEM_VERTEX, fragmentShader: GEM_FRAGMENT, side: DoubleSide,
  }));
  const coreUniforms = { uC2: uniforms.uC2, uC3: uniforms.uC3, uGain: { value: 1 } };
  const core = new Mesh(new IcosahedronGeometry(1, 5), new ShaderMaterial({
    uniforms: coreUniforms, vertexShader: CORE_VERTEX, fragmentShader: CORE_FRAGMENT,
  }));
  for (const mesh of [gem, core]) {
    mesh.renderOrder = -1;
    mesh.frustumCulled = false;
    scene.add(mesh);
  }

  /* -- Theme ---------------------------------------------------------------- */

  let composer = null;
  let bloomAllowed = !mobile;
  let useBloom = false;

  const applyPalette = () => {
    scene.background.setRGB(...palette.bg, SRGBColorSpace);
    uniforms.uC1.value.setRGB(...palette.accent, SRGBColorSpace);
    uniforms.uC2.value.setRGB(...palette.fx2, SRGBColorSpace);
    uniforms.uC3.value.setRGB(...palette.fx3, SRGBColorSpace);
    // Light adds up on a dark page; on a light page dots must cover instead.
    material.blending = palette.dark ? AdditiveBlending : NormalBlending;
    // Dark page: dark glass with glowing edges and a bright core.
    // Light page: pale porcelain facets with ink-blue edges.
    const dark = palette.dark;
    gemUniforms.uBody.value.setRGB(...(dark ? [0.04, 0.05, 0.09] : [0.99, 0.985, 0.975]), SRGBColorSpace);
    gemUniforms.uEdge.value.setRGB(...palette.accent, SRGBColorSpace);
    gemUniforms.uTint.value = dark ? 0.1 : 0.3;
    gemUniforms.uShade.value = dark ? 0.35 : 0.8;
    gemUniforms.uSpec.value = dark ? 0.5 : 0.2;
    gemUniforms.uGlow.value = dark ? 0.35 : 0;
    gemUniforms.uInside.value = dark ? 0.35 : 0.78;
    gemUniforms.uEdgeMix.value = dark ? 0.75 : 0.8;
    coreUniforms.uGain.value = dark ? 0.95 : 1;
    material.needsUpdate = true;
    useBloom = palette.dark && bloomAllowed;
  };
  onPalette(applyPalette);
  applyPalette();

  /* -- Size ----------------------------------------------------------------- */

  let vw = 1;
  let vh = 1;
  let worldW = 1;
  let unit = 1; // world units per CSS pixel

  const resize = () => {
    vw = canvas.clientWidth || innerWidth;
    vh = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(vw, vh, false);
    composer?.setSize(vw, vh);
    composer?.setPixelRatio(pixelRatio);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    unit = WORLD_H / vh;
    worldW = WORLD_H * camera.aspect;
    uniforms.uPx.value = (vh * pixelRatio) / (2 * Math.tan((FOV * Math.PI) / 360));
    uniforms.uMaxSize.value = 16 * pixelRatio;
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  /* -- Shape placement -------------------------------------------------------- */

  const anchors = {
    orb: document.querySelector('[data-fx-anchor="orb"]'),
    text: document.querySelector('[data-fx-anchor="text"]'),
  };
  const box = { x: 0, y: 0, w: 1, h: 1 };
  const measure = (element) => {
    if (!element) { box.x = 0; box.y = 0; box.w = worldW; box.h = WORLD_H; return box; }
    const r = element.getBoundingClientRect();
    box.x = (r.left + r.width / 2 - vw / 2) * unit;
    box.y = -(r.top + r.height / 2 - vh / 2) * unit;
    box.w = r.width * unit;
    box.h = r.height * unit;
    return box;
  };

  const euler = new Euler();
  const m4 = new Matrix4();
  const rotate = (target, x, y, z) => target.setFromMatrix4(m4.makeRotationFromEuler(euler.set(x, y, z)));
  const dim = mobile ? 0.5 : 1; // phones: the cloud sits behind text more often

  /** Each entry fills: rotation, position, scale, fx (flow, wave, size, alpha) and returns the pointer strength. */
  const place = [
    (t, rot, pos, fx) => { // orb
      const b = measure(anchors.orb);
      rotate(rot, 0.25, t * 0.16, 0.1);
      pos.set(b.x, b.y, 0);
      fx.set(0.05, 0, 0.03, 0.85);
      return [Math.min(b.w, b.h) * 0.4, 0.9];
    },
    (t, rot, pos, fx) => { // wave field: a floor of dots in the lower half
      rotate(rot, 0.22, 0, 0);
      pos.set(0, -WORLD_H * 0.36, 0);
      fx.set(0, 0.045, 0.03, 0.36 * dim);
      return [Math.max(worldW, WORLD_H * 0.9) * 0.62, 0.35];
    },
    (t, rot, pos, fx) => { // torus knot
      rotate(rot, t * 0.11 + scrollY * 0.0006, t * 0.17, 0);
      pos.set(0, 0, -1.2);
      fx.set(0.025, 0, 0.028, 0.6 * dim);
      return [Math.min(worldW, WORLD_H) * 0.52, 0.5];
    },
    (t, rot, pos, fx) => { // loose cloud
      rotate(rot, 0, t * 0.025, 0);
      pos.set(0, 0, 0);
      fx.set(0.03, 0, 0.03, 0.22 * dim);
      return [Math.max(worldW, WORLD_H) * 0.55, 0.35];
    },
    (t, rot, pos, fx) => { // "Let’s talk"
      const b = measure(anchors.text);
      rotate(rot, 0, Math.sin(t * 0.4) * 0.06, 0);
      pos.set(b.x, b.y, 0);
      fx.set(0.004, 0, 0.028, 1);
      return [b.w * 0.42, 1];
    },
  ];

  /* -- Frame ------------------------------------------------------------------ */

  let pair = 0;
  let fade = 1;
  let morph = 0;
  let last = 0;
  let frames = 0;
  let slowTime = 0;
  const mouse = { x: 0, y: 0 };

  const render = (seconds) => {
    const dt = Math.min(seconds - last, 0.1);
    last = seconds;

    // Morph: follow the scroll with a little inertia.
    const target = state.segments.reduce((sum, value) => sum + value, 0);
    morph = lerp(morph, target, 1 - Math.exp(-dt * 3.5));
    const index = clamp(Math.floor(morph), 0, shapes.length - 2);
    if (index !== pair) {
      pair = index;
      from.array.set(shapes[pair]);
      to.array.set(shapes[pair + 1]);
      from.needsUpdate = true;
      to.needsUpdate = true;
    }
    const mix = clamp(morph - pair, 0, 1);

    const [scaleA, mouseA] = place[pair](seconds, uniforms.uRotA.value, uniforms.uPosA.value, uniforms.uFxA.value);
    const [scaleB, mouseB] = place[pair + 1](seconds, uniforms.uRotB.value, uniforms.uPosB.value, uniforms.uFxB.value);
    uniforms.uScaleA.value = scaleA;
    uniforms.uScaleB.value = scaleB;
    // Additive light piles up fast, so the dark theme uses smaller, fainter dots.
    const sizeK = palette.dark ? 0.55 : 0.8;
    const alphaK = palette.dark ? 0.4 : 0.75;
    for (const fx of [uniforms.uFxA.value, uniforms.uFxB.value]) { fx.z *= sizeK; fx.w *= alphaK; }

    mouse.x = lerp(mouse.x, (state.pointer.x - vw / 2) * unit, 0.12);
    mouse.y = lerp(mouse.y, -(state.pointer.y - vh / 2) * unit, 0.12);
    uniforms.uMouse.value.set(mouse.x, mouse.y, 0);
    uniforms.uMouseStr.value = state.pointer.active ? lerp(mouseA, mouseB, mix) : 0;
    state.kick *= Math.exp(-dt * 2.4);
    uniforms.uKick.value = state.kick;
    // Fast scrolling: the cloud steps back quickly and returns slowly.
    const calm = 1 - clamp((Math.abs(state.velocity) - 6) / 40, 0, 0.8);
    fade = lerp(fade, calm, 1 - Math.exp(-dt * (calm < fade ? 10 : 2)));
    uniforms.uFade.value = fade;
    uniforms.uTime.value = seconds;
    uniforms.uMix.value = mix;

    // Crystal: sits in the hero box, leans to the pointer; a click bursts it,
    // and it shatters for good as the hero scrolls away.
    const stay = anchors.orb ? 1 - clamp(state.segments[0] * 1.3, 0, 1) : 0;
    gem.visible = core.visible = stay > 0.01;
    if (gem.visible) {
      const b = measure(anchors.orb);
      const size = Math.min(b.w, b.h) * 0.36;
      gem.position.set(b.x, b.y, 0);
      gem.scale.setScalar(size);
      gem.rotation.set(0.3 - mouse.y * 0.12, seconds * 0.14 + mouse.x * 0.14, 0.1);
      gemUniforms.uExplode.value = state.kick * 0.85 + (1 - stay) * 1.8;
      gemUniforms.uPointer.value = state.pointer.active ? 1 : 0;
      core.position.copy(gem.position);
      core.scale.setScalar(size * (0.34 + Math.sin(seconds * 1.6) * 0.02) * stay);
    }

    if (useBloom) {
      if (!composer) {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(new UnrealBloomPass(new Vector2(vw / 2, vh / 2), 0.55, 0.5, 0.2));
        composer.addPass(new OutputPass());
        composer.setPixelRatio(pixelRatio);
        composer.setSize(vw, vh);
      }
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    // Quality guard: after 2 s, if frames are slow, drop the costly parts.
    frames++;
    if (frames > 30) slowTime = dt > 0.034 ? slowTime + dt : Math.max(0, slowTime - dt * 0.5);
    if (slowTime > 1.5) {
      slowTime = 0;
      if (useBloom) { bloomAllowed = false; useBloom = false; }
      else if (pixelRatio > 1) { pixelRatio = 1; resize(); }
      else if (geometry.drawRange.count > count / 2) geometry.setDrawRange(0, Math.floor(count / 2));
    }
  };

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    root.classList.remove('has-scene');
  });

  root.classList.add('has-scene');
  return { render };
}
