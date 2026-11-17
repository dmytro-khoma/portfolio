<?php
/**
 * Front controller for the single-page portfolio.
 *
 * Loads data, reads any flashed contact-form result (for visitors without
 * JavaScript, see contact.php) and renders the page from small templates.
 */

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

$nav = [
    ['id' => 'projects', 'label' => 'Projects'],
    ['id' => 'skills',   'label' => 'Skills'],
    ['id' => 'about',    'label' => 'About'],
    ['id' => 'contact',  'label' => 'Contact'],
];

$skills   = require APP_ROOT . '/data/skills.php';
$projects = require APP_ROOT . '/data/projects.php';

// Result of a non-JS form submission: status, message, errors, old input.
$contactResult = flash_get('contact');

render('partials/header', ['nav' => $nav]);
?>
<main id="main">
    <?php
    render('sections/hero');
    render('sections/projects', ['projects' => $projects]);
    render('sections/skills', ['skills' => $skills]);
    render('sections/about');
    render('sections/contact', ['result' => is_array($contactResult) ? $contactResult : []]);
    ?>
</main>
<?php
render('partials/footer');
