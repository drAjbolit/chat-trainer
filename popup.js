const statusEl = document.getElementById('status');

function show(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = isError ? 'error' : '';
  setTimeout(() => { statusEl.textContent = ''; }, 4000);
}

// 1. Определить поле ввода
document.getElementById('btnDetectInput').addEventListener('click', async () => {
  const phrase = document.getElementById('searchPhrase').value.trim();
  if (!phrase) return show(' Введите фразу для поиска!', true);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'detect_input', text: phrase }, (res) => {
    if (chrome.runtime.lastError) return show('❌ Ошибка связи со страницей', true);
    show(res.status === 'success' ? `✅ Поле найдено!` : `❌ ${res.message}`, res.status !== 'success');
  });
});

// 2. Определить кнопку Send
document.getElementById('btnDetectSend').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'detect_send' }, (res) => {
    if (chrome.runtime.lastError) return show('❌ Ошибка связи', true);
    show('👆 Теперь кликните по кнопке "Отправить" на странице...');
  });
});

// 3. Отправить сообщение
document.getElementById('btnSend').addEventListener('click', async () => {
  const text = document.getElementById('msgToSend').value.trim();
  if (!text) return show('❌ Введите сообщение!', true);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'send_message', text }, (res) => {
    if (chrome.runtime.lastError) return show(' Ошибка отправки', true);
    show(res.status === 'success' ? '✅ Отправлено!' : `❌ ${res.message}`, res.status !== 'success');
  });
});

// 4. Экспорт настроек в JSON
document.getElementById('btnExport').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domain = new URL(tab.url).hostname;
  const config = await chrome.storage.local.get('chatTrainerConfig');
  
  const exportData = config.chatTrainerConfig || { version: "1.0", domain, elements: {} };
  exportData.domain = domain; // принудительно обновляем домен текущей вкладки

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trainer-${domain.replace(/\./g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  show('💾 Конфиг экспортирован!');
});

// 5. Импорт настроек из JSON
document.getElementById('btnImport').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!imported.elements) throw new Error('Неверная структура файла');
      
      await chrome.storage.local.set({ chatTrainerConfig: imported });
      show('📂 Конфиг импортирован! Обновите страницу чата.');
    } catch (err) {
      show('❌ Ошибка: ' + err.message, true);
    }
  };
  reader.readAsText(file);
});

// Слушаем результат обнаружения Send-кнопки
chrome.runtime.onMessage.addListener((req) => {
  if (req.action === 'send_detected') {
    show('✅ Send-кнопка сохранена в конфиг!');
  }
});