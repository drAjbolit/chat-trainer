<?php
$backButtonTitle = $backButtonTitle ?? 'Назад';
$backButtonFallback = $backButtonFallback ?? '/businka/';
$backButtonId = $backButtonId ?? '';
$backButtonExtraClass = $backButtonExtraClass ?? '';

$idAttr = $backButtonId !== '' ? ' id="' . htmlspecialchars($backButtonId, ENT_QUOTES, 'UTF-8') . '"' : '';
$classAttr = trim('back-to-expo js-smart-back ' . $backButtonExtraClass);
?>
<a href="<?php echo htmlspecialchars($backButtonFallback, ENT_QUOTES, 'UTF-8'); ?>"
   class="<?php echo htmlspecialchars($classAttr, ENT_QUOTES, 'UTF-8'); ?>"
   data-fallback="<?php echo htmlspecialchars($backButtonFallback, ENT_QUOTES, 'UTF-8'); ?>"
   title="<?php echo htmlspecialchars($backButtonTitle, ENT_QUOTES, 'UTF-8'); ?>"<?php echo $idAttr; ?>>←</a>