/**
 * theme-main.js — entry point for the WordPress theme.
 *
 * Reuses the portfolio site's modules (copied into this folder by
 * tools/build-theme.php). The contact form is not included: on WordPress
 * a form plugin or a REST endpoint would handle that instead.
 */

import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initVideoFacades } from './video-facade.js';

initTheme(document.querySelector('[data-theme-toggle]'));
initNav(document.querySelector('[data-nav-toggle]'));
initReveal(document.querySelectorAll('.reveal'));
initVideoFacades(document.querySelectorAll('[data-video]'));
