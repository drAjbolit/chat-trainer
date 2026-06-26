<?php
declare(strict_types=1);

/*
 |------------------------------------------------------------
 | Основные настройки формы
 |------------------------------------------------------------
 |
 | 1. Укажите Ваш email, куда будут приходить письма.
 | 2. Обязательно замените SECRET на свою длинную случайную строку.
 | 3. FROM_EMAIL желательно использовать на домене сайта.
 |
 */

if (!defined('BUSINKA_CONTACT_FORM_RECIPIENT')) {
    define('BUSINKA_CONTACT_FORM_RECIPIENT', 'jahont@inbox.ru');
}

if (!defined('BUSINKA_CONTACT_FORM_SECRET')) {
    define('BUSINKA_CONTACT_FORM_SECRET', '12345678910111211234567891011121');
}

if (!defined('BUSINKA_CONTACT_FORM_FROM_EMAIL')) {
    define('BUSINKA_CONTACT_FORM_FROM_EMAIL', 'no-reply@102procenta.ru');
}

if (!defined('BUSINKA_CONTACT_FORM_FROM_NAME')) {
    define('BUSINKA_CONTACT_FORM_FROM_NAME', 'Сайт мастерской 102%');
}
