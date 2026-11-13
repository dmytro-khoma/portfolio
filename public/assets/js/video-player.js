/**
 * video-player.js — a small custom player around the native <video>.
 *
 * The browser still does the hard work (decoding, buffering, captions,
 * fullscreen). This module only adds a consistent, accessible UI:
 *
 *   play/pause · seek bar with buffer indicator · time · mute + volume
 *   playback speed · captions · fullscreen · keyboard shortcuts
 *
 * Accessibility
 * - Every control is a native <button> or <input type="range">.
 * - Buttons keep their aria-label / aria-pressed in sync with the state.
 * - The seek bar exposes a human-readable aria-valuetext ("0:12 of 0:30").
 * - Changes that are not visible from focus (speed, captions, mute) are
 *   announced through a polite live region.
 *
 * The UI markup comes from <template id="player-template"> in the page,
 * so this file contains behaviour only.
 */

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SEEK_STEP = 5;      // seconds, arrow keys
const SEEK_JUMP = 10;     // seconds, J / L
const VOLUME_STEP = 0.1;
const IDLE_DELAY = 2500;  // ms before controls fade out while playing

/** 75.4 -> "1:15", 3725 -> "1:02:05" */
export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');

  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/**
 * Replace a facade with a working player.
 *
 * @param {HTMLElement} container Element with data-sources, data-poster,
 *                                data-captions and data-title.
 * @param {{ autoplay?: boolean }} [options]
 */
