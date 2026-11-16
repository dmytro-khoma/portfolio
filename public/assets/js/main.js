/**
 * main.js — entry point.
 *
 * Loaded with <script type="module">, so it is deferred automatically and
 * runs after the HTML is parsed. Each feature lives in its own small module
 * and only starts if its markup exists on the page.
 *
 * The effects layer (three.js, GSAP, Lenis) is not part of this file: it is
 * a separate bundle built by Vite from frontend/ (see header.php). This
 * entry point stays small and works on its own.
 */

import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initContactForm } from './contact-form.js';

initTheme(document.querySelector('[data-theme-toggle]'));
initNav(document.querySelector('[data-nav-toggle]'));
initReveal(document.querySelectorAll('.reveal'));
initContactForm(document.querySelector('[data-contact-form]'));
