# Dmytro Khoma — Portfolio

**Live site:** https://dmytro-khoma-portfolio.onrender.com
(free hosting: the first visit after a quiet period can take up to a minute to wake the server)

A single-page portfolio: semantic HTML, modern CSS, JavaScript (ES modules)
and PHP 8, with an effects layer on top: a three.js particle scene that
morphs from section to section, GSAP ScrollTrigger scenes and Lenis smooth
scrolling, bundled with Vite. It also includes a small classic WordPress
theme built on the same design system.

**Measured locally (Chrome, Performance API, laptop, 2026-11-16):** CLS 0,
Total Blocking Time 0–11 ms over three runs. The effects are loaded after the
content in separate chunks, and not at all with "reduce motion".

---

## Run it

Requirements: PHP 8.1+ with the `mbstring` extension (enabled by default on
most Linux and macOS installs).

```bash
npm install        # once: three.js, GSAP, Lenis, Vite
npm run build      # builds frontend/ into public/assets/build/
php -S localhost:8000 -t public
```

Then open <http://localhost:8000>. The site also runs without the build
step (and without Node): it is then the plain page with no effects layer.
Run `npm run build` again after changing anything in `frontend/`.

### Deploy

The repository includes a two-stage `Dockerfile` (Node builds the Vite
bundle, then PHP 8.4 + Apache serves it; document root `public/`) and a
`render.yaml` blueprint for [Render](https://render.com):
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
  assets/build/            Vite output (git-ignored, built in Docker)
  assets/media/            Demo video, poster, captions (generated)
  assets/fonts/            Fraunces (headings), self-hosted woff2 + licence
  assets/img/              Project covers: screenshots of the real apps (WebP)
frontend/                  Effects layer source (bundled by Vite)
  main.js                  Tiny entry: skips everything for reduced motion
  app.js                   Preloader, Lenis, GSAP scroll scenes, pointer effects
  scene.js                 three.js particle scene (its own chunk)
  state.js                 Shared state and colour tokens
vite.config.js             Build config: frontend/ -> public/assets/build/
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

Everything works without JavaScript: the menu is always visible, and the
form posts and redirects back with server-side messages.

### Effects — `frontend/` + `effects.css`

A layer on top of the plain page, built with three.js, GSAP (ScrollTrigger,
SplitText) and Lenis, bundled by Vite into three files: a ~1 KB entry, the
scroll/animation chunk, and the three.js scene chunk.

| Scene | How it works |
|---|---|
| Crystal | A lit 3D object in the hero: an icosphere split into separate shards around a glowing core, flat-shaded with iridescent facets and edge lines. Shards lift under the pointer, a click blows them apart for a moment, and the crystal shatters when the hero scrolls out |
| Particles | One cloud of 20,000 points (9,000 on phones) behind the whole page, drawn in one call. A vertex shader morphs it between shapes as you scroll: a halo around the crystal (hero), wave field (projects), torus knot (skills), loose cloud (about), and the words "Let’s talk" (contact). The pointer pushes particles away; a click sends a shock wave. The cloud dims while the page scrolls fast. Bloom in the dark theme |
| Preloader | Counts while the three.js chunk loads, then opens like a curtain. A CSS animation removes it if the script never starts |
| Hero | The headline flips in letter by letter (SplitText keeps the sentence as the accessible name) |
| About | The text lights up word by word, scrubbed by the scroll |
| Skills | On wide windows the section is pinned and the cards travel sideways |
| Projects | Cards stick and stack; covers reveal from a mask and ripple on hover (SVG displacement filter) |
| Small things | Magnetic buttons, tilt cards with a glowing border, scramble eyebrows |

How it stays safe:

- `frontend/main.js` checks `prefers-reduced-motion` first. With it, none of
  the libraries is downloaded and the page is the plain version.
- The scene chunk is loaded with `import()`. Setup runs in small steps while
  the preloader counts, so there is no long task (see the measurements above).
- Shapes that belong to an element (sphere, ring, text) read that element's
  box each frame, so they scroll with the page like normal content.
- The scene lowers its own quality (bloom, pixel ratio, particle count) if
  the frame rate is poor.
- Everything script-dependent is scoped to `.has-fx` / `.has-scene` on
  `<html>`. Decorative nodes are `aria-hidden`; in-page links still move the
  focus and update the URL.
- Works under the strict CSP: all files come from `'self'`, no inline styles
  or scripts, only CSSOM.

### Video — the "mini player"

Not shown on the portfolio page any more. The code stays in the repository
because the WordPress theme uses it for its `[video_demo]` shortcode.

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

- No web fonts (system font stacks), no render-blocking
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
