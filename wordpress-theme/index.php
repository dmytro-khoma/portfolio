<?php
/**
 * Fallback template: blog index, archives, search results and anything
 * without a more specific template.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>
<section class="section">
    <div class="container">
        <header class="section__header">
            <?php if (is_home() && !is_front_page()) : ?>
                <h1><?php single_post_title(); ?></h1>
            <?php elseif (is_archive()) : ?>
                <?php the_archive_title('<h1>', '</h1>'); ?>
                <?php the_archive_description('<div class="lead">', '</div>'); ?>
            <?php elseif (is_search()) : ?>
                <?php /* translators: %s: search query */ ?>
                <h1><?php printf(esc_html__('Search results for “%s”', 'dk-portfolio'), esc_html(get_search_query())); ?></h1>
            <?php else : ?>
                <h1><?php esc_html_e('Latest posts', 'dk-portfolio'); ?></h1>
            <?php endif; ?>
        </header>

        <?php if (have_posts()) : ?>
            <ul class="auto-grid" role="list">
                <?php while (have_posts()) : the_post(); ?>
                    <li class="reveal"><?php get_template_part('template-parts/content', 'card'); ?></li>
                <?php endwhile; ?>
            </ul>

            <?php
            the_posts_pagination([
                'mid_size'  => 1,
                'prev_text' => __('Previous', 'dk-portfolio'),
                'next_text' => __('Next', 'dk-portfolio'),
            ]);
            ?>
        <?php else : ?>
            <?php get_template_part('template-parts/content', 'none'); ?>
        <?php endif; ?>
    </div>
</section>
<?php
get_footer();
