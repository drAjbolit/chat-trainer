chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle_panel' }).catch(() => {
    // Если контент-скрипт еще не загружен (например, после обновления расширения)
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tab.id, { action: 'toggle_panel' });
    });
  });
});