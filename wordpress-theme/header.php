<?php
/**
 * Site header: document head, skip link, logo and primary menu.
 *
 * Same markup and classes as the portfolio site, so the shared design
 * system and nav.js work here unchanged.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main"><?php esc_html_e('Skip to content', 'dk-portfolio'); ?></a>
<div class="progress-bar" aria-hidden="true"></div>

<header class="site-header">
    <div class="container site-header__inner">
        <a class="brand" href="<?php echo esc_url(home_url('/')); ?>" rel="home">
            <?php bloginfo('name'); ?>
        </a>

        <?php if (has_nav_menu('primary')) : ?>
            <nav class="site-nav" aria-label="<?php esc_attr_e('Main', 'dk-portfolio'); ?>">
                <?php
                wp_nav_menu([
                    'theme_location' => 'primary',
                    'container'      => false,
                    'menu_id'        => 'site-nav-list',
                    'menu_class'     => 'site-nav__list',
                    'items_wrap'     => '<ul id="%1$s" class="%2$s" role="list">%3$s</ul>',
                    'depth'          => 1,
                    'fallback_cb'    => false,
                ]);
                ?>
            </nav>
        <?php endif; ?>

        <div class="site-header__actions">
            <button class="icon-button theme-toggle" type="button" data-theme-toggle
                    aria-label="<?php esc_attr_e('Switch colour theme', 'dk-portfolio'); ?>">
                <?php echo dkp_icon('moon') . dkp_icon('sun'); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in dkp_icon() ?>
            </button>
            <?php if (has_nav_menu('primary')) : ?>
                <button class="icon-button site-nav__toggle" type="button" data-nav-toggle
                        aria-controls="site-nav-list" aria-expanded="false"
                        aria-label="<?php esc_attr_e('Menu', 'dk-portfolio'); ?>">
                    <?php echo dkp_icon('menu') . dkp_icon('close'); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in dkp_icon() ?>
                </button>
            <?php endif; ?>
        </div>
    </div>
</header>

<main id="main">
