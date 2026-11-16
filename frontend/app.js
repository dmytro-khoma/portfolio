/**
 * app.js — the effects layer: smooth scroll, scroll scenes and pointer toys.
 *
 * Loaded by main.js only when the visitor has not asked for reduced motion.
 * The page is complete without it; everything here is decoration on top of
 * normal HTML, and every decorative node it creates is aria-hidden.
 *
 *  1. Preloader      counts while the 3D chunk loads, then opens like a curtain
 *  2. Smooth scroll  Lenis, driven by the GSAP ticker; in-page links animate
 *  3. Hero           letters flip in; the block drifts away on scroll
 *  4. Headings       words rise when a section arrives; eyebrows "decode"
 *  5. About          the text lights up word by word; principles are pinned
 *  6. Skills         pinned section, cards travel sideways (wide screens)
 *  7. Numbers        count up
 *  8. Projects       cards stack; covers reveal; liquid hover (SVG filter)
 *  9. Particles      scroll positions feed the morphs of scene.js
 * 10. Pointer        magnetic buttons, tilt cards, marquee
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { state, root, finePointer, clamp, lerp, watchPalette } from './state.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @type {Lenis} */
let lenis;

/* ==========================================================================
   1. Preloader
   ========================================================================== */

/**
 * @param {Promise<unknown>} ready Resolves when the 3D scene has drawn a frame.
 * @returns {Promise<void>} Resolves when the curtain starts to open.
 */
function runPreloader(ready) {
  const element = $('[data-preloader]');
  if (!element || getComputedStyle(element).visibility === 'hidden') return Promise.resolve();

  const number = $('[data-preloader-count]', element);
  const bar = $('[data-preloader-bar]', element);
  const progress = { value: 0 };
  const draw = () => {
    number.textContent = String(Math.round(progress.value)).padStart(3, '0');
    bar.style.transform = `scaleX(${progress.value / 100})`;
  };

  lenis.stop();
  gsap.to(progress, { value: 82, duration: 1.1, ease: 'power2.out', onUpdate: draw });

  return Promise.race([ready, wait(4000)]).then(() => new Promise((resolve) => {
    gsap.timeline({ onComplete: () => element.classList.add('is-done') })
      .to(progress, { value: 100, duration: 0.45, ease: 'power2.inOut', onUpdate: draw, overwrite: true })
      .to('.preloader__content', { yPercent: -30, autoAlpha: 0, duration: 0.45, ease: 'power2.in' })
      .add(() => { lenis.start(); resolve(); })
      .to('.preloader__panel--top', { yPercent: -101, duration: 1, ease: 'expo.inOut' }, '<')
      .to('.preloader__panel--bottom', { yPercent: 101, duration: 1, ease: 'expo.inOut' }, '<');
  }));
}

/* ==========================================================================
   2. Smooth scroll
   ========================================================================== */

function initScroll() {
  lenis = new Lenis({ lerp: 0.11 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
    state.velocity = lenis.velocity; // the scene dims itself while this is high
  });
  gsap.ticker.lagSmoothing(0);

  // Lenis takes the mouse wheel; elements that scroll on their own keep it.
  for (const element of $$('textarea')) element.setAttribute('data-lenis-prevent', '');

  // In-page links: animate the scroll, keep the URL hash and move the focus
  // (the same result as the browser's own jump).
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
    const id = link.getAttribute('href').slice(1);
    const target = id && id !== 'top' ? document.getElementById(id) : null;
    if (id && id !== 'top' && !target) return;

    event.preventDefault();
    const header = $('.site-header')?.offsetHeight ?? 0;
    lenis.scrollTo(target ?? 0, { offset: -header - 8, duration: 1.3 });
    history.pushState(null, '', `#${id}`);
    if (target) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
}

/* ==========================================================================
   3. Hero
   ========================================================================== */

