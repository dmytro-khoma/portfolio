<?php
/**
 * Front page: a hero built from the site title and tagline, the content of
 * the page set as "Homepage" (if any), and the three latest posts.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>
<section class="container hero" aria-labelledby="hero-title">
    <div class="stack stack--l">
        <h1 class="hero__title" id="hero-title"><?php bloginfo('name'); ?></h1>
        <?php if (get_bloginfo('description')) : ?>
            <p class="lead"><?php bloginfo('description'); ?></p>
        <?php endif; ?>
    </div>
</section>

<?php if (is_page() && have_posts()) : ?>
    <?php while (have_posts()) : the_post(); ?>
        <?php if (get_the_content() !== '') : ?>
            <section class="section">
                <div class="container entry-content">
                    <?php the_content(); ?>
                </div>
            </section>
        <?php endif; ?>
    <?php endwhile; ?>
<?php endif; ?>

<?php
$latest = new WP_Query([
    'posts_per_page'      => 3,
    'ignore_sticky_posts' => true,
    'no_found_rows'       => true, // no pagination needed: skips a COUNT query
]);

if ($latest->have_posts()) :
    ?>
    <section class="section" aria-labelledby="latest-title">
        <div class="container">
            <header class="section__header">
                <h2 id="latest-title"><?php esc_html_e('Latest posts', 'dk-portfolio'); ?></h2>
            </header>
            <ul class="auto-grid" role="list">
                <?php while ($latest->have_posts()) : $latest->the_post(); ?>
                    <li class="reveal"><?php get_template_part('template-parts/content', 'card'); ?></li>
                <?php endwhile; ?>
            </ul>
        </div>
    </section>
    <?php
    wp_reset_postdata();
endif;

get_footer();
