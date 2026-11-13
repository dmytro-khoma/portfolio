<?php
/**
 * Player UI template. Inert until js/video-player.js clones it, so it
 * costs nothing on page load and keeps markup out of the JavaScript.
 *
 * State is shown with attributes on .player (data-state, data-muted,
 * data-fullscreen) and with aria-pressed / aria-label on the buttons.
 */

declare(strict_types=1);
?>
<template id="player-template">
    <div class="player" data-state="paused" tabindex="-1">
        <div class="player__controls" role="group" aria-label="Video controls">
            <input class="player__range player__seek" type="range" min="0" max="100" step="0.1" value="0"
                   aria-label="Seek" data-player="seek">

            <button class="player__button" type="button" data-player="play" aria-label="Play">
                <?= icon('play') ?><?= icon('pause') ?>
            </button>

            <button class="player__button" type="button" data-player="mute" aria-label="Mute">
                <?= icon('volume') ?><?= icon('muted') ?>
            </button>
            <input class="player__range player__volume" type="range" min="0" max="1" step="0.05" value="1"
                   aria-label="Volume" data-player="volume">

            <span class="player__time" aria-hidden="true">
                <span data-player="current">0:00</span> / <span data-player="duration">0:00</span>
            </span>

            <span class="player__spacer"></span>

            <button class="player__button" type="button" data-player="speed" aria-label="Playback speed: 1×">1×</button>
            <button class="player__button" type="button" data-player="captions" aria-label="Captions" aria-pressed="false">
                <?= icon('captions') ?>
            </button>
            <button class="player__button" type="button" data-player="fullscreen" aria-label="Enter fullscreen">
                <?= icon('expand') ?><?= icon('collapse') ?>
            </button>
        </div>

        <p class="visually-hidden" aria-live="polite" data-player="status"></p>
    </div>
</template>
