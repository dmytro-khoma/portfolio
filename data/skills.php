<?php
/**
 * Skills shown in the "Skills" section.
 *
 * Ordered by what matters most to an employer. Every card links to the code
 * where it can be checked (this site or a project repository), so a reviewer
 * can verify it instead of taking it on trust.
 *
 * @return array{
 *     cards: list<array{title: string, text: string, proof: string, url: string}>,
 *     tools: list<string>
 * }
 */

declare(strict_types=1);

return [
    'cards' => [
        [
            'title' => 'Python and Django',
            'text'  => 'The back end of the combat tracker: Django models, the game rules as plain Python functions covered by 27 tests, and JSON endpoints for the JavaScript map.',
            'proof' => 'cyberpunk-combat-tracker',
            'url'   => 'https://github.com/dmytro-khoma/cyberpunk-combat-tracker',
        ],
        [
            'title' => 'JavaScript',
            'text'  => 'ES modules without a framework: the mobile menu, the theme switch and the contact form with fetch() and live validation. The tracker’s grid map talks to Django.',
            'proof' => 'public/assets/js/',
            'url'   => 'https://github.com/dmytro-khoma/portfolio/tree/main/public/assets/js',
        ],
        [
            'title' => 'PHP',
            'text'  => 'Templates and a contact form handler with validation, a CSRF token, a honeypot and a rate limit. Messages go to Telegram through the Bot API.',
            'proof' => 'src/, public/contact.php',
            'url'   => 'https://github.com/dmytro-khoma/portfolio/tree/main/src',
        ],
        [
            'title' => '3D and animation',
            'text'  => 'A three.js scene with my own GLSL shaders: 20,000 particles that morph between shapes and a crystal made of shards. Scroll scenes with GSAP and Lenis.',
            'proof' => 'frontend/scene.js',
            'url'   => 'https://github.com/dmytro-khoma/portfolio/blob/main/frontend/scene.js',
        ],
        [
            'title' => 'CSS',
            'text'  => 'One set of design tokens in cascade layers, a light and a dark theme, fluid sizes with clamp(), container queries and :has().',
            'proof' => 'public/assets/css/',
            'url'   => 'https://github.com/dmytro-khoma/portfolio/tree/main/public/assets/css',
        ],
        [
            'title' => 'Speed and accessibility',
            'text'  => 'The content paints first and heavy code loads after it. Everything works with a keyboard, and “reduce motion” turns the effects off.',
            'proof' => 'README.md',
            'url'   => 'https://github.com/dmytro-khoma/portfolio#readme',
        ],
    ],
    'tools' => ['Python', 'Django', 'JavaScript', 'PHP', 'SQL', 'HTML', 'CSS', 'Git & GitHub', 'Docker', 'Three.js', 'GSAP', 'C++'],
];
