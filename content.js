let detectMode = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detect_input') {
    detectMode = 'input';
    setTimeout(() => {
      const el = findElementByText(request.text);
      if (el) {
        const selector = generateSelector(el);
        saveConfig('input', selector);
        sendResponse({ status: 'success', selector });
      } else {
        sendResponse({ status: 'error', message: 'Элемент не найден' });
      }
      detectMode = null;
    }, 300);
    return true;

  } else if (request.action === 'detect_send') {
    detectMode = 'send';
    sendResponse({ status: 'waiting' });
    return true;

  } else if (request.action === 'send_message') {
    sendMessage(request.text, sendResponse);
    return true;
  }
});

document.addEventListener('click', (e) => {
  if (detectMode === 'send') {
    const selector = generateSelector(e.target);
    saveConfig('send', selector);
    detectMode = null;
    chrome.runtime.sendMessage({ action: 'send_detected' });
  }
}, true);

function saveConfig(type, selector) {
  chrome.storage.local.get('chatTrainerConfig', (data) => {
    const config = data.chatTrainerConfig || { version: "1.0", domain: window.location.hostname, elements: {} };
    config.elements[type] = { selector, type: 'auto', updated: new Date().toISOString() };
    chrome.storage.local.set({ chatTrainerConfig: config });
  });
}

function findElementByText(text) {
  const candidates = document.querySelectorAll('input, textarea, [contenteditable="true"]');
  for (const el of candidates) {
    const val = el.value || el.textContent || '';
    if (val.includes(text)) return el;
  }
  return null;
}

function generateSelector(el) {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const path = [];
  let curr = el;
  while (curr && curr.nodeType === Node.ELEMENT_NODE) {
    let sel = curr.tagName.toLowerCase();
    if (curr.id) { sel += `#${CSS.escape(curr.id)}`; path.unshift(sel); break; }
    let nth = 1, sib = curr;
    while (sib = sib.previousElementSibling) { if (sib.tagName === curr.tagName) nth++; }
    if (nth > 1) sel += `:nth-of-type(${nth})`;
    if (curr.className) {
      const classes = curr.className.split(' ').filter(c => c && !c.startsWith('css-')).slice(0, 2);
      if (classes.length) sel += `.${classes.map(c => CSS.escape(c)).join('.')}`;
    }
    path.unshift(sel);
    curr = curr.parentElement;
    if (path.length >= 4) break;
  }
  return path.join(' > ');
}

function sendMessage(text, callback) {
  chrome.storage.local.get('chatTrainerConfig', (data) => {
    const config = data.chatTrainerConfig;
    if (!config?.elements?.input) return callback({ status: 'error', message: 'Поле не обучено' });
    
    const input = document.querySelector(config.elements.input.selector);
    if (!input) return callback({ status: 'error', message: 'Селектор устарел' });

    input.focus();
    input.textContent = '';
    input.textContent = text;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: text }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    if (config.elements.send?.selector) {
      const btn = document.querySelector(config.elements.send.selector);
      if (btn) btn.click();
    } else {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    }
    callback({ status: 'success' });
  });
}