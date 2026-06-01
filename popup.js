document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');

  function show(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.className = 'show ' + (isError ? 'error' : 'success');
    setTimeout(() => { statusEl.className = ''; }, 4000);
  }

  // Вспомогательная функция для отправки сообщений в content script
  async function sendToContent(action, payload = {}) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action, ...payload }, (res) => {
        if (chrome.runtime.lastError) {
          show('❌ Ошибка связи со страницей. Обнови вкладку.', true);
          resolve(null);
        } else {
          resolve(res);
        }
      });
    });
  }

  // 1. Определить поле ввода
  document.getElementById('btnDetectInput')?.addEventListener('click', async () => {
    const phrase = document.getElementById('searchPhrase').value.trim();
    if (!phrase) return show('❌ Введите фразу для поиска!', true);
    const res = await sendToContent('detect_input', { text: phrase });
    if (res?.status === 'success') show('✅ Поле найдено и сохранено!');
    else if (res?.status === 'error') show(`❌ ${res.message}`, true);
  });

  // 2. Определить кнопку Send
  document.getElementById('btnDetectSend')?.addEventListener('click', async () => {
    show('👆 Кликните по кнопке "Отправить" на странице...');
    await sendToContent('detect_send');
  });

  // 3. Отправить сообщение
  document.getElementById('btnSend')?.addEventListener('click', async () => {
    const text = document.getElementById('msgToSend').value.trim();
    if (!text) return show('❌ Введите сообщение!', true);
    const res = await sendToContent('send_message', { text });
    if (res?.status === 'success') show('✅ Отправлено!');
    else if (res?.status === 'error') show(`❌ ${res.message}`, true);
  });

  // 4. Экспорт
  document.getElementById('btnExport')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = new URL(tab.url).hostname;
    const { chatTrainerConfig } = await chrome.storage.local.get('chatTrainerConfig');
    const data = chatTrainerConfig || { version: "1.0", domain, elements: {} };
    data.domain = domain;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trainer-${domain.replace(/\./g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    show('💾 Конфиг экспортирован!');
  });

  // 5. Импорт
  document.getElementById('btnImport')?.addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported.elements) throw new Error('Неверная структура файла');
        await chrome.storage.local.set({ chatTrainerConfig: imported });
        show('📂 Конфиг импортирован! Обнови страницу чата.');
      } catch (err) {
        show(' Ошибка: ' + err.message, true);
      }
    };
    reader.readAsText(file);
  });

  // Слушаем успешное определение Send
  chrome.runtime.onMessage.addListener((req) => {
    if (req.action === 'send_detected') show('✅ Send-кнопка сохранена!');
  });
});