chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle_panel' }).catch(() => {
    // Если контент-скрипт ещё не инжектирован (вкладка была открыта до установки)
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tab.id, { action: 'toggle_panel' });
    });
  });
});