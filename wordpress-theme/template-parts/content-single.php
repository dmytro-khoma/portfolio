<?php
/**
 * Full post or page content.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}
?>
<article id="post-<?php the_ID(); ?>" <?php post_class('section'); ?>>
    <div class="container">
        <header class="section__header">
            <?php if (is_singular('post')) : ?>
                <p class="eyebrow">
                    <time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date()); ?></time>
                </p>
            <?php endif; ?>
            <?php the_title('<h1>', '</h1>'); ?>
        </header>

        <?php if (has_post_thumbnail()) : ?>
            <figure class="entry-thumbnail">
                <?php the_post_thumbnail('large', ['decoding' => 'async', 'fetchpriority' => 'high']); ?>
            </figure>
        <?php endif; ?>

        <div class="entry-content">
            <?php
            the_content();
            wp_link_pages([
                'before' => '<nav class="page-links" aria-label="' . esc_attr__('Page', 'dk-portfolio') . '">',
                'after'  => '</nav>',
            ]);
            ?>
        </div>

        <?php if (is_singular('post')) : ?>
            <?php
            the_post_navigation([
                'prev_text' => '<span class="eyebrow">' . esc_html__('Previous', 'dk-portfolio') . '</span> %title',
                'next_text' => '<span class="eyebrow">' . esc_html__('Next', 'dk-portfolio') . '</span> %title',
            ]);
            ?>
        <?php endif; ?>
    </div>
</article>
