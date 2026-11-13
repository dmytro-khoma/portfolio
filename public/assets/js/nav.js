/**
 * nav.js — accessible mobile navigation and current-section highlight.
 *
 * Menu (small screens only, the CSS hides the toggle on wide screens):
 * - The toggle is a real <button> with aria-expanded and aria-controls.
 * - Escape closes the menu and returns focus to the toggle.
 * - Choosing a link, clicking outside, or tabbing out also closes it.
 *
 * Current section: an IntersectionObserver marks the link of the section
 * in the middle of the viewport with aria-current="true".
 */

const WIDE_SCREEN = window.matchMedia('(min-width: 48em)');

/**
 * @param {HTMLButtonElement | null} toggle
 */
export function initNav(toggle) {
  if (!toggle) return;

  const list = document.getElementById(toggle.getAttribute('aria-controls'));
  if (!list) return;

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open, { returnFocus = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    list.classList.toggle('is-open', open);
    if (!open && returnFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  // Close after choosing a link (the page scrolls to the section).
  list.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) setOpen(false, { returnFocus: true });
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && !list.contains(event.target) && !toggle.contains(event.target)) {
      setOpen(false);
    }
  });

  // Tabbing past the last link closes the menu.
  list.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (isOpen() && next && !list.contains(next) && next !== toggle) setOpen(false);
  });

  // Rotating a phone to landscape can switch to the wide layout.
  WIDE_SCREEN.addEventListener('change', () => setOpen(false));

  highlightCurrentSection(list);
}

/**
 * @param {HTMLElement} list
 */
function highlightCurrentSection(list) {
  if (!('IntersectionObserver' in window)) return;

  const links = new Map();
  for (const link of list.querySelectorAll('a[href^="#"]')) {
    const section = document.getElementById(link.hash.slice(1));
    if (section) links.set(section, link);
  }

  // The "active" zone is a thin band in the middle of the viewport.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links.values()) link.removeAttribute('aria-current');
        links.get(entry.target)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );

  for (const section of links.keys()) observer.observe(section);
}
