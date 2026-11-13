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
        'summary'   => 'The game master places fighters and walls on a grid, and the app runs the fight by the rules of a cyberpunk tabletop game: initiative, range and cover, armour, critical injuries, grenades, quickhacks and death saves. Every roll goes into a log.',
        'learned'   => 'Turning a 20-page rulebook into Python functions I can test with fixed dice, and keeping the dice on the server so the JavaScript map only sends actions and draws the result.',
        'stack'     => ['Python', 'Django', 'JavaScript', 'CSS'],
        'image'     => 'assets/img/combat-tracker.webp',
        'image_alt' => 'Screenshot of the combat tracker: a dark grid map with fighters and walls, and the turn panel with the active fighter’s stats.',
        'repo'      => 'https://github.com/dmytro-khoma/cyberpunk-combat-tracker',
        'demo'      => 'https://cyberpunk-combat-tracker.onrender.com/',
    ],
    [
        'title'     => 'Dinosauria',
        'kind'      => 'Searchable catalogue',
        'summary'   => 'A field guide to 30 dinosaurs with search, filters, sorting and a timeline of the Mesozoic. Each one opens in a dialog that compares its size with a person.',
        'learned'   => 'Building filters that stay in the URL, animating list changes with the View Transitions API, and using freely licensed photos with proper credits.',
        'stack'     => ['HTML', 'CSS', 'JavaScript'],
        'image'     => 'assets/img/dinosauria.webp',
        'image_alt' => 'Screenshot of Dinosauria: the search and filter bar above a grid of dinosaur cards with museum photos.',
        'credit'    => 'Photos in the screenshot: Wikimedia Commons (CC BY / CC BY-SA); authors are credited on the site.',
        'repo'      => 'https://github.com/dmytro-khoma/dinosauria',
        'demo'      => 'https://dmytro-khoma.github.io/dinosauria/',
    ],
];
