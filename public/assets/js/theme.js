/**
 * theme.js — light / dark theme toggle.
 *
 * - By default the site follows the operating system (prefers-color-scheme).
 * - Clicking the toggle saves an explicit choice in localStorage and sets
 *   data-theme on <html>; tokens.css does the rest.
 * - The saved choice is applied before first paint by a tiny inline script
 *   in the <head>, so this module only handles changes.
 * - Where supported, the switch cross-fades with the View Transitions API.
 */

const STORAGE_KEY = 'theme';
const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** The theme currently on screen: an explicit choice, or the OS setting. */
function currentTheme() {
  return root.dataset.theme ?? (systemDark.matches ? 'dark' : 'light');
}

function save(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private mode, strict settings). The theme
    // still changes for this page view, it just is not remembered.
  }
}

/**
 * @param {HTMLButtonElement | null} button
 */
export function initTheme(button) {
  if (!button) return;

  const updateLabel = () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${next} theme`);
  };

  const apply = (theme) => {
    root.dataset.theme = theme;
    save(theme);
    updateLabel();
  };

  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';

    if (document.startViewTransition && !reducedMotion.matches) {
      document.startViewTransition(() => apply(next));
    } else {
      apply(next);
    }
  });

  // Keep the label correct if the OS theme changes while the page is open.
  systemDark.addEventListener('change', updateLabel);
  updateLabel();
}
