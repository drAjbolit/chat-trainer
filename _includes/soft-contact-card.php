<?php
/**
 * /_includes/soft-contact-card.php
 * Версия 5 — редакционная вклейка / сноска.
 *
 * Стиль: заметна визуально, но не кричит, не ломает поток чтения.
 * Похоже на книжную вклейку или авторскую подсказку.
 *
 * VK URL (реальный с сайта):
 * https://vk.com/stodvaprocenta (из podval-universal.php:68)
 *
 * ПАРАМЕТР $cardVariant:
 * - 'choice' — для сомневающихся с выбором (по умолчанию)
 * - 'photo' — для тех, кто хочет показать темляк
 * - 'material' — для уточнения по отверстию/весу
 *
 * ПРАВИЛА ВСТАВКИ:
 * - НЕ вставлять в первую треть статьи
 * - НЕ вставлять внутрь списков, FAQ, HowTo-шагов, JSON-LD
 * - НЕ вставлять перед основным CTA (подвал с формой)
 * - Вставлять только после завершённого смыслового блока
 * - Предпочтительно после 55–70% основного текста
 */

$cardVariant = $cardVariant ?? 'choice';

$cardVariants = [
    'choice' => [
        'label' => 'Кстати',
        'title' => 'Если сомневаетесь с выбором бусины',
        'text' => 'Можно написать в VK и коротко описать, какой темляк вы делаете — подскажем, какая бусина подойдёт по размеру и стилю.',
        'button' => 'Спросить в VK'
    ],
    'photo' => [
        'label' => 'Подсказка',
        'title' => 'Можно показать темляк',
        'text' => 'Если уже есть шнур, нож или готовый темляк, пришлите фото в VK — так проще подобрать бусину по размеру и характеру.',
        'button' => 'Подобрать в VK'
    ],
    'material' => [
        'label' => 'На заметку',
        'title' => 'Не уверены по отверстию или весу?',
        'text' => 'Лучше уточнить до выбора: напишите в VK, какой шнур используете и где будет темляк — на ноже, ключах или подвесе.',
        'button' => 'Написать в VK'
    ]
];

$card = $cardVariants[$cardVariant] ?? $cardVariants['choice'];
$vkUrl = 'https://vk.com/stodvaprocenta';
?>
<aside class="soft-contact-insert" role="complementary" aria-label="Авторская подсказка">
  <div class="soft-contact-insert-header">
    <span class="soft-contact-insert-label"><?= htmlspecialchars($card['label'], ENT_QUOTES, 'UTF-8') ?></span>
  </div>
  <div class="soft-contact-insert-body">
    <h4 class="soft-contact-insert-title"><?= htmlspecialchars($card['title'], ENT_QUOTES, 'UTF-8') ?></h4>
    <p class="soft-contact-insert-text"><?= htmlspecialchars($card['text'], ENT_QUOTES, 'UTF-8') ?></p>
    <a href="<?= htmlspecialchars($vkUrl, ENT_QUOTES, 'UTF-8') ?>" class="soft-contact-insert-link" target="_blank" rel="noopener noreferrer"><?= htmlspecialchars($card['button'], ENT_QUOTES, 'UTF-8') ?></a>
  </div>
</aside>