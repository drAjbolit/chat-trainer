<?php
/**
 * /_includes/podval-universal.php
 * Версия 12 — правая колонка подвала заменена на форму вопроса.
 */

$sellerDefaults = [
    'status'   => 'Самозанятый',
    'name'     => 'Гусаров Михаил Андреевич',
    'inn'      => '910906196346',
    'phone'    => '+7 978 569-76-68',
    'email'    => 'jahont@inbox.ru',
    'region'   => 'Россия',
    'hours'    => 'Пн–Вс, 11:00–20:00',
    'payment'  => 'онлайн, выдаю чек.',
    'delivery' => 'Отправка по России. СДЭК',
    'returns'  => 'Возврат и обмен — по закону.',
];

$seller = $sellerDefaults;

if (isset($sellerInfo) && is_array($sellerInfo)) {
    $seller = array_merge($seller, $sellerInfo);
}

$phoneHref = preg_replace('/[^\d\+]/', '', (string) $seller['phone']);
$emailEsc = htmlspecialchars((string) $seller['email'], ENT_QUOTES, 'UTF-8');
?>
<footer class="podval-universal">
  <div class="podval-layout">
    <div class="seller-card" aria-label="Сведения о продавце">
      <div class="seller-row seller-row-single seller-row-head">
        <div class="seller-head-inline">
          <span class="seller-text seller-text-head">
            <strong><?= htmlspecialchars($seller['status'], ENT_QUOTES, 'UTF-8') ?>:</strong>
            <?= htmlspecialchars($seller['name'], ENT_QUOTES, 'UTF-8') ?>
          </span>
          <a href="/businka/articles/about/" class="seller-mini-button">О мастерской</a>
        </div>
      </div>

      <div class="seller-row seller-row-single">
        <span class="seller-text">
          <strong>ИНН:</strong> <?= htmlspecialchars($seller['inn'], ENT_QUOTES, 'UTF-8') ?>
        </span>
      </div>

      <div class="seller-row seller-row-contacts">
        <a
          class="seller-mini-button seller-contact-chip"
          href="tel:<?= htmlspecialchars($phoneHref, ENT_QUOTES, 'UTF-8') ?>"
          aria-label="Позвонить по номеру <?= htmlspecialchars($seller['phone'], ENT_QUOTES, 'UTF-8') ?>">
          <span aria-hidden="true">☎</span>
          <span><?= htmlspecialchars($seller['phone'], ENT_QUOTES, 'UTF-8') ?></span>
        </a>

        <button
          type="button"
          class="seller-mini-button seller-contact-chip copy-email-trigger"
          data-copy-email="<?= $emailEsc ?>"
          aria-label="Скопировать e-mail <?= $emailEsc ?>">
          <span aria-hidden="true">✉</span>
          <span><?= $emailEsc ?></span>
        </button>

        <a
          class="seller-mini-button seller-contact-chip"
          href="https://vk.com/stodvaprocenta"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Открыть сообщество ВКонтакте">
          <span aria-hidden="true">VK</span>
          <span> Сообщество</span>
        </a>
      </div>

      <div class="seller-row seller-row-single">
        <span class="seller-text">
          <strong>Регион отправки:</strong> <?= htmlspecialchars($seller['region'], ENT_QUOTES, 'UTF-8') ?>
        </span>
      </div>

      <div class="seller-row seller-row-single">
        <span class="seller-text">
          <strong>Режим работы:</strong> <?= htmlspecialchars($seller['hours'], ENT_QUOTES, 'UTF-8') ?>
        </span>
      </div>

      <div class="seller-row seller-row-single">
        <span class="seller-text">
          <strong>Оплата:</strong> <?= htmlspecialchars($seller['payment'], ENT_QUOTES, 'UTF-8') ?>
        </span>
      </div>

      <div class="seller-row seller-row-single">
        <span class="seller-text">
          <strong>Доставка:</strong> <?= htmlspecialchars($seller['delivery'], ENT_QUOTES, 'UTF-8') ?>
        </span>
      </div>

      <div class="seller-row seller-row-single seller-row-last">
        <span class="seller-text">
          <strong><?= htmlspecialchars($seller['returns'], ENT_QUOTES, 'UTF-8') ?></strong>
        </span>
      </div>
    </div>

    <div class="footer-question-card" aria-label="Форма связи с мастером">
      <div class="footer-question-head">
        <h2 class="footer-question-title">Есть вопрос по бусинам или темлякам?</h2>
        <p class="footer-question-intro">
          Оставьте вопрос и контакт. Отвечу лично, когда буду в сети.
        </p>
      </div>

      <div class="footer-question-reveal" id="footerQuestionReveal" data-delay-ms="5000">
        <div class="footer-question-placeholder" id="footerQuestionPlaceholder">
          Форма появится через несколько секунд после загрузки страницы.
        </div>

        <form
          id="footerQuestionForm"
          class="footer-question-form"
          action="/businka/form-question-handler.php"
          method="post"
          novalidate>
          <input type="hidden" name="page_url" value="">
          <input type="hidden" name="page_path" value="">
          <input type="hidden" name="page_title" value="">
          <input type="hidden" name="page_type" value="">
          <input type="hidden" name="item_title" value="">
          <input type="hidden" name="device_type" value="">
          <input type="hidden" name="variant_id" value="">
          <input type="hidden" name="variant_text" value="">
          <input type="hidden" name="page_loaded_at" value="">
          <input type="text" name="website" value="" tabindex="-1" autocomplete="off" class="footer-question-hp" aria-hidden="true">

          <label class="footer-question-label" for="footerQuestionText">Ваш вопрос</label>
          <textarea
            id="footerQuestionText"
            name="question"
            rows="4"
            minlength="5"
            maxlength="2500"
            required
            placeholder="Например: подойдет ли для темляка, какой размер отверстия, есть ли в наличии"></textarea>

          <label class="footer-question-label" for="footerQuestionContact">Как с Вами связаться</label>
          <input
            id="footerQuestionContact"
            type="text"
            name="contact"
            minlength="3"
            maxlength="255"
            required
            placeholder="Ваш e-mail, VK или другой способ связи">

          <div class="footer-question-actions">
            <button type="submit" class="footer-question-submit">Отправить вопрос</button>
            <div id="footerQuestionStatus" class="footer-question-status" aria-live="polite"></div>
          </div>
        </form>
      </div>
    </div>
  </div>