/** @returns {gsap.core.Timeline} Paused; played when the curtain opens. */
function initHero() {
  const title = $('[data-fx-title]');
  const timeline = gsap.timeline({ paused: true });
  if (!title) return timeline;

  // aria "auto": the <h1> gets the full sentence as its label and the
  // letter spans are hidden from screen readers.
  const split = SplitText.create(title, { type: 'words,chars', charsClass: 'fx-char', wordsClass: 'fx-word' });
  gsap.set(title, { perspective: 800 });

  timeline
    .from(split.chars, {
      yPercent: 70, rotateX: -85, autoAlpha: 0, transformOrigin: '50% 100%',
      duration: 1.1, ease: 'expo.out', stagger: 0.018,
    }, 0.1)
    .from('[data-intro]', { y: 28, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09 }, 0.45);

  // The whole block drifts up and fades as the hero scrolls away.
  gsap.to('.hero', {
    yPercent: -8, autoAlpha: 0.15, ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom 25%', scrub: true },
  });

  return timeline;
}

/* ==========================================================================
   4. Headings and eyebrows
   ========================================================================== */

function initHeadings() {
  for (const heading of $$('main h2')) {
    const split = SplitText.create(heading, { type: 'words', wordsClass: 'fx-word' });
    gsap.from(split.words, {
      yPercent: 90, rotate: 4, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
    });
  }
}

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

function initScramble() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      scramble(entry.target);
    }
  }, { threshold: 1 });
  for (const element of $$('.eyebrow')) observer.observe(element);
}

/* ==========================================================================
   5. About: words light up with the scroll
   ========================================================================== */

function initAbout(media) {
  const prose = $('#about .prose');
  if (prose) {
    // aria "none": the words stay readable for screen readers as they are.
    const split = SplitText.create($$('p:not(.eyebrow)', prose), { type: 'words', aria: 'none' });
    gsap.fromTo(split.words, { opacity: 0.16 }, {
      opacity: 1, ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: prose, start: 'top 72%', end: 'bottom 62%', scrub: 0.4 },
    });
  }

  // Principles: pinned full-screen, one big line at a time.
  const block = $('[data-principles]');
  const items = $$('.principles__item', block ?? document);
  if (!block || !items.length) return;

  media.add('(min-width: 48em) and (min-height: 36em)', () => {
    block.classList.add('is-pinned');
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: block, start: 'top top', end: () => `+=${innerHeight * 0.75 * items.length}`,
        pin: true, scrub: 0.5, anticipatePin: 1,
      },
    });
    items.forEach((item, index) => {
      const parts = [$('.principles__num', item), $('.principles__text', item)];
      if (index > 0) {
        timeline.fromTo(parts, { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out', stagger: 0.06 }, index);
      }
      if (index < items.length - 1) {
        timeline.to(parts, { y: -60, autoAlpha: 0, duration: 0.35, ease: 'power2.in', stagger: 0.04 }, index + 0.62);
      }
    });
    timeline.to('.principles__bar', { scaleY: 1, ease: 'none', duration: items.length - 1 + 0.5 }, 0);
    timeline.to({}, { duration: 0.5 });

    return () => {
      block.classList.remove('is-pinned');
      gsap.set($$('.principles__num, .principles__text, .principles__bar', block), { clearProps: 'all' });
    };
  });
}

/* ==========================================================================
   6. Skills: pinned, cards travel sideways
   ========================================================================== */

function initSkills(media) {
  const section = $('#skills');
  const track = $('.auto-grid', section ?? document);
  if (!section || !track) return;

  // Needs room: a wide and reasonably tall window. Otherwise it stays a grid.
  media.add('(min-width: 64em) and (min-height: 44em)', () => {
    section.classList.add('is-hscroll');
    const distance = () => Math.max(0, track.scrollWidth - track.parentElement.clientWidth);

    gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: section, start: 'top top', end: () => `+=${distance()}`,
        pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    gsap.to('.skills-progress__bar', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: 0.6 },
    });

    return () => {
      section.classList.remove('is-hscroll');
      gsap.set(track, { clearProps: 'transform' });
    };
  });
}

/* ==========================================================================
   7. Numbers
   ========================================================================== */

