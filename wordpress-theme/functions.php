<?php
/**
 * DK Portfolio theme functions.
 *
 * - Theme supports and menu locations
 * - Asset loading the WordPress way (wp_enqueue_style / script modules)
 * - Small markup filters so WordPress output matches the BEM classes
 * - The [video_demo] shortcode (inc/video-demo-shortcode.php)
 *
 * All functions are prefixed with dkp_ to avoid clashes with plugins.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit; // No direct access.
}

require_once get_theme_file_path('inc/video-demo-shortcode.php');

/**
 * Register theme features.
 */
function dkp_setup(): void
{
    load_theme_textdomain('dk-portfolio', get_theme_file_path('languages'));

    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('automatic-feed-links');
    add_theme_support('responsive-embeds');
    add_theme_support('html5', ['search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets']);

    register_nav_menus([
        'primary' => __('Primary menu', 'dk-portfolio'),
    ]);
}
add_action('after_setup_theme', 'dkp_setup');

/**
 * Version string for an asset: its modification time, so browsers re-fetch
 * a file exactly when it changes.
 */
function dkp_asset_version(string $relativePath): string
{
    $file = get_theme_file_path($relativePath);

    return is_file($file) ? (string) filemtime($file) : wp_get_theme()->get('Version');
}

/**
 * Enqueue styles and scripts.
 *
 * - One shared design-system stylesheet + a small WordPress layer.
 * - One ES module (WordPress 6.5+ script modules API). Modules are deferred,
 *   so nothing blocks rendering. The heavy video player is not loaded here;
 *   it is imported on demand when someone presses play.
 * - The block library CSS is kept, because posts may use blocks.
 */
function dkp_enqueue_assets(): void
{
    wp_enqueue_style(
        'dkp-design-system',
        get_theme_file_uri('assets/css/design-system.css'),
        [],
        dkp_asset_version('assets/css/design-system.css'),
    );

    wp_enqueue_style(
        'dkp-wordpress',
        get_theme_file_uri('assets/css/wordpress.css'),
        ['dkp-design-system'],
        dkp_asset_version('assets/css/wordpress.css'),
    );

    wp_enqueue_script_module(
        'dkp-main',
        get_theme_file_uri('assets/js/theme-main.js'),
        [],
        dkp_asset_version('assets/js/theme-main.js'),
    );
}
add_action('wp_enqueue_scripts', 'dkp_enqueue_assets');

/**
 * Apply the saved colour theme before first paint (no flash of the wrong
 * theme). Printed with wp_print_inline_script_tag() so security plugins
 * can add a CSP nonce through the wp_inline_script_attributes filter.
 */
function dkp_theme_init_script(): void
{
    wp_print_inline_script_tag(
        "(function(){var r=document.documentElement;r.classList.add('has-js');"
        . "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')r.dataset.theme=t;}catch(e){}})();"
    );
}
add_action('wp_head', 'dkp_theme_init_script', 1);

/**
 * Add the BEM link class to menu links.
 *
 * @param array<string, string> $atts
 * @return array<string, string>
 */
function dkp_nav_link_attributes(array $atts, WP_Post $item, stdClass $args): array
{
    if (($args->theme_location ?? '') === 'primary') {
        $atts['class'] = trim(($atts['class'] ?? '') . ' site-nav__link');
    }

    return $atts;
}
add_filter('nav_menu_link_attributes', 'dkp_nav_link_attributes', 10, 3);

/**
 * Print the SVG icon sprite once, at the end of the page.
 */
function dkp_print_icons(): void
{
    get_template_part('template-parts/icons');
}
add_action('wp_footer', 'dkp_print_icons');

/**
 * Inline SVG icon from the sprite.
 */
function dkp_icon(string $name): string
{
    return sprintf(
        '<svg class="icon icon--%1$s" aria-hidden="true" focusable="false"><use href="#i-%1$s"></use></svg>',
        esc_attr($name),
    );
}

/**
 * Shorter, cleaner excerpts for the post cards.
 */
function dkp_excerpt_length(): int
{
    return 28;
}
add_filter('excerpt_length', 'dkp_excerpt_length');

function dkp_excerpt_more(): string
{
    return '…';
}
add_filter('excerpt_more', 'dkp_excerpt_more');
