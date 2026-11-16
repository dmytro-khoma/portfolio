<?php
/**
 * Skills shown in the "Skills" section.
 *
 * Every skill points to the code where it can be checked (this site, or a
 * project repository), so a reviewer can verify it instead of taking it on trust.
 *
 * @return array{
 *     cards: list<array{title: string, text: string, proof: string}>,
 *     tools: list<string>
 * }
 */

declare(strict_types=1);

return [
    'cards' => [
        [
            'title' => 'CSS',
            'text'  => 'One set of design tokens, split into cascade layers. I used clamp() for font sizes, container queries for the project cards, and :has() in the form.',
            'proof' => 'public/assets/css/',
        ],
        [
            'title' => 'JavaScript',
            'text'  => 'Small ES modules without a framework: the theme switch, the mobile menu and the contact form with fetch() and live validation.',
            'proof' => 'public/assets/js/',
        ],
        [
            'title' => '3D and animation',
            'text'  => 'A three.js scene with my own GLSL shaders: 20,000 particles that morph between shapes and a crystal made of shards. Scroll scenes with GSAP ScrollTrigger and Lenis.',
            'proof' => 'frontend/scene.js, frontend/app.js',
        ],
        [
            'title' => 'PHP',
            'text'  => 'Simple templates and a contact form handler with validation, a CSRF token, a honeypot and a rate limit. Messages are sent to Telegram through the Bot API.',
            'proof' => 'public/contact.php, src/',
        ],
        [
            'title' => 'Python and Django',
            'text'  => 'The server side of the combat tracker: models, the game rules as plain functions with tests, and JSON endpoints for the JavaScript map.',
            'proof' => 'github.com/dmytro-khoma/cyberpunk-combat-tracker',
        ],
        [
            'title' => 'WordPress',
            'text'  => 'A small classic theme that uses the same CSS as this site, plus a [video_demo] shortcode.',
            'proof' => 'wordpress-theme/',
        ],
        [
            'title' => 'Speed and accessibility',
            'text'  => 'Lazy images and code that loads only when it is needed. The page works with a keyboard and respects the “reduce motion” setting.',
            'proof' => 'README.md',
        ],
    ],
    'tools' => ['HTML', 'CSS', 'JavaScript', 'Three.js', 'GSAP', 'PHP', 'Python', 'Django', 'SQL', 'C++', 'Docker', 'Git & GitHub'],
];