function initNumbers() {
  for (const element of $$('[data-count]')) {
    const target = parseFloat(element.dataset.count);
    if (!Number.isFinite(target)) continue;
    const decimals = (element.dataset.count.split('.')[1] ?? '').length;
    const value = { now: 0 };
    gsap.to(value, {
      now: target, duration: 1.8, ease: 'power4.out',
      onUpdate: () => { element.textContent = value.now.toFixed(decimals); },
      scrollTrigger: { trigger: element, start: 'top 85%', once: true },
    });
  }

  gsap.from('.numbers__item', {
    y: 50, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: '.numbers', start: 'top 82%', once: true },
  });
}

/* ==========================================================================
   8. Projects
   ========================================================================== */

function initProjects(media) {
  const items = $$('.project-list > li');

  for (const image of $$('.project-card__media img')) {
    gsap.fromTo(image, { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.25 }, {
      clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.3, ease: 'expo.out', clearProps: 'clipPath,scale',
      scrollTrigger: { trigger: image.closest('.project-card'), start: 'top 78%', once: true },
    });
  }

  // Wide + tall windows: cards stick under the header and stack; the one
  // below shrinks back as the next one slides over it.
  media.add('(min-width: 48em) and (min-height: 46em)', () => {
    root.classList.add('fx-stack');
    items.slice(0, -1).forEach((item, index) => {
      gsap.to($('.project-card', item), {
        scale: 0.93, filter: 'brightness(0.7)', ease: 'none',
        scrollTrigger: { trigger: items[index + 1], start: 'top 85%', end: 'top 15%', scrub: true },
      });
    });
    return () => root.classList.remove('fx-stack');
  });

  initLiquid($$('.project-card__media img'));
}

/** A shared SVG displacement filter: covers ripple like liquid on hover. */
function initLiquid(images) {
  if (!finePointer.matches || !images.length) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.classList.add('fx-defs');
  svg.innerHTML = '<filter id="fx-liquid" x="-5%" y="-5%" width="110%" height="110%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="3" result="noise"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>';
  document.body.append(svg);
  const turbulence = $('feTurbulence', svg);
  const displacement = $('feDisplacementMap', svg);
  const wave = { scale: 0, frequency: 0.012 };
  const apply = () => {
    displacement.setAttribute('scale', wave.scale.toFixed(1));
    turbulence.setAttribute('baseFrequency', `${wave.frequency.toFixed(4)} ${(wave.frequency * 1.7).toFixed(4)}`);
  };

  for (const image of images) {
    const host = image.closest('.project-card') ?? image;
    host.addEventListener('pointerenter', () => {
      image.classList.add('is-liquid');
      gsap.timeline({ onUpdate: apply, onComplete: () => image.classList.remove('is-liquid'), overwrite: true })
        .fromTo(wave, { scale: 0, frequency: 0.03 }, { scale: 46, frequency: 0.016, duration: 0.35, ease: 'power2.out' })
        .to(wave, { scale: 0, frequency: 0.006, duration: 0.9, ease: 'power3.out' });
    });
  }
}

/* ==========================================================================
   9. Particle morphs: scroll positions → state.segments (read by scene.js)
   ========================================================================== */

function initMorphs() {
  const steps = [
    ['[data-hero]', 'bottom 88%', 'bottom 25%'],          // orb → wave field
    ['#skills', 'top 85%', 'top 20%'],                    // field → torus knot
    ['#numbers', 'top 100%', 'top 55%'],                   // knot → ring
    ['#projects', 'top 50%', 'top 5%'],                    // ring → loose cloud
    ['[data-fx-anchor="text"]', 'top 98%', 'top 48%'],    // cloud → "Let’s talk"
  ];
  steps.forEach(([trigger, start, end], index) => {
    if (!$(trigger)) return;
    ScrollTrigger.create({
      trigger, start, end,
      onUpdate: (self) => { state.segments[index] = self.progress; },
      onRefresh: (self) => { state.segments[index] = self.progress; },
    });
  });
}

/* ==========================================================================
   10. Pointer: magnetic buttons, tilt cards, marquee
   ========================================================================== */

