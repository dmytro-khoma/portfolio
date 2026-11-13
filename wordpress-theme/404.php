<?php
/**
 * 404 page: a short message, a search form and a link home.
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
    <div class="container prose">
        <p class="eyebrow">404</p>
        <h1><?php esc_html_e('This page doesn’t exist', 'dk-portfolio'); ?></h1>
        <p><?php esc_html_e('The link may be old, or the address has a typo. You can search the site instead:', 'dk-portfolio'); ?></p>
        <?php get_search_form(); ?>
        <p><a href="<?php echo esc_url(home_url('/')); ?>"><?php esc_html_e('Go to the home page', 'dk-portfolio'); ?></a></p>
    </div>
</section>
<?php
get_footer();
