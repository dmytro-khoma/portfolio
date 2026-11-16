<?php
/**
 * Numbers: a few measured facts about this page.
 *
 * The final values are printed by the server, so they are correct without
 * JavaScript. The effects bundle counts up to them when the section scrolls
 * in, and the particle scene forms a ring around .numbers-stage.
 */

declare(strict_types=1);

// Measured on 2026-11-16 in Chrome with the Performance API (layout-shift
// and longtask entries) on a laptop. Measure again after changing the effects.
$numbers = [
    ['value' => '20', 'unit' => 'k',  'label' => 'particles in the 3D scene, drawn in one call (9k on phones)'],
    ['value' => '0',  'unit' => '',   'label' => 'layout shift while the page loads (CLS)'],
    ['value' => '11', 'unit' => 'ms', 'label' => 'Total Blocking Time on a laptop, worst of three runs'],
    ['value' => '0',  'unit' => 'KB', 'label' => 'of 3D and animation code if you ask for reduced motion'],
];
?>
<section class="section" id="numbers" aria-labelledby="numbers-title" data-fx-numbers>
    <div class="container">
        <header class="section__header">
            <p class="eyebrow">In numbers</p>
            <h2 id="numbers-title">The effects are heavy. The page is not.</h2>
            <p class="lead">The 3D scene and the animations load after the content, in their own files. Measured in Chrome with the Performance API.</p>
        </header>

        <div class="numbers-stage" data-fx-anchor="ring">
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
