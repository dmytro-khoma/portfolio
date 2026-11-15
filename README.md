# Dmytro Khoma — Portfolio

**Live site:** https://dmytro-khoma-portfolio.onrender.com
(free hosting: the first visit after a quiet period can take up to a minute to wake the server)

A single-page portfolio: semantic HTML, modern CSS, vanilla
JavaScript (ES modules) and PHP 8 with no frameworks. It also includes a
small classic WordPress theme built on the same design system.

**Lighthouse (local, `php -S`):** Performance 100 · Accessibility 100 ·
Best Practices 100 · SEO 100, on both the mobile and the desktop preset.
LCP 1.2 s (mobile), CLS 0, Total Blocking Time 0 ms.

---

## Run it

Requirements: PHP 8.1+ with the `mbstring` extension (enabled by default on
most Linux and macOS installs).

```bash
cd public
php -S localhost:8000
```

Then open <http://localhost:8000>.

### Deploy

The repository includes a `Dockerfile` (PHP 8.4 + Apache, document root
`public/`) and a `render.yaml` blueprint for [Render](https://render.com):
connect the repository as a Blueprint and every push to `main` redeploys.
Behind a reverse proxy set `TRUST_PROXY=1`, so the client IP and HTTPS are
read from the `X-Forwarded-*` headers.

`public/` is the document root on purpose: `src/`, `data/` and `storage/`
(including the contact-message log) sit outside it, so the web server can
never serve them.

---

## Project structure

```
public/                    Document root
  index.php                Front controller: loads data, renders templates
  contact.php              Contact form endpoint (JSON or redirect)
  media.php                Serves the demo video with HTTP Range support
  assets/css/              Design system, one file per cascade layer
  assets/js/               ES modules, no dependencies
  assets/media/            Demo video, poster, captions (generated)
  assets/img/              Project covers: screenshots of the real apps (WebP)
src/
  bootstrap.php            Session, security headers, includes
  config.php               All personal and site settings
  helpers.php              e(), render(), CSRF, flash data, CSP nonce
  ContactForm.php          Normalising, validating and storing messages
  RateLimiter.php          File-based sliding-window rate limiter
  templates/               partials/, sections/, components/
data/
  projects.php             Projects, rendered by a card template
  skills.php               Skills, each pointing to its proof in the code
storage/                   Runtime data (git-ignored)
wordpress-theme/           Classic WordPress theme (see below)
tools/
  build-theme.php          Copies the shared CSS/JS into the theme
  make-demo-video.ps1      Generates the demo video with FFmpeg
```

---

## What each part shows

### CSS — `public/assets/css/`

| File | Layer | Contents |
|---|---|---|
| `tokens.css` | `tokens` | Layer order, colours, fluid type and space scales, light/dark themes |
| `reset.css` | `reset` | Small modern reset |
| `base.css` | `base` | Element defaults, focus ring, skip link, reduced motion |
| `layout.css` | `layout` | Container, stack, cluster, auto-grid, section grids |
| `components.css` | `components` | BEM components: header, nav, buttons, cards, video, player, form |
| `effects.css` | `effects` | Styles for the interactive effects (portfolio only, not in the theme) |
| `utilities.css` | `utilities` | `.visually-hidden`, reveal-on-scroll, small helpers |

- **Cascade layers** (`@layer`) make the priority order explicit, so there is
  no specificity fighting and almost no `!important` (only in the
  reduced-motion override, where it is the standard technique).
- **Design tokens** as custom properties; dark theme from
  `prefers-color-scheme`, overridable with the manual toggle.
- **Fluid typography and spacing** with `clamp()`, no breakpoints needed.
- **Large screens:** above 1920 px the root font size grows with the
  viewport (`max(100%, 100vw / 120)`), so on 2560 px or 4K screens the
  rem-based layout keeps the same proportions as on 1920 px instead of
  becoming a small column in the middle.
- **Container queries:** the featured project card switches to a two-column
  layout based on its own width; the player hides its volume slider on
  narrow players.
- **`:has()`:** form fields style their label when the input is invalid;
  the player keeps its controls visible while a control has keyboard focus;
  the page stops scrolling while the mobile menu is open.
- **Logical properties** throughout (`inline-size`, `margin-block`, …).
- **Native CSS nesting**, `aspect-ratio`, `scroll-snap` (project carousel on
  phones), `:user-invalid`, `color-mix()`, `text-wrap: balance`.
- **Scroll-driven animation** for the reading-progress bar, wrapped in
  `@supports` and `prefers-reduced-motion`, so other browsers just skip it.
- **View Transitions** for a cross-fade when switching theme.

Why is the CSS inlined? The whole stylesheet is small, so `inline_css()`
in `src/helpers.php` concatenates the six files into one `<style>` block.
That removes every render-blocking request, while the source stays split
into readable files.

### JavaScript — `public/assets/js/`

| Module | Purpose |
|---|---|
| `main.js` | Entry point; starts each feature only if its markup exists |
| `theme.js` | Theme toggle, `localStorage`, View Transitions |
| `nav.js` | Accessible mobile menu; current-section highlight (IntersectionObserver) |
| `reveal.js` | Reveal-on-scroll (IntersectionObserver), off for reduced motion |
| `video-facade.js` | Click-to-load video; prefetches player code near the viewport |
| `video-player.js` | The custom player (loaded on demand, not on page load) |
| `contact-form.js` | Validation, `fetch()` submission, error and success states |
| `effects.js` | The interactive effects (see below), loaded last with `import()` |

Everything works without JavaScript: the menu is always visible, the video
facade is a normal link to the file, and the form posts and redirects back
with server-side messages.

### Effects — `effects.js` + `effects.css`

A layer of interactive effects on top of the plain page, with no libraries:

| Effect | How it works |
|---|---|
| Hero background | Raw WebGL fragment shader: domain-warped fractal noise that bends around the pointer; a click sends a pulse |
| Kinetic headline | The `<h1>` is split into letters that lift and take the accent colour near the pointer |
| Scramble | Eyebrows decode from random glyphs when they scroll into view |
| Cards | 3D tilt and a glowing border that follows the pointer (masked gradient) |
| Magnetic buttons | Buttons lean a little towards the pointer |
| Marquee | A CSS animation; the Web Animations API changes its speed and direction with the scroll velocity |
| Numbers | Count-up, and "gooey" blobs merged by an SVG filter (blur + alpha threshold) |
| Contact | A canvas of dots on springs (a click sends a shock wave) and a gradient text spotlight |

How they stay cheap and safe:

- `main.js` loads `effects.js` with `import()` in `requestIdleCallback`, after
  the content has painted, so LCP, CLS and blocking time do not change.
- One `requestAnimationFrame` loop; each effect runs only while its element
  is on screen (IntersectionObserver). Per frame only `transform`,
  `opacity`, `clip-path`, custom properties and `<canvas>` change.
- Everything is scoped to `.has-fx` on `<html>`. Without JavaScript, or with
  "reduce motion" (the module is not even downloaded), the page is the
  plain version.
- Colours come from the design tokens and are re-read when the theme
  changes. The split headline keeps the original text for screen readers;
  decorative parts are `aria-hidden`.
- Works under the strict CSP: no inline styles or scripts, only CSSOM.

### Video — the "mini player"

1. **Facade.** On page load there is only a poster image and a play button.
   No player code and no video bytes are downloaded.
2. **Prefetch.** When the facade comes near the viewport, an
   IntersectionObserver fetches the player module (code only, a few KB).
3. **Player.** On click, `video-player.js` clones a `<template>` around a
   new `<video>` with WebM and MP4 sources and a WebVTT captions track.

Controls: play/pause, seek bar with buffered range, time, mute, volume,
playback speed, captions, fullscreen (with an iOS fallback). All are native
`<button>` or `<input type="range">` elements with ARIA labels that stay in
sync; the seek bar has a readable `aria-valuetext`, and speed, mute and
caption changes are announced through a live region.

Keyboard: `Space`/`K` play, `←`/`→` ±5 s, `J`/`L` ±10 s, `↑`/`↓` volume,
`M` mute, `C` captions, `<`/`>` speed, `F` fullscreen, `0`–`9` jump,
`Home`/`End`.

**`media.php`:** browsers seek by requesting byte ranges. Apache and Nginx
support that for static files, but `php -S` always answers `200` with the
whole file, so seeking would break. `media.php` serves the whitelisted demo
files with correct `206 Partial Content` / `416` responses. On a real
server you can point the sources in `src/config.php` at the files directly.

The demo video is generated from FFmpeg test sources by
`tools/make-demo-video.ps1`, so the repository contains no third-party media.

### PHP

- **Templates:** `render()` gives each template an isolated scope;
  `header`/`footer` partials, one template per section, and a
  `project-card` component rendered from `data/projects.php`.
- **Escaping:** every value is printed through `e()`
  (`htmlspecialchars` with `ENT_QUOTES | ENT_SUBSTITUTE`).
- **Security headers:** a nonce-based Content Security Policy (no
  `unsafe-inline`), `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, COOP, and HSTS on HTTPS. The
  session cookie is `HttpOnly` and `SameSite=Lax`, with strict mode on.
- **`contact.php`:** POST only → CSRF token (`hash_equals`) → honeypot
  (bots get a fake success) → rate limit (3 messages per 10 minutes per IP,
  `429` + `Retry-After`) → normalise and validate → append to
  `storage/messages.log` as JSON lines (no e-mail is sent). Replies with
  JSON and a proper status code for `fetch()`, or a `303` redirect with
  flash data for normal form posts.

### WordPress — `wordpress-theme/`

A minimal but complete classic theme (WordPress 6.5+, PHP 8.0+):

- `style.css` theme header; styles are loaded from `assets/css/`.
- `functions.php`: theme supports, a menu location, assets enqueued with
  `wp_enqueue_style()` and `wp_enqueue_script_module()`, versioned by file
  modification time; the theme-init script is printed with
  `wp_print_inline_script_tag()` so CSP plugins can add a nonce.
- Templates: `header.php`, `footer.php`, `index.php`, `single.php`,
  `page.php`, `front-page.php`, and `template-parts/`.
- **Shortcode** (`inc/video-demo-shortcode.php`):

  ```
  [video_demo url="https://example.com/video.mp4" poster="https://example.com/poster.jpg" title="Product tour" captions="https://example.com/captions.vtt"]
  ```

  It validates the URL and file type, outputs the same facade markup as the
  portfolio, and prints the player template in the footer only on pages
  that use it. Editors see a hint if the URL is missing; visitors see
  nothing.

The theme reuses the site's design system. After changing shared CSS or
JS, run `php tools/build-theme.php` to copy it into the theme. To install,
copy `wordpress-theme/` into `wp-content/themes/dk-portfolio/` and
activate it.

### Performance and accessibility checklist

- No frameworks, no web fonts (system font stacks), no render-blocking
  requests; ES modules are deferred and preloaded.
- Images have `width`/`height` (no layout shift) and `loading="lazy"`.
- The video player is loaded only on demand.
- Landmarks (`header`, `nav`, `main`, `footer`), one `h1`, labelled
  sections, skip link, visible `:focus-visible` ring, 44 px touch targets,
  colour contrast checked for both themes, `prefers-reduced-motion`
  respected in CSS and JS.
- `public/.htaccess` adds compression and cache headers on Apache.

---

## Related projects

- [Cyberpunk combat tracker](https://github.com/dmytro-khoma/cyberpunk-combat-tracker) (Django) ·
  [live demo](https://cyberpunk-combat-tracker.onrender.com)
- [Dinosauria](https://github.com/dmytro-khoma/dinosauria) (HTML, CSS, JavaScript) ·
  [live demo](https://dmytro-khoma.github.io/dinosauria/)
