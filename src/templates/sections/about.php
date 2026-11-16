<?php
/**
 * About: background, how I work, and what I am looking for.
 * Only facts that are true today. No invented experience.
 */

declare(strict_types=1);
?>
<section class="section" id="about" aria-labelledby="about-title">
    <div class="container about">
        <div class="prose reveal">
            <p class="eyebrow">About</p>
            <h2 id="about-title">About me</h2>
            <p>
                I’m in my second year of Applied Informatics at FMFI, Comenius University. Most of my
                study work so far has been in Python, C++ and SQL. In my free time I build web apps,
                like a combat tracker for a cyberpunk tabletop game and a dinosaur catalogue.
            </p>
            <p>
                For the web, I like to know what the browser can do on its own, and then pick the
                tool that fits the job. The code has comments, so you can open any file and follow
                what it does.
            </p>
            <p>
                Now I’m looking for my first paid front-end job. I can start right away.
            </p>
        </div>
    </div>

    <?php /* On wide screens the effects bundle pins this block and shows the
             four lines one at a time; otherwise it is a plain list. */ ?>
    <div class="principles" data-principles>
        <div class="container principles__inner">
            <h3 class="principles__title" id="about-aside-title">What I try to do</h3>
            <span class="principles__track" aria-hidden="true"><span class="principles__bar"></span></span>
            <ol class="principles__list" role="list" aria-labelledby="about-aside-title">
                <?php foreach ([
                    'Use normal HTML elements (links, buttons, forms) before I build custom ones.',
                    'Keep pages light. Every extra script has to be worth its size.',
                    'Write code that someone else can still read a month later.',
                    'Try things with the keyboard before I say they’re finished.',
                ] as $index => $line): ?>
                    <li class="principles__item">
                        <span class="principles__num" aria-hidden="true"><?= e(sprintf('%02d', $index + 1)) ?></span>
                        <p class="principles__text"><?= e($line) ?></p>
                    </li>
                <?php endforeach; ?>
            </ol>
        </div>
    </div>
</section>
