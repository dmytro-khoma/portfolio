<?php
/**
 * Player UI template (printed once in the footer by the [video_demo]
 * shortcode). Same markup as the portfolio site, with translatable labels.
 * assets/js/video-player.js clones it around the <video> element.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}
?>
<template id="player-template">
    <div class="player" data-state="paused" tabindex="-1">
        <div class="player__controls" role="group" aria-label="<?php esc_attr_e('Video controls', 'dk-portfolio'); ?>">
            <input class="player__range player__seek" type="range" min="0" max="100" step="0.1" value="0"
                   aria-label="<?php esc_attr_e('Seek', 'dk-portfolio'); ?>" data-player="seek">

            <button class="player__button" type="button" data-player="play" aria-label="<?php esc_attr_e('Play', 'dk-portfolio'); ?>">
                <?php echo dkp_icon('play') . dkp_icon('pause'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
            </button>

            <button class="player__button" type="button" data-player="mute" aria-label="<?php esc_attr_e('Mute', 'dk-portfolio'); ?>">
                <?php echo dkp_icon('volume') . dkp_icon('muted'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
            </button>
            <input class="player__range player__volume" type="range" min="0" max="1" step="0.05" value="1"
                   aria-label="<?php esc_attr_e('Volume', 'dk-portfolio'); ?>" data-player="volume">

            <span class="player__time" aria-hidden="true">
                <span data-player="current">0:00</span> / <span data-player="duration">0:00</span>
            </span>

            <span class="player__spacer"></span>

            <button class="player__button" type="button" data-player="speed" aria-label="<?php esc_attr_e('Playback speed: 1×', 'dk-portfolio'); ?>">1×</button>
            <button class="player__button" type="button" data-player="captions" aria-label="<?php esc_attr_e('Captions', 'dk-portfolio'); ?>" aria-pressed="false">
                <?php echo dkp_icon('captions'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
            </button>
            <button class="player__button" type="button" data-player="fullscreen" aria-label="<?php esc_attr_e('Enter fullscreen', 'dk-portfolio'); ?>">
                <?php echo dkp_icon('expand') . dkp_icon('collapse'); // phpcs:ignore WordPress.Security.EscapeOutput ?>
            </button>
        </div>

        <p class="visually-hidden" aria-live="polite" data-player="status"></p>
    </div>
</template>