</footer>

<script>
(function () {
  if (window.__podvalCopyEmailInit) return;
  window.__podvalCopyEmailInit = true;

  function ensureToast() {
    let toast = document.getElementById('copy-email-toast');
    if (toast) return toast;

    toast = document.createElement('div');
    toast.id = 'copy-email-toast';
    toast.textContent = 'E-mail скопирован';
    toast.setAttribute('aria-live', 'polite');
    toast.style.position = 'fixed';
    toast.style.left = '50%';
    toast.style.bottom = '24px';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '10px';
    toast.style.background = 'rgba(18, 18, 18, 0.92)';
    toast.style.color = '#f3e7c9';
    toast.style.border = '1px solid rgba(201,168,113,0.45)';
    toast.style.boxShadow = '0 10px 24px rgba(0,0,0,0.28)';
    toast.style.fontSize = '14px';
    toast.style.lineHeight = '1.35';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    document.body.appendChild(toast);
    return toast;
  }

  let toastTimer = null;

  function showToast(message) {
    const toast = ensureToast();
    toast.textContent = message || 'E-mail скопирован';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }

    toastTimer = window.setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 1800);
  }

  async function copyEmail(email) {
    try {
      await navigator.clipboard.writeText(email);
      showToast('E-mail скопирован');
    } catch (error) {
      const helper = document.createElement('textarea');
      helper.value = email;
      helper.setAttribute('readonly', '');
      helper.style.position = 'absolute';
      helper.style.left = '-9999px';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      document.body.removeChild(helper);
      showToast('E-mail скопирован');
    }
  }

  document.querySelectorAll('.copy-email-trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      copyEmail(trigger.getAttribute('data-copy-email'));
    });

    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        copyEmail(trigger.getAttribute('data-copy-email'));
      }
    });
  });
})();
</script>
<script src="/js/footer-question-form.js" defer></script>
