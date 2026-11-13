/**
 * reveal.js — fade elements in as they scroll into view.
 *
 * The CSS only hides .reveal elements after this module sets data-reveal on
 * <html>. So if JS fails, or the user prefers reduced motion, or the
 * browser lacks IntersectionObserver, content is simply always visible.
 */

/**
 * @param {NodeListOf<Element>} elements
 */
export function initReveal(elements) {
  if (
    elements.length === 0 ||
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // animate once, then stop watching
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  for (const element of elements) observer.observe(element);
  document.documentElement.setAttribute('data-reveal', '');
}
