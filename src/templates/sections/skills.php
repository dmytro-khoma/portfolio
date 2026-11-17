<?php
/**
 * Skills: each card says what I can do and links to the code that shows it.
 *
 * @var array{cards: list<array{title: string, text: string, proof: string, url: string}>, tools: list<string>} $skills
 */

declare(strict_types=1);
?>
<section class="section" id="skills" aria-labelledby="skills-title">
    <div class="container">
        <header class="section__header">
            <p class="eyebrow">Skills</p>
            <h2 id="skills-title">What I work with</h2>
            <p class="lead">Most important first. Each card links to the code where you can check it.</p>
        </header>

        <ul class="auto-grid" role="list">
            <?php foreach ($skills['cards'] as $index => $card): ?>
                <li class="reveal">
                    <article class="skill-card">
                        <span class="skill-card__index" aria-hidden="true"><?= e(sprintf('%02d', $index + 1)) ?></span>
                        <h3><?= e($card['title']) ?></h3>
                        <p class="skill-card__text"><?= e($card['text']) ?></p>
                        <p class="skill-card__proof">See: <a href="<?= e($card['url']) ?>"><code><?= e($card['proof']) ?></code></a></p>
                    </article>
                </li>
            <?php endforeach; ?>
        </ul>

        <div class="skills-progress" aria-hidden="true"><span class="skills-progress__bar"></span></div>

        <div class="stack mt-l">
            <h3 class="visually-hidden">Languages and tools</h3>
            <ul class="tag-list" role="list" aria-label="Languages and tools">
                <?php foreach ($skills['tools'] as $tool): ?>
                    <li class="tag"><?= e($tool) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    </div>
</section>
