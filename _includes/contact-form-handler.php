<?php
declare(strict_types=1);

require_once __DIR__ . '/contact-form-config.php';

function businka_cf_is_ajax(): bool
{
    $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    $accept        = $_SERVER['HTTP_ACCEPT'] ?? '';

    return strtolower((string)$requestedWith) === 'xmlhttprequest'
        || stripos((string)$accept, 'application/json') !== false;
}

function businka_cf_json_response(bool $success, string $message, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode([
        'success' => $success,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    exit;
}

function businka_cf_redirect_response(bool $success, string $message, string $returnUrl, string $formId): void
{
    $separator = (strpos($returnUrl, '?') !== false) ? '&' : '?';

    $url = $returnUrl
        . $separator
        . 'contact_form_status=' . ($success ? 'success' : 'error')
        . '&contact_form_target=' . rawurlencode($formId)
        . '&contact_form_message=' . rawurlencode($message)
        . '#' . rawurlencode($formId);

    header('Location: ' . $url, true, 303);
    exit;
}

function businka_cf_respond(bool $success, string $message, int $statusCode = 200, string $returnUrl = '/', string $formId = 'contact-form'): void
{
    if (businka_cf_is_ajax()) {
        businka_cf_json_response($success, $message, $statusCode);
    }

    businka_cf_redirect_response($success, $message, $returnUrl, $formId);
}

function businka_cf_clean_line(string $value, int $maxLength = 255): string
{
    $value = trim($value);
    $value = preg_replace('/[\r\n\t]+/u', ' ', $value);
    $value = preg_replace('/\s{2,}/u', ' ', $value);

    if (mb_strlen($value, 'UTF-8') > $maxLength) {
        $value = mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return $value;
}

function businka_cf_clean_text(string $value, int $maxLength = 3000): string
{
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = trim($value);
    $value = preg_replace("/\n{3,}/u", "\n\n", $value);

    if (mb_strlen($value, 'UTF-8') > $maxLength) {
        $value = mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return $value;
}

function businka_cf_validate_contact(string $contact, ?string &$replyTo = null): ?string
{
    $contact = trim($contact);
    $replyTo = null;

    if ($contact === '') {
        return null;
    }

    if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
        $replyTo = $contact;
        return $contact;
    }

    $telegram = preg_replace('~^https?://(?:www\.)?t\.me/~i', '@', $contact);
    $telegram = preg_replace('~^https?://(?:www\.)?telegram\.me/~i', '@', $telegram);
    $telegram = preg_replace('~^(telegram|tg)\s*:\s*~iu', '', $telegram);
    $telegram = trim((string)$telegram);

    if ($telegram !== '' && preg_match('/^@?[A-Za-z0-9_]{5,32}$/', $telegram)) {
        if ($telegram[0] !== '@') {
            $telegram = '@' . $telegram;
        }
        return $telegram;
    }

    return null;
}

function businka_cf_safe_return_url(string $url): string
{
    $url = trim($url);

    if ($url === '') {
        return '/';
    }

    $parts = parse_url($url);
    $host  = $_SERVER['HTTP_HOST'] ?? '102procenta.ru';

    if ($parts === false) {
        return '/';
    }

    if (isset($parts['host']) && strcasecmp($parts['host'], $host) !== 0) {
        return '/';
    }

    $path = $parts['path'] ?? '/';
    $query = '';

    if (!empty($parts['query'])) {
        parse_str($parts['query'], $queryParams);

        unset(
            $queryParams['contact_form_status'],
            $queryParams['contact_form_target'],
            $queryParams['contact_form_message']
        );

        if (!empty($queryParams)) {
            $query = '?' . http_build_query($queryParams);
        }
    }

    return $path . $query;
}

function businka_cf_verify_token(string $timestamp, string $itemTitle, string $context, string $pageUrl, string $token): bool
{
    if ($timestamp === '' || $token === '') {
        return false;
    }

    if (!ctype_digit($timestamp)) {
        return false;
    }

    $time = (int)$timestamp;
    $now  = time();

    if ($time < ($now - 7200) || $time > ($now + 300)) {
        return false;
    }

    $tokenData = implode('|', [$timestamp, $itemTitle, $context, $pageUrl]);
    $expected  = hash_hmac('sha256', $tokenData, BUSINKA_CONTACT_FORM_SECRET);

    return hash_equals($expected, $token);
}

function businka_cf_rate_limit(string $ip): bool
{
    $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'businka_contact_form';

    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }

    $file = $dir . DIRECTORY_SEPARATOR . 'rate_' . md5($ip) . '.txt';
    $now  = time();

    if (is_file($file)) {
        $last = (int)@file_get_contents($file);
        if ($last > 0 && ($now - $last) < 20) {
            return false;
        }
    }

    @file_put_contents($file, (string)$now, LOCK_EX);
    return true;
}

function businka_cf_encode_header(string $text): string
{
    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($text, 'UTF-8', 'B', "\r\n");
    }

    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    businka_cf_respond(false, 'Неверный метод запроса.', 405);
}

$formId    = businka_cf_clean_line($_POST['form_id'] ?? 'contact-form', 100);
$returnUrl = businka_cf_safe_return_url((string)($_POST['return_url'] ?? '/'));

if (!empty($_POST['website'] ?? '')) {
    businka_cf_respond(true, 'Сообщение принято.', 200, $returnUrl, $formId);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (!businka_cf_rate_limit($ip)) {
    businka_cf_respond(false, 'Слишком частая отправка. Подождите немного и попробуйте ещё раз.', 429, $returnUrl, $formId);
}

$name      = businka_cf_clean_line((string)($_POST['name'] ?? ''), 100);
$contact   = businka_cf_clean_line((string)($_POST['contact'] ?? ''), 190);
$message   = businka_cf_clean_text((string)($_POST['message'] ?? ''), 3000);
$itemTitle = businka_cf_clean_line((string)($_POST['item_title'] ?? ''), 255);
$context   = businka_cf_clean_line((string)($_POST['context'] ?? ''), 255);
$pageUrl   = trim((string)($_POST['page_url'] ?? ''));
$timestamp = trim((string)($_POST['timestamp'] ?? ''));
$token     = trim((string)($_POST['token'] ?? ''));

if (!businka_cf_verify_token($timestamp, $itemTitle, $context, $pageUrl, $token)) {
    businka_cf_respond(false, 'Ошибка проверки формы. Обновите страницу и попробуйте ещё раз.', 400, $returnUrl, $formId);
}

$replyTo = null;
$normalizedContact = businka_cf_validate_contact($contact, $replyTo);

if ($normalizedContact === null) {
    businka_cf_respond(false, 'Укажите корректный Telegram или email.', 422, $returnUrl, $formId);
}

if ($message === '' || mb_strlen($message, 'UTF-8') < 5) {
    businka_cf_respond(false, 'Сообщение слишком короткое.', 422, $returnUrl, $formId);
}

if (BUSINKA_CONTACT_FORM_RECIPIENT === 'ВАШ_EMAIL@example.com') {
    businka_cf_respond(false, 'В конфиге формы не указан email получателя.', 500, $returnUrl, $formId);
}

if (BUSINKA_CONTACT_FORM_SECRET === 'ЗАМЕНИТЕ_ЭТУ_СТРОКУ_НА_ДЛИННЫЙ_СЛУЧАЙНЫЙ_SECRET_МИНИМУМ_32_СИМВОЛА') {
    businka_cf_respond(false, 'В конфиге формы не задан secret.', 500, $returnUrl, $formId);
}

$subject = 'Вопрос с сайта 102%';
if ($itemTitle !== '') {
    $subject .= ' — ' . $itemTitle;
}

$siteHost = $_SERVER['HTTP_HOST'] ?? '102procenta.ru';
$dateText = date('d.m.Y H:i:s');

$bodyLines = [
    'На сайте отправлен новый вопрос.',
    '',
    'Дата: ' . $dateText,
    'Сайт: ' . $siteHost,
    'IP: ' . $ip,
    '',
    'Имя: ' . ($name !== '' ? $name : 'не указано'),
    'Контакт: ' . $normalizedContact,
    'Изделие: ' . ($itemTitle !== '' ? $itemTitle : 'не указано'),
    'Контекст: ' . ($context !== '' ? $context : 'не указан'),
    'Страница: ' . ($pageUrl !== '' ? $pageUrl : 'не указана'),
    '',
    'Сообщение:',
    $message,
    '',
];

$body = implode("\n", $bodyLines);

$fromName   = businka_cf_encode_header(BUSINKA_CONTACT_FORM_FROM_NAME);
$fromEmail  = BUSINKA_CONTACT_FORM_FROM_EMAIL;
$subjectEnc = businka_cf_encode_header($subject);

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';

if ($replyTo !== null) {
    $headers[] = 'Reply-To: ' . $replyTo;
}

$headers[] = 'X-Mailer: PHP/' . phpversion();

$sent = @mail(
    BUSINKA_CONTACT_FORM_RECIPIENT,
    $subjectEnc,
    $body,
    implode("\r\n", $headers)
);

if (!$sent) {
    businka_cf_respond(false, 'Не удалось отправить сообщение. Проверьте настройки почты на сервере.', 500, $returnUrl, $formId);
}

businka_cf_respond(true, 'Ваш вопрос отправлен. Я свяжусь с Вами по указанному контакту.', 200, $returnUrl, $formId);
