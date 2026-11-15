<?php
/**
 * Decorative marquee: two crossed bands with the tools and a few words.
 *
 * Hidden from screen readers (the same tools are listed in the Skills
 * section). It moves with a plain CSS animation; js/effects.js only speeds
 * it up and reverses it with the scroll velocity.
 *
 * @var list<string> $tools
 */

declare(strict_types=1);

$words = ['Interactive', 'WebGL', 'Accessible', 'Fast', 'Readable code'];

/** One row repeated twice, so a -50% translate loops seamlessly. */
$row = static function (array $items): string {
    $html = '';
    foreach ([1, 2] as $_) {
        foreach ($items as $item) {
            $html .= '<span class="fx-marquee__item">' . e($item) . '</span>';
        }
    }
    return $html;
};
?>
<div class="fx-marquee" aria-hidden="true" data-fx-marquee>
    <div class="fx-marquee__band fx-marquee__band--b"><div class="fx-marquee__row"><?= $row($words) ?></div></div>
    <div class="fx-marquee__band fx-marquee__band--a"><div class="fx-marquee__row"><?= $row($tools) ?></div></div>
</div>
