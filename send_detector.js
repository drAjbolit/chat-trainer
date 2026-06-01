const statusEl = document.getElementById('status');

function show(msg, type = 'info') {
  statusEl.textContent = msg;
  statusEl.className = `status show ${type}`;
  setTimeout(() => {
    statusEl.className = 'status';
    statusEl.textContent = '';
  }, 5000);
}

// Запрашиваем у content script, чтобы начать режим определения
chrome.runtime.sendMessage({ action: 'start_send_detection' }, (response) => {
  if (chrome.runtime.lastError) {
    show('❌ Ошибка связи со страницей. Обновите вкладку.', 'error');
    return;
  }
  
  show('👀 Ожидание клика по кнопке Send...', 'info');
});

// Слушаем сообщение о успешном определении
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'send_detected') {
    show('✅ Кнопка Send успешно определена!', 'success');
    // Закрываем окно через 2 секунды
    setTimeout(() => {
      window.close();
    }, 2000);
  }
});

// Слушаем сообщение об ошибке
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'send_detection_error') {
    show(`❌ Ошибка: ${request.message}`, 'error');
  }
});