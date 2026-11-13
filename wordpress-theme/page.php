<?php
/**
 * Static page. Same layout as a single post, without post meta.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

get_header();

while (have_posts()) :
    the_post();
    get_template_part('template-parts/content', 'single');
endwhile;

get_footer();
