<?php
/**
 * Video facade markup, used by the [video_demo] shortcode.
 * Identical structure to the portfolio site, so the same CSS and JS apply.
 *
 * @package DK_Portfolio
 *
 * @var array{
 *     sources: list<array{src: string, type: string}>,
 *     poster: string, title: string, captions: string
 * } $args Passed by get_template_part().
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

$first = $args['sources'][0];
?>
<div class="video" data-video
     data-sources="<?php echo esc_attr(wp_json_encode($args['sources'])); ?>"
     data-poster="<?php echo esc_url($args['poster']); ?>"
     data-captions="<?php echo esc_url($args['captions']); ?>"
     data-title="<?php echo esc_attr($args['title']); ?>">
    <a class="video__facade" href="<?php echo esc_url($first['src']); ?>">
        <?php if ($args['poster'] !== '') : ?>
            <img class="video__poster" src="<?php echo esc_url($args['poster']); ?>" alt=""
                 loading="lazy" decoding="async" width="1280" height="720">
        <?php endif; ?>
        <span class="video__play" aria-hidden="true"><?php echo dkp_icon('play'); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
        <span class="video__label">
            <?php
            /* translators: %s: video title */
            printf(esc_html__('Play video: %s', 'dk-portfolio'), esc_html($args['title']));
            ?>
        </span>
    </a>
</div>
