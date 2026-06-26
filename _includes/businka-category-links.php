<?php
// /_includes/businka-category-links.php
$currentPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';

$categoryLinks = [
    [
        'href' => '/businka/categories/businka-category-all.html',
        'label' => 'Смотреть все',
    ],
    [
        'href' => '/businka/categories/businka-category-chb.html',
        'label' => 'Металл с патиной',
    ],
    [
        'href' => '/businka/categories/businka-category-person.html',
        'label' => 'Бусины персонажи',
    ],
    [
        'href' => '/businka/categories/businka-category-metal.html',
        'label' => 'Металл с ручной росписью',
    ],
    [
        'href' => '/businka/categories/businka-category-uv.html',
        'label' => 'УФ-смола с покрасом',
    ],
];
?>
<div class="category-section">
  <div class="category-links">
    <?php foreach ($categoryLinks as $link): ?>
      <?php $isActive = $currentPath === $link['href']; ?>
      <a
        href="<?= htmlspecialchars($link['href'], ENT_QUOTES, 'UTF-8') ?>"
        class="category-btn<?= $isActive ? ' active' : '' ?>"
        <?= $isActive ? 'aria-current="page"' : '' ?>
      ><?= htmlspecialchars($link['label'], ENT_QUOTES, 'UTF-8') ?></a>
    <?php endforeach; ?>
  </div>
</div>
