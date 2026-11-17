<?php
/**
 * Hero: who I am, what I do, and the key facts a client needs first.
 *
 * .hero__orb is an empty box: the particle scene (frontend/scene.js) draws
 * its sphere where this box is. data-intro marks what fades in after the
 * preloader. Without the effects bundle both do nothing.
 */

declare(strict_types=1);
?>
<div class="hero-stage" data-hero>
<section class="container hero" aria-labelledby="hero-title">
    <div class="stack stack--l">
        <p class="eyebrow" data-intro><?= e(config('role')) ?> · <?= e(config('location')) ?></p>
        <h1 class="hero__title" id="hero-title" data-fx-title>Hi, I’m Dmytro. I build <em>full-stack</em> web apps.</h1>
        <p class="lead" data-intro>
            Python and Django or PHP on the server, JavaScript and WebGL in the browser.
            Second-year Applied Informatics student in Bratislava, looking for a part-time junior role.
        </p>
        <div class="cluster" data-intro>
            <a class="button button--primary" href="#projects">
                See my projects <?= icon('arrow') ?>
            </a>
            <a class="button button--ghost" href="#contact">Write to me</a>
            <?php if (config('links.github')): ?>
                <a class="button button--ghost" href="<?= e(config('links.github')) ?>">GitHub</a>
            <?php endif; ?>
        </div>
    </div>

    <div class="hero__side">
    <div class="hero__orb" data-fx-anchor="orb" aria-hidden="true"></div>
    <dl class="facts" aria-label="Key facts" data-intro>
        <div class="facts__row">
            <dt class="facts__term">Available</dt>
            <dd class="facts__value">Right away</dd>
        </div>
        <div class="facts__row">
            <dt class="facts__term">Stack</dt>
            <dd class="facts__value">Python, Django, PHP, JavaScript, three.js</dd>
        </div>
        <div class="facts__row">
            <dt class="facts__term">Work</dt>
            <dd class="facts__value">Remote or on site in Bratislava</dd>
        </div>
        <div class="facts__row">
            <dt class="facts__term">Languages</dt>
            <dd class="facts__value">English B2, Slovak B2</dd>
        </div>
    </dl>
    </div>
</section>
</div>
