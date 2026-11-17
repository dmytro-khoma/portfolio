<?php
/**
 * Projects: rendered from data/projects.php, one card template per item.
 *
 * On small screens the list is a horizontally scrolling, snapping row.
 * The wrapper is a focusable, labelled region so keyboard users can
 * scroll it with the arrow keys.
 *
 * @var list<array<string, mixed>> $projects
 */

declare(strict_types=1);
?>
<section class="section" id="projects" aria-labelledby="projects-title">
    <div class="container">
        <header class="section__header">
            <p class="eyebrow">Projects</p>
            <h2 id="projects-title">Apps I built and shipped</h2>
            <p class="lead">Designed, built and deployed on my own. Both are live, with the source code on GitHub.</p>
        </header>

        <div class="project-scroller" role="region" aria-label="Project list" tabindex="0">
            <ul class="project-list" role="list">
                <?php foreach ($projects as $index => $project): ?>
                    <li>
                        <?php render('components/project-card', ['project' => $project, 'isFirst' => $index === 0]); ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </div>
</section>
