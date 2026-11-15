<?php
/**
 * Video demo: a lazy facade plus a custom player.
 *
 * Markup strategy (progressive enhancement)
 * - Without JS: the facade is a normal link to the MP4 file.
 * - With JS: js/video-facade.js intercepts the click, then dynamically
 *   imports js/video-player.js, which clones the <template> below around a
 *   new <video> element. Until that click, no video bytes are downloaded.
 *
 * @var array{
 *     title: string, duration: string, poster: string, width: int, height: int,
 *     sources: list<array{src: string, type: string}>, captions: string
 * } $video
 */

declare(strict_types=1);

$fallbackSource = end($video['sources'])['src'];
?>
<section class="section" id="video" aria-labelledby="video-title">
    <div class="container">
        <header class="section__header">
            <p class="eyebrow">Video demo</p>
            <h2 id="video-title">Video player demo</h2>
            <p class="lead">
                Click the picture to load the video. Until then the page doesn’t download any video
                data. The controls are custom, built on top of the normal <code>&lt;video&gt;</code> element.
            </p>
        </header>

        <div class="video-demo">
            <div class="video" data-video
                 data-sources="<?= e(json_encode($video['sources'], JSON_THROW_ON_ERROR)) ?>"
                 data-captions="<?= e($video['captions']) ?>"
                 data-poster="<?= e($video['poster']) ?>"
                 data-title="<?= e($video['title']) ?>">
                <a class="video__facade" href="<?= e($fallbackSource) ?>">
                    <img class="video__poster" src="<?= e($video['poster']) ?>" alt=""
                         width="<?= e($video['width']) ?>" height="<?= e($video['height']) ?>"
                         loading="lazy" decoding="async">
                    <span class="video__play" aria-hidden="true"><?= icon('play') ?></span>
                    <span class="video__label">
                        Play video: <?= e($video['title']) ?> (<?= e($video['duration']) ?>)
                    </span>
                </a>
            </div>

            <div class="stack reveal">
                <h3>How it works</h3>
                <ul class="stack" role="list">
                    <li>Before you click, there’s only a poster image and a button, so the page stays fast.</li>
                    <li>Play, seek, volume, speed, captions and fullscreen all have labels for screen readers.</li>
                    <li>You can use the whole player from the keyboard. The shortcuts are below.</li>
                </ul>

                <details class="shortcuts">
                    <summary>Keyboard shortcuts</summary>
                    <table class="shortcuts__table">
                        <caption class="visually-hidden">Keyboard shortcuts for the video player</caption>
                        <tbody>
                            <tr><th scope="row"><kbd>Space</kbd> / <kbd>K</kbd></th><td>Play or pause</td></tr>
                            <tr><th scope="row"><kbd>←</kbd> / <kbd>→</kbd></th><td>Back or forward 5 seconds</td></tr>
                            <tr><th scope="row"><kbd>J</kbd> / <kbd>L</kbd></th><td>Back or forward 10 seconds</td></tr>
                            <tr><th scope="row"><kbd>↑</kbd> / <kbd>↓</kbd></th><td>Volume up or down</td></tr>
                            <tr><th scope="row"><kbd>M</kbd></th><td>Mute or unmute</td></tr>
                            <tr><th scope="row"><kbd>C</kbd></th><td>Captions on or off</td></tr>
                            <tr><th scope="row"><kbd>&lt;</kbd> / <kbd>&gt;</kbd></th><td>Slower or faster</td></tr>
                            <tr><th scope="row"><kbd>F</kbd></th><td>Fullscreen</td></tr>
                            <tr><th scope="row"><kbd>0</kbd>–<kbd>9</kbd></th><td>Jump to 0–90%</td></tr>
                        </tbody>
                    </table>
                </details>
            </div>
        </div>
    </div>

    <?php render('components/player-template'); ?>
</section>
