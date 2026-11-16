/**
 * main.js — entry of the effects bundle (built by Vite).
 *
 * It is tiny on purpose: it only decides whether the heavy part should load
 * at all. Visitors who prefer reduced motion never download three.js, GSAP
 * or Lenis and get the plain, static page.
 */

const root = document.documentElement;

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  import('./app.js')
    .then((module) => module.start())
    .catch(() => {
      // The page works without effects: remove the preloader and show it.
      root.classList.add('fx-failed');
      root.classList.remove('has-fx');
    });
}