function initPointer() {
  addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
    state.pointer.active = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { state.pointer.active = false; });
  addEventListener('pointerdown', (event) => {
    if (!event.target.closest?.('a, button, input, textarea, summary, label')) state.kick = 1;
  });

  if (!finePointer.matches) return;

  // Magnetic buttons.
  for (const button of $$('.button')) {
    const x = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3' });
    const y = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3' });
    button.addEventListener('pointermove', (event) => {
      const r = button.getBoundingClientRect();
      x((event.clientX - r.left - r.width / 2) * 0.25);
      y((event.clientY - r.top - r.height / 2) * 0.35);
    });
    button.addEventListener('pointerleave', () => { x(0); y(0); });
  }

  // Tilt + a glow that follows the pointer (the CSS reads the variables).
  const tilt = (cards, max) => {
    for (const card of cards) {
      card.addEventListener('pointermove', (event) => {
        const r = card.getBoundingClientRect();
        const px = (event.clientX - r.left) / r.width;
        const py = (event.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.setProperty('--rx', `${(0.5 - py) * max}deg`);
        card.style.setProperty('--ry', `${(px - 0.5) * max}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    }
  };
  tilt($$('.skill-card'), 12);
  tilt($$('.project-card'), 3);
}

/** The CSS marquee speeds up and reverses with the scroll velocity. */
function initMarquee() {
  const marquee = $('[data-fx-marquee]');
  if (!marquee?.getAnimations) return;
  const rows = $$('.fx-marquee__row', marquee);
  let rate = 1;
  let visible = false;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(marquee);

  gsap.ticker.add(() => {
    if (!visible) return;
    const velocity = lenis.velocity;
    const target = (velocity < -0.5 ? -1 : 1) * (1 + Math.min(Math.abs(velocity) * 0.12, 7));
    const next = lerp(rate, target, 0.1);
    if (Math.abs(next - rate) < 0.01) return;
    rate = next;
    for (const row of rows) for (const animation of row.getAnimations()) animation.playbackRate = rate;
  });

  // The bands also slide against each other.
  gsap.to('.fx-marquee__band--a', { xPercent: -4, ease: 'none', scrollTrigger: { trigger: marquee, scrub: true } });
  gsap.to('.fx-marquee__band--b', { xPercent: 4, ease: 'none', scrollTrigger: { trigger: marquee, scrub: true } });
}

function initFooter() {
  const mark = $('.site-footer__mark');
  if (!mark) return;
  const split = SplitText.create(mark, { type: 'chars', aria: 'none' });
  gsap.from(split.chars, {
    yPercent: 60, autoAlpha: 0, ease: 'none', stagger: 0.06,
    scrollTrigger: { trigger: mark, start: 'top 100%', end: 'bottom 92%', scrub: 0.5 },
  });
}

/* ==========================================================================
   Start
   ========================================================================== */

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Give the browser a turn (input, paint) between two pieces of setup. */
const nextTask = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : wait(0));

export async function start() {
  root.classList.add('has-fx');
  watchPalette();
  initScroll();

  // three.js is its own chunk. The preloader waits for its first frame.
  const scene = hasWebGL()
    ? Promise.all([
      import('./scene.js'),
      // "Let’s talk" is sampled from a canvas, so its font must be ready.
      Promise.race([document.fonts.load('italic 600 220px Fraunces').catch(() => {}), wait(1500)]),
    ]).then(([module]) => {
      const instance = module.createScene();
      if (!instance) return;
      gsap.ticker.add((time) => instance.render(time));
      return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }).catch(() => {})
    : Promise.resolve();

  const media = gsap.matchMedia();
  const intro = initHero();
  const curtain = runPreloader(scene);

  // The rest is set up in small steps while the preloader counts, so no
  // single task blocks the main thread for long.
  const steps = [
    initPointer, initHeadings, initScramble, () => initAbout(media),
    () => initSkills(media), // pins: created before the triggers below it
    initNumbers, () => initProjects(media), initMorphs, initMarquee, initFooter,
    () => ScrollTrigger.sort(), () => ScrollTrigger.refresh(),
  ];
  for (const step of steps) {
    await nextTask();
    step();
  }

  await curtain;
  intro.play();
}
