<?php
/**
 * [video_demo] shortcode.
 *
 * Usage in a post or page:
 *
 *   [video_demo url="https://example.com/video.mp4"]
 *   [video_demo url="…/video.mp4" poster="…/poster.jpg" title="Product tour" captions="…/captions.vtt"]
 *
 * Output: the same lightweight facade as on the portfolio site. Nothing
 * from the video is downloaded until the visitor presses play; then the
 * custom player (assets/js/video-player.js) is loaded and takes over.
 * Without JavaScript, the facade is a plain link to the video file.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

/** Video formats the shortcode accepts, by MIME type. */
const DKP_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

/**
 * Render the shortcode.
 *
 * @param array<string, string>|string $atts Raw attributes from the editor.
 */
function dkp_video_demo_shortcode(array|string $atts): string
{
    $atts = shortcode_atts(
        [
            'url'      => '',
            'poster'   => '',
            'title'    => __('Video', 'dk-portfolio'),
            'captions' => '',
        ],
        is_array($atts) ? $atts : [],
        'video_demo',
    );

    $url  = esc_url_raw($atts['url'], ['http', 'https']);
    $type = wp_check_filetype((string) wp_parse_url($url, PHP_URL_PATH))['type'] ?? '';

    // Invalid input: show a hint to editors, nothing to visitors.
    if ($url === '' || !in_array($type, DKP_VIDEO_TYPES, true)) {
        return current_user_can('edit_posts')
            ? '<p class="alert alert--error">' . esc_html__('[video_demo] needs a url to an .mp4, .webm or .ogv file.', 'dk-portfolio') . '</p>'
            : '';
    }

    // The player UI template is printed once in the footer, only on pages
    // that actually use the shortcode.
    if (!has_action('wp_footer', 'dkp_print_player_template')) {
        add_action('wp_footer', 'dkp_print_player_template');
    }

    ob_start();
    get_template_part('template-parts/video-facade', null, [
        'sources'  => [['src' => $url, 'type' => $type]],
        'poster'   => esc_url_raw($atts['poster']),
        'title'    => sanitize_text_field($atts['title']),
        'captions' => esc_url_raw($atts['captions']),
    ]);

    return (string) ob_get_clean();
}
add_shortcode('video_demo', 'dkp_video_demo_shortcode');

function dkp_print_player_template(): void
{
    get_template_part('template-parts/player-template');
}
