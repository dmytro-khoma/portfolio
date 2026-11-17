<?php
/**
 * Contact section and form.
 *
 * The form works without JavaScript: it posts to contact.php, which
 * redirects back here with a flashed $result (status, message, errors and
 * the old input). With JavaScript, js/contact-form.js sends the same form
 * with fetch() and shows the same messages without a page reload.
 *
 * Validation rules are written once as HTML attributes (required,
 * maxlength, type="email") and re-checked on the server.
 *
 * @var array{status?: string, message?: string, errors?: array<string, string>, old?: array<string, string>} $result
 */

declare(strict_types=1);

$errors = $result['errors'] ?? [];
$old    = $result['old'] ?? [];
$status = $result['status'] ?? '';

/** Attributes that connect a field with its error message. */
$invalid = static fn (string $field): string => isset($errors[$field])
    ? 'aria-invalid="true" aria-describedby="' . e($field) . '-error"'
    : 'aria-describedby="' . e($field) . '-error"';

$email = config('email');
$github = config('links.github');
$linkedin = config('links.linkedin');
?>
<section class="section" id="contact" aria-labelledby="contact-title">
    <div class="container">
        <?php /* Decoration. With the 3D scene the particles spell these words
                 inside this box; without it the outlined text is shown. */ ?>
        <div class="fx-spot" aria-hidden="true" data-fx-anchor="text">
            <span class="fx-spot__text">Let’s talk</span>
        </div>
    </div>
    <div class="container contact">
        <div class="stack stack--m reveal">
            <p class="eyebrow">Contact</p>
            <h2 id="contact-title">Write to me</h2>
            <p class="lead">Have a job, a project or a question? Send a message here or e-mail me. Remote or on site in Bratislava.</p>

            <?php if ($email || $github || $linkedin): ?>
                <ul class="stack" role="list">
                    <?php if ($email): ?>
                        <li><a href="mailto:<?= e($email) ?>"><?= e($email) ?></a></li>
                    <?php endif; ?>
                    <?php if ($github): ?>
                        <li><a href="<?= e($github) ?>">GitHub</a></li>
                    <?php endif; ?>
                    <?php if ($linkedin): ?>
                        <li><a href="<?= e($linkedin) ?>">LinkedIn</a></li>
                    <?php endif; ?>
                </ul>
            <?php endif; ?>
        </div>

        <form class="form" action="contact.php" method="post" data-contact-form>
            <div class="alert <?= $status === 'success' ? 'alert--success' : ($status ? 'alert--error' : '') ?>"
                 role="status" aria-live="polite" tabindex="-1" data-form-status><?= e($result['message'] ?? '') ?></div>

            <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">

            <div class="form__row">
                <div class="field">
                    <label class="field__label" for="name">Name</label>
                    <input class="field__input" id="name" name="name" type="text" required
                           maxlength="<?= ContactForm::NAME_MAX ?>" autocomplete="name"
                           value="<?= e($old['name'] ?? '') ?>" <?= $invalid('name') ?>>
                    <p class="field__error" id="name-error"><?= e($errors['name'] ?? '') ?></p>
                </div>

                <div class="field">
                    <label class="field__label" for="email">E-mail</label>
                    <input class="field__input" id="email" name="email" type="email" required
                           maxlength="<?= ContactForm::EMAIL_MAX ?>" autocomplete="email" spellcheck="false"
                           value="<?= e($old['email'] ?? '') ?>" <?= $invalid('email') ?>>
                    <p class="field__error" id="email-error"><?= e($errors['email'] ?? '') ?></p>
                </div>
            </div>

            <div class="field">
                <label class="field__label" for="message">Message</label>
                <textarea class="field__input" id="message" name="message" rows="6" required
                          minlength="<?= ContactForm::MESSAGE_MIN ?>" maxlength="<?= ContactForm::MESSAGE_MAX ?>"
                          <?= $invalid('message') ?>><?= e($old['message'] ?? '') ?></textarea>
                <p class="field__error" id="message-error"><?= e($errors['message'] ?? '') ?></p>
            </div>

            <!-- Honeypot: real visitors never see or fill this field. -->
            <div class="field field--trap" aria-hidden="true">
                <label for="website">Leave this field empty</label>
                <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
            </div>

            <div class="form__footer">
                <p class="form__note">All fields are required. I only keep your message so I can reply.</p>
                <button class="button button--primary" type="submit" data-submit>Send message</button>
            </div>
        </form>
    </div>
</section>
