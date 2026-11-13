<?php
/**
 * Post card used in lists (blog index, archives, front page).
 * Reuses the project-card component from the design system.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}
?>
<article id="post-<?php the_ID(); ?>" <?php post_class('project-card'); ?>>
    <div class="project-card__inner">
        <?php if (has_post_thumbnail()) : ?>
            <div class="project-card__media">
                <?php the_post_thumbnail('medium_large', ['loading' => 'lazy', 'decoding' => 'async', 'alt' => '']); ?>
            </div>
        <?php endif; ?>

        <div class="project-card__body">
            <p class="project-card__meta">
                <time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date()); ?></time>
            </p>
            <h3 class="project-card__title">
                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
            </h3>
            <div class="project-card__text"><?php the_excerpt(); ?></div>
        </div>
    </div>
</article>
