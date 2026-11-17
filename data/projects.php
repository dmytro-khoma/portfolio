<?php
/**
 * Projects shown in the "Projects" section.
 *
 * Each entry is rendered by src/templates/components/project-card.php.
 * Links set to null are not shown. Covers are real screenshots of the
 * running apps (1200×750 WebP).
 *
 * @return list<array{
 *     title: string, kind: string, summary: string, learned: string,
 *     stack: list<string>, image: string, image_alt: string,
 *     credit?: string, repo: ?string, demo: ?string
 * }>
 */

declare(strict_types=1);

return [
    [
        'title'     => 'Cyberpunk combat tracker',
        'kind'      => 'Web app for a tabletop role-playing game',
        'summary'   => 'A tool for the game master: fighters and walls on a grid, and the app runs the whole fight by the rulebook (initiative, cover, armour, injuries, grenades, hacks) with every roll in a log.',
        'learned'   => 'Turning a 20-page rulebook into Python functions covered by 27 tests, and keeping the dice on the server: the JavaScript map only sends actions and draws the result.',
        'stack'     => ['Python', 'Django', 'JavaScript', 'CSS'],
        'image'     => 'assets/img/combat-tracker.webp',
        'image_alt' => 'Screenshot of the combat tracker: a dark grid map with fighters and walls, and the turn panel with the active fighter’s stats.',
        'repo'      => 'https://github.com/dmytro-khoma/cyberpunk-combat-tracker',
        'demo'      => 'https://cyberpunk-combat-tracker.onrender.com/',
    ],
    [
        'title'     => 'Dinosauria',
        'kind'      => 'Searchable catalogue',
        'summary'   => 'A field guide to 30 dinosaurs with search, filters, sorting and a Mesozoic timeline. Each one opens in a dialog that compares its size with a person.',
        'learned'   => 'Filters that stay in the URL so a view can be shared, and list changes animated with the View Transitions API.',
        'stack'     => ['HTML', 'CSS', 'JavaScript'],
        'image'     => 'assets/img/dinosauria.webp',
        'image_alt' => 'Screenshot of Dinosauria: the search and filter bar above a grid of dinosaur cards with museum photos.',
        'credit'    => 'Photos in the screenshot: Wikimedia Commons (CC BY / CC BY-SA); authors are credited on the site.',
        'repo'      => 'https://github.com/dmytro-khoma/dinosauria',
        'demo'      => 'https://dmytro-khoma.github.io/dinosauria/',
    ],
];
