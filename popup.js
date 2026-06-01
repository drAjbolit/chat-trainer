// ЗАМЕНИ ЭТОТ БЛОК В popup.js
document.getElementById('btnDetectSend').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'detect_send' }, (res) => {
    if (chrome.runtime.lastError) return show('❌ Ошибка связи', true);
    show('👆 Теперь кликните по кнопке "Отправить" на странице...');
  });
});

// НА ЭТОТ КОД
document.getElementById('btnDetectSend').addEventListener('click', async () => {
  // Закрываем текущее окно расширения
  window.close();
  
  // Открываем новое окно, которое не закроется при клике на страницу
  chrome.windows.create({
    url: 'send_detector.html',
    type: 'popup',
    width: 350,
    height: 250,
    left: (screen.width - 350) / 2,
    top: (screen.height - 250) / 2
  }, (newWindow) => {
    if (chrome.runtime.lastError) {
      console.error('Ошибка при создании окна:', chrome.runtime.lastError);
      show('❌ Не удалось открыть окно. Проверьте разрешения.', 'error');
    }
  });
});