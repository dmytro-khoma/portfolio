<?php
/**
 * Hero: who I am, what I do, and the key facts a client needs first.
 *
 * The <canvas> is decoration for js/effects.js (a WebGL shader). It stays
 * empty and invisible until the effects module starts, so the text is
 * painted first and is never covered.
 */

declare(strict_types=1);
?>
<div class="hero-stage" data-hero>
<canvas class="hero-canvas" data-hero-canvas aria-hidden="true"></canvas>
<section class="container hero" aria-labelledby="hero-title">
    <div class="stack stack--l">
        <p class="eyebrow"><?= e(config('role')) ?> · <?= e(config('location')) ?></p>
        <h1 class="hero__title" id="hero-title" data-fx-title>Hi, I’m Dmytro. I build websites with <em>plain</em> HTML, CSS, JavaScript and PHP.</h1>
        <p class="lead">
            I study Applied Informatics in Bratislava and I’m looking for part-time front-end work,
            ideally on WordPress sites. This page is built without frameworks,
            and its source code is open, so it also works as a code sample.
        </p>
        <div class="cluster">
            <a class="button button--primary" href="#video">
                Try the video player <?= icon('arrow') ?>
            </a>
            <a class="button button--ghost" href="#contact">Write to me</a>
            <?php if (config('links.github')): ?>
                <a class="button button--ghost" href="<?= e(config('links.github')) ?>">GitHub</a>
            <?php endif; ?>
        </div>
    </div>

    <dl class="facts" aria-label="Key facts">
        <div class="facts__row">
            <dt class="facts__term">Available</dt>
            <dd class="facts__value">Right now, up to 20 hours a week</dd>
        </div>
        <div class="facts__row">
            <dt class="facts__term">Based in</dt>
            <dd class="facts__value">Bratislava, Slovakia</dd>
        </div>
        <div class="facts__row">
            <dt class="facts__term">Languages</dt>
            <dd class="facts__value">English B2, Slovak B2</dd>
        </div>
        <div class="facts__row">
            <dt class="facts__term">Studying</dt>
            <dd class="facts__value">Applied Informatics, FMFI UK, 2nd year</dd>
        </div>
    </dl>
</section>
</div>
