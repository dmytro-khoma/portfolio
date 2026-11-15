<?php
/**
 * Site footer, the SVG icon sprite, and the closing document tags.
 */

declare(strict_types=1);

$source = config('links.source');
?>
    <footer class="site-footer">
        <div class="container site-footer__inner">
            <p>&copy; <?= e(date('Y')) ?> <?= e(config('name')) ?>. HTML, CSS, JavaScript, WebGL and PHP.</p>
            <p>
                <?php if ($source): ?>
                    <a href="<?= e($source) ?>">View the source code</a> ·
                <?php endif; ?>
                <?php if (config('links.github')): ?>
                    <a href="<?= e(config('links.github')) ?>">GitHub</a> ·
                <?php endif; ?>
                <a href="#top">Back to top</a>
            </p>
        </div>
    </footer>

    <?php render('partials/icons'); ?>
</body>
</html>
