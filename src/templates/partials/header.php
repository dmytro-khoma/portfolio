<?php
/**
 * Document head and site header.
 *
 * Performance notes
 * - All CSS is inlined (see inline_css()), so there is no render-blocking
 *   stylesheet request.
 * - JS is loaded as ES modules, which are deferred by default; the module
 *   graph is preloaded so the imports download in parallel.
 * - A tiny inline script sets the saved theme before first paint, which
 *   prevents a flash of the wrong colour scheme.
 * - The effects bundle (frontend/, built by Vite) is a separate module; its
 *   entry is ~1 KB and loads the heavy chunks itself, only when wanted.
 *
 * @var array<int, array{id: string, label: string}> $nav
 */

declare(strict_types=1);

$nonce = csp_nonce();
?>
<!doctype html>
<html lang="<?= e(config('lang')) ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e(config('name')) ?> · <?= e(config('role')) ?></title>
    <meta name="description" content="<?= e(config('description')) ?>">
    <meta name="color-scheme" content="light dark">
    <meta name="theme-color" content="#fafaf7" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#0f1115" media="(prefers-color-scheme: dark)">

    <meta property="og:type" content="website">
    <meta property="og:title" content="<?= e(config('name')) ?> · <?= e(config('role')) ?>">
    <meta property="og:description" content="<?= e(config('description')) ?>">
    <?php /* Link preview picture: must be an absolute URL (1200×630). */ ?>
    <meta property="og:url" content="<?= e(config('url')) ?>/">
    <meta property="og:image" content="<?= e(config('url')) ?>/assets/img/og.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="<?= e(config('name')) ?>, <?= e(config('role')) ?>: the first screen of the site with a crystal made of shards.">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="canonical" href="<?= e(config('url')) ?>/">
    <link rel="icon" href="favicon.svg" type="image/svg+xml">

    <?php /* Heading font: fetched early, in parallel with the HTML parse. */ ?>
    <link rel="preload" href="assets/fonts/fraunces-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="assets/fonts/fraunces-latin-wght-italic.woff2" as="font" type="font/woff2" crossorigin>

    <script nonce="<?= e($nonce) ?>">
        (function () {
            var root = document.documentElement;
            root.classList.add('has-js');
            // No effects for "reduce motion": lets the CSS drop their empty boxes.
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('fx-off');
            try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || theme === 'light') root.dataset.theme = theme;
            } catch (error) { /* storage blocked: follow the OS setting */ }
        })();
    </script>

    <?php
    // Structured data for search engines: who this page is about.
    $person = [
        '@context'    => 'https://schema.org',
        '@type'       => 'Person',
        'name'        => config('name'),
        'jobTitle'    => config('role'),
        'url'         => config('url') . '/',
        'image'       => config('url') . '/assets/img/og.jpg',
        'description' => config('description'),
        'address'     => ['@type' => 'PostalAddress', 'addressLocality' => 'Bratislava', 'addressCountry' => 'SK'],
        'alumniOf'    => ['@type' => 'CollegeOrUniversity', 'name' => 'Comenius University, Faculty of Mathematics, Physics and Informatics'],
        'sameAs'      => array_values(array_filter([config('links.github'), config('links.linkedin')])),
    ];
    ?>
    <script type="application/ld+json" nonce="<?= e($nonce) ?>"><?= json_encode($person, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?></script>

    <style nonce="<?= e($nonce) ?>"><?= inline_css() /* trusted local file, not user input */ ?></style>

    <?php foreach (['theme', 'nav', 'reveal', 'contact-form'] as $module): ?>
        <link rel="modulepreload" href="assets/js/<?= e($module) ?>.js">
    <?php endforeach; ?>
    <?php /* ?v= changes with every edit, so no browser keeps an old entry point. */ ?>
    <script type="module" src="assets/js/main.js?v=<?= e((string) filemtime(APP_ROOT . '/public/assets/js/main.js')) ?>"></script>
    <?php /* Effects bundle (Vite). Hashed file name, so it can be cached forever. */ ?>
    <?php if ($fx = fx_entry()): ?>
        <script type="module" src="<?= e($fx) ?>"></script>
    <?php endif; ?>
</head>
<body>
    <?php if ($fx): ?>
        <?php /* Decorative curtain while the 3D chunk loads. CSS shows it only
                 with JS and without "reduce motion", and hides it by itself
                 after a few seconds if the script never starts. */ ?>
        <div class="preloader" data-preloader aria-hidden="true">
            <div class="preloader__panel preloader__panel--top"></div>
            <div class="preloader__panel preloader__panel--bottom"></div>
            <div class="preloader__content">
                <span class="preloader__name"><?= e(config('name')) ?> · Portfolio</span>
                <span class="preloader__count" data-preloader-count>000</span>
                <span class="preloader__track"><span class="preloader__bar" data-preloader-bar></span></span>
            </div>
        </div>
    <?php endif; ?>
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="progress-bar" aria-hidden="true"></div>

    <header class="site-header">
        <div class="container site-header__inner">
            <a class="brand" href="#top">
                <span class="brand__mark" aria-hidden="true">DK</span>
                <span><?= e(config('name')) ?></span>
            </a>

            <nav class="site-nav" aria-label="Main">
                <ul class="site-nav__list" id="site-nav-list" role="list">
                    <?php foreach ($nav as $item): ?>
                        <li><a class="site-nav__link" href="#<?= e($item['id']) ?>"><?= e($item['label']) ?></a></li>
                    <?php endforeach; ?>
                </ul>
            </nav>

            <div class="site-header__actions">
                <button class="icon-button theme-toggle" type="button" data-theme-toggle
                        aria-label="Switch colour theme">
                    <?= icon('moon') ?>
                    <?= icon('sun') ?>
                </button>
                <button class="icon-button site-nav__toggle" type="button" data-nav-toggle
                        aria-controls="site-nav-list" aria-expanded="false" aria-label="Menu">
                    <?= icon('menu') ?>
                    <?= icon('close') ?>
                </button>
            </div>
        </div>
    </header>
