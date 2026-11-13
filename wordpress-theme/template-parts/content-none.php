<?php
/**
 * Shown when a query returns no posts.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="prose">
    <?php if (is_search()) : ?>
        <p><?php esc_html_e('Nothing matched your search. Please try different words.', 'dk-portfolio'); ?></p>
        <?php get_search_form(); ?>
    <?php else : ?>
        <p><?php esc_html_e('There is nothing here yet.', 'dk-portfolio'); ?></p>
    <?php endif; ?>
</div>
