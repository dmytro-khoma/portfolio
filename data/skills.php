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
            'text'  => 'Small ES modules: the theme switch, the mobile menu and the contact form. The 3D particles and scroll animations use three.js and GSAP.',
            'proof' => 'public/assets/js/, frontend/',
        ],
        [
            'title' => 'PHP',
            'text'  => 'Simple templates and a contact form handler with validation, a CSRF token, a honeypot and a rate limit.',
            'proof' => 'public/contact.php, src/',
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
    'tools' => ['HTML', 'CSS', 'JavaScript', 'PHP', 'Python', 'C++', 'SQL', 'Django', 'Git & GitHub'],
];
