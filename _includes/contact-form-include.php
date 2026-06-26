<?php
declare(strict_types=1);

require_once __DIR__ . '/contact-form-config.php';

if (!function_exists('businka_cf_h')) {
    function businka_cf_h(?string $value): string
    {
        return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

if (!function_exists('businka_cf_current_scheme')) {
    function businka_cf_current_scheme(): string
    {
        $https = $_SERVER['HTTPS'] ?? '';
        $forwarded = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';

        if ($https === 'on' || $https === '1' || strtolower((string)$forwarded) === 'https') {
            return 'https';
        }

        return 'http';
    }
}

$currentScheme = businka_cf_current_scheme();
$currentHost   = $_SERVER['HTTP_HOST'] ?? '102procenta.ru';
$currentUri    = $_SERVER['REQUEST_URI'] ?? '/';
$currentPath   = strtok($currentUri, '?') ?: '/';

$contactFormHeading    = $contactFormHeading ?? 'Задать вопрос по изделию';
$contactFormSubheading = $contactFormSubheading ?? 'Оставьте Telegram или email и напишите, что Вас интересует.';
$contactFormButtonText = $contactFormButtonText ?? 'Отправить вопрос';
$contactFormItemTitle  = trim((string)($contactFormItemTitle ?? ''));
$contactFormContext    = trim((string)($contactFormContext ?? ''));
$contactFormPageUrl    = trim((string)($contactFormPageUrl ?? ($currentScheme . '://' . $currentHost . $currentPath)));
$contactFormReturnUrl  = trim((string)($contactFormReturnUrl ?? ($currentScheme . '://' . $currentHost . $currentPath)));
$contactFormCompact    = !empty($contactFormCompact);

$formIdSeed = $contactFormItemTitle . '|' . $contactFormContext . '|' . $contactFormPageUrl;
$contactFormId = $contactFormId ?? ('contact-form-' . substr(md5($formIdSeed !== '||' ? $formIdSeed : $currentPath), 0, 10));

$timestamp = (string) time();
$tokenData = implode('|', [$timestamp, $contactFormItemTitle, $contactFormContext, $contactFormPageUrl]);
$token     = hash_hmac('sha256', $tokenData, BUSINKA_CONTACT_FORM_SECRET);

$statusTarget = $_GET['contact_form_target'] ?? '';
$statusValue  = $_GET['contact_form_status'] ?? '';
$statusText   = $_GET['contact_form_message'] ?? '';

$showStatus = ($statusTarget === $contactFormId) && in_array($statusValue, ['success', 'error'], true);

if (!defined('BUSINKA_CONTACT_FORM_ASSETS_INCLUDED')) {
    define('BUSINKA_CONTACT_FORM_ASSETS_INCLUDED', true);
    ?>
    <link rel="stylesheet" href="/css/contact-form.css">
    <script src="/js/contact-form.js" defer></script>
    <?php
}
?>

<div class="businka-contact-form-wrapper<?php echo $contactFormCompact ? ' compact' : ''; ?>" id="<?php echo businka_cf_h($contactFormId); ?>">
    <div class="businka-contact-form-card">
        <div class="businka-contact-form-head">
            <h3><?php echo businka_cf_h($contactFormHeading); ?></h3>

            <?php if ($contactFormSubheading !== ''): ?>
                <p class="businka-contact-form-subheading"><?php echo businka_cf_h($contactFormSubheading); ?></p>
            <?php endif; ?>

            <?php if ($contactFormItemTitle !== ''): ?>
                <p class="businka-contact-form-item">
                    Вопрос по изделию: <strong><?php echo businka_cf_h($contactFormItemTitle); ?></strong>
                </p>
            <?php endif; ?>
        </div>

        <?php if ($showStatus): ?>
            <div class="businka-contact-form-notice <?php echo $statusValue === 'success' ? 'success' : 'error'; ?>">
                <?php
                if ($statusValue === 'success') {
                    echo 'Ваш вопрос отправлен. Я свяжусь с Вами по указанному контакту.';
                } else {
                    echo businka_cf_h($statusText !== '' ? $statusText : 'Не удалось отправить сообщение. Попробуйте ещё раз.');
                }
                ?>
            </div>
        <?php endif; ?>

        <form
            class="businka-contact-form js-businka-contact-form"
            method="post"
            action="/_includes/contact-form-handler.php"
            novalidate
        >
            <div class="businka-contact-form-grid">
                <div class="field">
                    <label for="<?php echo businka_cf_h($contactFormId); ?>-name">Имя или псевдоним</label>
                    <input
                        type="text"
                        id="<?php echo businka_cf_h($contactFormId); ?>-name"
                        name="name"
                        maxlength="100"
                        placeholder="Необязательно"
                    >
                </div>

                <div class="field">
                    <label for="<?php echo businka_cf_h($contactFormId); ?>-contact">Telegram или email <span>*</span></label>
                    <input
                        type="text"
                        id="<?php echo businka_cf_h($contactFormId); ?>-contact"
                        name="contact"
                        maxlength="190"
                        placeholder="@username или email@example.com"
                        required
                    >
                </div>

                <div class="field field-message">
                    <label for="<?php echo businka_cf_h($contactFormId); ?>-message">Ваш вопрос <span>*</span></label>
                    <textarea
                        id="<?php echo businka_cf_h($contactFormId); ?>-message"
                        name="message"
                        rows="6"
                        maxlength="3000"
                        placeholder="Например: можно ли сделать такую же бусину в другом цвете, какой срок изготовления, есть ли в наличии..."
                        required
                    ></textarea>
                </div>
            </div>

            <input type="hidden" name="item_title" value="<?php echo businka_cf_h($contactFormItemTitle); ?>">
            <input type="hidden" name="context" value="<?php echo businka_cf_h($contactFormContext); ?>">
            <input type="hidden" name="page_url" value="<?php echo businka_cf_h($contactFormPageUrl); ?>">
            <input type="hidden" name="return_url" value="<?php echo businka_cf_h($contactFormReturnUrl); ?>">
            <input type="hidden" name="form_id" value="<?php echo businka_cf_h($contactFormId); ?>">
            <input type="hidden" name="timestamp" value="<?php echo businka_cf_h($timestamp); ?>">
            <input type="hidden" name="token" value="<?php echo businka_cf_h($token); ?>">

            <div class="businka-contact-form-honeypot" aria-hidden="true">
                <label for="<?php echo businka_cf_h($contactFormId); ?>-website">Website</label>
                <input
                    type="text"
                    id="<?php echo businka_cf_h($contactFormId); ?>-website"
                    name="website"
                    tabindex="-1"
                    autocomplete="off"
                >
            </div>

            <div class="businka-contact-form-footer">
                <button type="submit" class="businka-contact-form-button">
                    <?php echo businka_cf_h($contactFormButtonText); ?>
                </button>

                <div class="businka-contact-form-response" aria-live="polite"></div>
            </div>
        </form>
    </div>
</div>
