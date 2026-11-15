<?php
/**
 * Skills shown in the "Skills" section.
 *
 * Every skill points to the place in THIS site where it can be checked,
 * so a reviewer can verify it instead of taking it on trust.
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
            'text'  => 'Small ES modules without any libraries: the theme switch, the mobile menu, the video player and the contact form.',
            'proof' => 'public/assets/js/',
        ],
        [
            'title' => 'PHP',
            'text'  => 'Simple templates without a framework, and a contact form handler with validation, a CSRF token, a honeypot and a rate limit.',
            'proof' => 'public/contact.php, src/',
        ],
        [
            'title' => 'WordPress',
            'text'  => 'A small classic theme that uses the same CSS as this site, plus a [video_demo] shortcode.',
            'proof' => 'wordpress-theme/',
        ],
        [
            'title' => 'Video',
            'text'  => 'The video loads only after a click. The player has custom controls, built on top of the browser’s <video> element.',
            'proof' => 'the video demo below',
        ],
        [
            'title' => 'Speed and accessibility',
            'text'  => 'No web fonts, no frameworks, lazy images. The page works with a keyboard and respects the “reduce motion” setting.',
            'proof' => 'README.md',
        ],
    ],
    'tools' => ['HTML', 'CSS', 'JavaScript', 'PHP', 'Python', 'C++', 'SQL', 'Django', 'Git & GitHub'],
];
