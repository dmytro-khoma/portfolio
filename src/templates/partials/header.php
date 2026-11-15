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

    <link rel="icon" href="favicon.svg" type="image/svg+xml">

    <script nonce="<?= e($nonce) ?>">
        (function () {
            var root = document.documentElement;
            root.classList.add('has-js');
            try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || theme === 'light') root.dataset.theme = theme;
            } catch (error) { /* storage blocked: follow the OS setting */ }
        })();
    </script>

    <style nonce="<?= e($nonce) ?>"><?= inline_css() /* trusted local file, not user input */ ?></style>

    <?php foreach (['theme', 'nav', 'reveal', 'video-facade', 'contact-form'] as $module): ?>
        <link rel="modulepreload" href="assets/js/<?= e($module) ?>.js">
    <?php endforeach; ?>
    <?php /* ?v= changes with every edit, so no browser keeps an old entry point. */ ?>
    <script type="module" src="assets/js/main.js?v=<?= e((string) filemtime(APP_ROOT . '/public/assets/js/main.js')) ?>"></script>
</head>
<body>
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
