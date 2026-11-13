/**
 * main.js — entry point.
 *
 * Loaded with <script type="module">, so it is deferred automatically and
 * runs after the HTML is parsed. Each feature lives in its own small module
 * and only starts if its markup exists on the page. The heavy part (the
 * video player) is not imported here; video-facade.js loads it on demand.
 */

import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initVideoFacades } from './video-facade.js';
import { initContactForm } from './contact-form.js';

initTheme(document.querySelector('[data-theme-toggle]'));
initNav(document.querySelector('[data-nav-toggle]'));
initReveal(document.querySelectorAll('.reveal'));
initVideoFacades(document.querySelectorAll('[data-video]'));
initContactForm(document.querySelector('[data-contact-form]'));
