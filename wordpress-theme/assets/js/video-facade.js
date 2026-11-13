/**
 * video-facade.js — click-to-load video.
 *
 * A full video player on page load costs code, network requests and video
 * bytes, even for visitors who never press play. A facade avoids that:
 * the page shows a poster image and a play button, and the real player is
 * created only when the visitor asks for it. This is the same idea video
 * player plugins use to keep pages fast.
 *
 * Loading happens in two steps:
 * 1. When a facade comes near the viewport, the player *code* is fetched
 *    in the background (IntersectionObserver), so the click feels instant.
 *    No video data is downloaded yet.
 * 2. On click, the player is built and starts playing.
 *
 * Without JavaScript the facade is a normal link to the video file.
 */

let playerModule = null;

/** Import the player module once and reuse the same promise. */
function loadPlayer() {
  playerModule ??= import('./video-player.js');
  return playerModule;
}

/**
 * @param {NodeListOf<HTMLElement>} containers
 */
export function initVideoFacades(containers) {
  if (containers.length === 0) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadPlayer().catch(() => {}); // a failed prefetch is retried on click
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    for (const container of containers) observer.observe(container);
  }

  for (const container of containers) {
    const facade = container.querySelector('.video__facade');
    if (!facade) continue;

    facade.addEventListener('click', async (event) => {
      // Let modified clicks (new tab, download) keep their normal behaviour.
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      facade.setAttribute('aria-busy', 'true');

      try {
        const { createPlayer } = await loadPlayer();
        createPlayer(container, { autoplay: true });
      } catch {
        // If the module cannot load, fall back to the browser's own player.
        playerModule = null;
        window.location.assign(facade.href);
      }
    });
  }
}
