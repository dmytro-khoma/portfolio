<?php
/**
 * Numbers: a few measured facts about this page.
 *
 * The final values are printed by the server, so they are correct without
 * JavaScript. js/effects.js counts up to them when the section scrolls in
 * and adds the gooey blobs behind (an SVG filter).
 */

declare(strict_types=1);

$numbers = [
    ['value' => '100', 'unit' => '',   'label' => 'Lighthouse score in all four categories'],
    ['value' => '0',   'unit' => '',   'label' => 'layout shift while the page loads (CLS)'],
    ['value' => '0',   'unit' => 'ms', 'label' => 'Total Blocking Time'],
    ['value' => '1.2', 'unit' => 's',  'label' => 'Largest Contentful Paint on a phone'],
];
?>
<section class="section" id="numbers" aria-labelledby="numbers-title" data-fx-numbers>
    <div class="container">
        <header class="section__header">
            <p class="eyebrow">In numbers</p>
            <h2 id="numbers-title">The effects are heavy. The page is not.</h2>
            <p class="lead">Every effect on this page loads after the content and stops when it scrolls out of view. Measured with Lighthouse.</p>
        </header>

        <div class="numbers-stage" data-fx-numbers-stage>
            <div class="fx-goo" aria-hidden="true">
                <i class="fx-blob fx-blob--1"></i><i class="fx-blob fx-blob--2"></i>
                <i class="fx-blob fx-blob--3"></i><i class="fx-blob fx-blob--4"></i>
                <i class="fx-blob fx-blob--cursor" data-fx-cursor-blob></i>
            </div>

        <dl class="numbers">
            <?php foreach ($numbers as $item): ?>
                <div class="numbers__item">
                    <dt class="numbers__label"><?= e($item['label']) ?></dt>
                    <dd class="numbers__value"><span data-count="<?= e($item['value']) ?>"><?= e($item['value']) ?></span><?php if ($item['unit']): ?><small> <?= e($item['unit']) ?></small><?php endif; ?></dd>
                </div>
            <?php endforeach; ?>
        </dl>
        </div>
    </div>
</section>
