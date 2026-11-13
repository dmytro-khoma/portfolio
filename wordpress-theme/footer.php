<?php
/**
 * Site footer. Closes <main> opened in header.php.
 *
 * @package DK_Portfolio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}
?>
</main>

<footer class="site-footer">
    <div class="container site-footer__inner">
        <p>&copy; <?php echo esc_html(wp_date('Y')); ?> <?php bloginfo('name'); ?></p>
        <p><a href="#top"><?php esc_html_e('Back to top', 'dk-portfolio'); ?></a></p>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