export function createPlayer(container, { autoplay = false } = {}) {
  const template = document.getElementById('player-template');
  if (!(template instanceof HTMLTemplateElement)) {
    throw new Error('Player template #player-template is missing.');
  }

  /* ---- Build the DOM ---------------------------------------------------- */

  const player = template.content.firstElementChild.cloneNode(true);
  const video = buildVideo(container);
  player.prepend(video);

  /** @type {Record<string, HTMLElement>} */
  const ui = {};
  for (const el of player.querySelectorAll('[data-player]')) ui[el.dataset.player] = el;

  container.querySelector('.video__facade')?.replaceWith(player);

  const track = video.textTracks[0] ?? null;
  if (track) track.mode = 'hidden';
  else ui.captions.hidden = true;

  const canFullscreen = Boolean(player.requestFullscreen || video.webkitEnterFullscreen);
  if (!canFullscreen) ui.fullscreen.hidden = true;

  /* ---- Helpers ---------------------------------------------------------- */

  const announce = (text) => {
    ui.status.textContent = text;
  };

  const togglePlay = () => {
    if (video.paused || video.ended) {
      video.play().catch(() => announce('Playback was blocked by the browser. Press play to start.'));
    } else {
      video.pause();
    }
  };

  const seekBy = (delta) => {
    if (!Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), video.duration);
  };

  const seekToFraction = (fraction) => {
    if (Number.isFinite(video.duration)) video.currentTime = fraction * video.duration;
  };

  const setVolume = (value) => {
    video.volume = Math.min(Math.max(value, 0), 1);
    video.muted = video.volume === 0;
  };

  const toggleMute = () => {
    if (video.muted && video.volume === 0) video.volume = 0.5;
    video.muted = !video.muted;
    announce(video.muted ? 'Muted' : 'Sound on');
  };

  const changeSpeed = (direction) => {
    const index = SPEEDS.indexOf(video.playbackRate);
    const nextIndex = index === -1
      ? SPEEDS.indexOf(1)
      : direction === 0
        ? (index + 1) % SPEEDS.length                          // button: cycle
        : Math.min(Math.max(index + direction, 0), SPEEDS.length - 1); // keys: step
    video.playbackRate = SPEEDS[nextIndex];
  };

  const toggleCaptions = () => {
    if (!track) return;
    const on = track.mode !== 'showing';
    track.mode = on ? 'showing' : 'hidden';
    ui.captions.setAttribute('aria-pressed', String(on));
    announce(on ? 'Captions on' : 'Captions off');
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (player.requestFullscreen) {
      player.requestFullscreen().catch(() => announce('Fullscreen is not available.'));
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen(); // iOS Safari: native fullscreen player
    }
  };

  /* ---- Sync UI with the media state ------------------------------------- */

  let isScrubbing = false; // true while the seek bar is being dragged

  const renderTime = () => {
    const { currentTime, duration } = video;
    const percent = duration ? (currentTime / duration) * 100 : 0;

    if (!isScrubbing) ui.seek.value = String(percent);
    player.style.setProperty('--player-progress', `${percent}%`);
    ui.current.textContent = formatTime(currentTime);
    ui.seek.setAttribute('aria-valuetext', `${formatTime(currentTime)} of ${formatTime(duration)}`);
  };

  const renderBuffered = () => {
    const { buffered, duration } = video;
    if (!duration || buffered.length === 0) return;
    const end = buffered.end(buffered.length - 1);
    player.style.setProperty('--player-buffered', `${(end / duration) * 100}%`);
  };

  const renderPlayState = () => {
    const playing = !video.paused && !video.ended;
    player.dataset.state = playing ? 'playing' : 'paused';
    ui.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    if (!playing) showControls();
  };

  const renderVolume = () => {
    const level = video.muted ? 0 : video.volume;
    ui.volume.value = String(level);
    ui.volume.setAttribute('aria-valuetext', `${Math.round(level * 100)}%`);
    player.style.setProperty('--player-volume', `${level * 100}%`);
    player.toggleAttribute('data-muted', level === 0);
    ui.mute.setAttribute('aria-label', level === 0 ? 'Unmute' : 'Mute');
  };

  const renderSpeed = () => {
    const rate = video.playbackRate;
    ui.speed.textContent = `${rate}×`;
    ui.speed.setAttribute('aria-label', `Playback speed: ${rate}×`);
  };

  const renderFullscreen = () => {
    const active = document.fullscreenElement === player;
    player.toggleAttribute('data-fullscreen', active);
    ui.fullscreen.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  };

  /* ---- Auto-hide controls while playing --------------------------------- */

  let idleTimer = 0;
  function showControls() {
    player.removeAttribute('data-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!video.paused) player.setAttribute('data-idle', '');
    }, IDLE_DELAY);
  }

  /* ---- Events: media ---------------------------------------------------- */

  video.addEventListener('play', renderPlayState);
  video.addEventListener('pause', renderPlayState);
  video.addEventListener('ended', renderPlayState);
  video.addEventListener('timeupdate', renderTime);
  video.addEventListener('progress', renderBuffered);
  video.addEventListener('volumechange', renderVolume);
  video.addEventListener('ratechange', () => {
    renderSpeed();
    announce(`Speed ${video.playbackRate}×`);
  });
  video.addEventListener('loadedmetadata', () => {
    ui.duration.textContent = formatTime(video.duration);
    renderTime();
  });
  video.addEventListener('error', () => announce('Sorry, the video could not be loaded.'));
  document.addEventListener('fullscreenchange', renderFullscreen);

  /* ---- Events: controls ------------------------------------------------- */

  ui.play.addEventListener('click', togglePlay);
  ui.mute.addEventListener('click', toggleMute);
  ui.speed.addEventListener('click', () => changeSpeed(0));
  ui.captions.addEventListener('click', toggleCaptions);
  ui.fullscreen.addEventListener('click', toggleFullscreen);
  ui.volume.addEventListener('input', () => setVolume(Number(ui.volume.value)));

  // While the user drags the seek bar, timeupdate must not move it back.
  ui.seek.addEventListener('pointerdown', () => { isScrubbing = true; });
  ui.seek.addEventListener('change', () => { isScrubbing = false; }); // fires on release
  ui.seek.addEventListener('input', () => seekToFraction(Number(ui.seek.value) / 100));

  video.addEventListener('click', () => {
    togglePlay();
    player.focus({ preventScroll: true }); // so keyboard shortcuts work next
  });
  video.addEventListener('dblclick', toggleFullscreen);

  player.addEventListener('pointermove', showControls);
  player.addEventListener('focusin', showControls);

  /* ---- Events: keyboard ------------------------------------------------- */

  player.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const target = event.target;
    const onButton = target instanceof HTMLButtonElement;
    const onVolume = target === ui.volume;

    // Buttons already react to Space and Enter natively.
    if (onButton && (event.key === ' ' || event.key === 'Enter')) return;

    let handled = true;

    switch (event.key) {
      case ' ':
      case 'k':
      case 'K':
        togglePlay();
        break;
      case 'ArrowLeft':
        if (onVolume) handled = false;
        else seekBy(-SEEK_STEP);
        break;
      case 'ArrowRight':
        if (onVolume) handled = false;
        else seekBy(SEEK_STEP);
        break;
      case 'j':
      case 'J':
        seekBy(-SEEK_JUMP);
        break;
      case 'l':
      case 'L':
        seekBy(SEEK_JUMP);
        break;
      case 'ArrowUp':
        if (onVolume) handled = false;
        else setVolume((video.muted ? 0 : video.volume) + VOLUME_STEP);
        break;
      case 'ArrowDown':
        if (onVolume) handled = false;
        else setVolume((video.muted ? 0 : video.volume) - VOLUME_STEP);
        break;
      case 'Home':
        seekToFraction(0);
        break;
      case 'End':
        seekToFraction(1);
        break;
      case 'm':
      case 'M':
        toggleMute();
        break;
      case 'c':
      case 'C':
        toggleCaptions();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case '<':
        changeSpeed(-1);
        break;
      case '>':
        changeSpeed(1);
        break;
      default:
        if (/^[0-9]$/.test(event.key)) seekToFraction(Number(event.key) / 10);
        else handled = false;
    }

    if (handled) {
      event.preventDefault();
      showControls();
    }
  });

  /* ---- Start ------------------------------------------------------------ */

  renderPlayState();
  renderVolume();
  renderSpeed();

  if (autoplay) {
    ui.play.focus({ preventScroll: true }); // keep keyboard users in place
    togglePlay();
  }

  return { player, video };
}

/**
 * Create the <video> element with its sources and captions track.
 *
 * @param {HTMLElement} container
 * @returns {HTMLVideoElement}
 */
function buildVideo(container) {
  const video = document.createElement('video');
  video.className = 'player__video';
  video.playsInline = true;
  video.preload = 'metadata';
  video.poster = container.dataset.poster ?? '';
  video.setAttribute('aria-label', container.dataset.title ?? 'Video');

  const sources = JSON.parse(container.dataset.sources ?? '[]');
  for (const { src, type } of sources) {
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    video.append(source);
  }

  if (container.dataset.captions) {
    const track = document.createElement('track');
    track.kind = 'captions';
    track.srclang = 'en';
    track.label = 'English';
    track.src = container.dataset.captions;
    video.append(track);
  }

  return video;
}
