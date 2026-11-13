<?php
/**
 * One project card.
 *
 * Images have explicit width/height (no layout shift) and are lazy-loaded,
 * except the first card, which may be visible early on large screens.
 *
 * @var array{
 *     title: string, kind: string, summary: string, learned: string,
 *     stack: list<string>, image: string, image_alt: string,
 *     credit?: string, repo: ?string, demo: ?string
 * } $project
 * @var bool $isFirst
 */

declare(strict_types=1);

$headingId = 'project-' . preg_replace('/[^a-z0-9]+/', '-', strtolower($project['title']));
?>
<article class="project-card" aria-labelledby="<?= e($headingId) ?>">
    <div class="project-card__inner">
        <div class="project-card__media">
            <img src="<?= e($project['image']) ?>" alt="<?= e($project['image_alt']) ?>"
                 width="1200" height="750" decoding="async"
                 <?= $isFirst ? '' : 'loading="lazy"' ?>>
        </div>

        <div class="project-card__body">
            <p class="project-card__meta"><?= e($project['kind']) ?></p>
            <h3 class="project-card__title" id="<?= e($headingId) ?>"><?= e($project['title']) ?></h3>
            <p><?= e($project['summary']) ?></p>
            <p class="project-card__text"><strong>What I learned:</strong> <?= e($project['learned']) ?></p>

            <ul class="tag-list" role="list" aria-label="Technologies">
                <?php foreach ($project['stack'] as $tech): ?>
                    <li class="tag"><?= e($tech) ?></li>
                <?php endforeach; ?>
            </ul>

            <?php if (!empty($project['credit'])): ?>
                <p class="project-card__credit"><?= e($project['credit']) ?></p>
            <?php endif; ?>

            <?php if ($project['repo'] || $project['demo']): ?>
                <p class="project-card__links cluster">
                    <?php if ($project['repo']): ?>
                        <a href="<?= e($project['repo']) ?>">Source code<span class="visually-hidden"> of <?= e($project['title']) ?></span></a>
                    <?php endif; ?>
                    <?php if ($project['demo']): ?>
                        <a href="<?= e($project['demo']) ?>">Live demo<span class="visually-hidden"> of <?= e($project['title']) ?></span></a>
                    <?php endif; ?>
                </p>
            <?php endif; ?>
        </div>
    </div>
</article>
