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
        <h1 class="hero__title" id="hero-title" data-fx-title>Hi, I’m Dmytro. I build <em>fast</em> and interactive websites.</h1>
        <p class="lead" data-intro>
            I study Applied Informatics in Bratislava and I’m looking for part-time work as a developer, front end or back end.
            The source code of this page is open on GitHub, so it also works as a code sample.
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
    </div>
</section>
</div>
