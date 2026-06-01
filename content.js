let detectMode = null;
let detectTimeout = null;

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
  } 
  else if (request.action === 'detect_send') {
    detectMode = 'send';
    
    // Таймаут на случай, если пользователь передумал
    clearTimeout(detectTimeout);
    detectTimeout = setTimeout(() => {
      detectMode = null;
      console.log('⏱ Режим определения кнопки отменён по таймауту');
    }, 15000);
    
    sendResponse({ status: 'waiting' });
    return true;
  } 
  else if (request.action === 'send_message') {
    sendMessage(request.text, sendResponse);
    return true;
  }
  return true;
});

// Обработка кликов для определения кнопки Send
document.addEventListener('click', (e) => {
  if (detectMode === 'send') {
    // Блокируем стандартное действие, чтобы не мешать определению
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(detectTimeout);

    let target = e.target;
    
    // Поднимаемся вверх по DOM, чтобы найти настоящую кнопку
    // (если кликнули по иконке/SVG внутри кнопки)
    while (target && target !== document.body) {
      const tag = target.tagName.toLowerCase();
      const role = target.getAttribute('role');
      const aria = (target.getAttribute('aria-label') || '').toLowerCase();
      const testid = (target.getAttribute('data-testid') || '').toLowerCase();

      if (tag === 'button' || 
          (tag === 'input' && target.type === 'submit') || 
          role === 'button' || 
          aria.includes('send') || aria.includes('отправ') ||
          testid.includes('send') || testid.includes('submit')) {
        break;
      }
      target = target.parentElement;
    }

    const finalTarget = (target && target !== document.body) ? target : e.target;
    const selector = generateSelector(finalTarget);

    saveConfig('send', selector);
    detectMode = null;

    // Визуальное подтверждение (зелёная рамка)
    const originalStyle = finalTarget.style.cssText;
    finalTarget.style.outline = "3px solid #4CAF50";
    finalTarget.style.outlineOffset = "2px";
    setTimeout(() => { finalTarget.style.cssText = originalStyle; }, 1500);

    chrome.runtime.sendMessage({ action: 'send_detected' });
  }
}, true); // capture: true перехватывает клик раньше сайта

// Обработка ESC для отмены режима определения
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && detectMode === 'send') {
    detectMode = null;
    clearTimeout(detectTimeout);
    console.log('⏹ Режим определения отменён (ESC)');
  }
});

// Сохранение конфигурации в storage
function saveConfig(type, selector) {
  chrome.storage.local.get('chatTrainerConfig', (data) => {
    const config = data.chatTrainerConfig || { version: "1.0", domain: window.location.hostname, elements: {} };
    config.elements[type] = { selector, type: 'auto', updated: new Date().toISOString() };
    chrome.storage.local.set({ chatTrainerConfig: config });
  });
}

// Поиск поля ввода по тексту
function findElementByText(text) {
  const candidates = document.querySelectorAll('input, textarea, [contenteditable="true"]');
  for (const el of candidates) {
    const val = el.value || el.textContent || '';
    if (val.includes(text)) return el;
  }
  return null;
}

// Генерация уникального CSS-селектора
function generateSelector(el) {
  if (el.id) return `#${CSS.escape(el.id)}`;
  
  const path = [];
  let curr = el;
  
  while (curr && curr.nodeType === Node.ELEMENT_NODE) {
    let sel = curr.tagName.toLowerCase();
    
    if (curr.id) { 
      sel += `#${CSS.escape(curr.id)}`; 
      path.unshift(sel); 
      break; 
    }
    
    // Добавляем :nth-of-type для уникальности
    let nth = 1, sib = curr;
    while (sib = sib.previousElementSibling) { 
      if (sib.tagName === curr.tagName) nth++; 
    }
    if (nth > 1) sel += `:nth-of-type(${nth})`;
    
    // Добавляем классы (игнорируем динамические css-классы)
    if (curr.className) {
      const classes = curr.className.split(' ').filter(c => c && !c.startsWith('css-')).slice(0, 2);
      if (classes.length) sel += `.${classes.map(c => CSS.escape(c)).join('.')}`;
    }
    
    path.unshift(sel);
    curr = curr.parentElement;
    
    // Ограничиваем глубину до 5 уровней
    if (path.length >= 5) break;
  }
  
  return path.join(' > ');
}

// Отправка сообщения
function sendMessage(text, callback) {
  chrome.storage.local.get('chatTrainerConfig', (data) => {
    const config = data.chatTrainerConfig;
    
    if (!config?.elements?.input) {
      return callback({ status: 'error', message: 'Поле ввода не обучено' });
    }

    const input = document.querySelector(config.elements.input.selector);
    if (!input) {
      return callback({ status: 'error', message: 'Селектор поля устарел или элемент не найден' });
    }

    input.focus();
    
    // Вставляем текст в зависимости от типа поля
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Для contenteditable div
      input.textContent = text;
      input.dispatchEvent(new InputEvent('input', { 
        bubbles: true, 
        cancelable: true, 
        data: text 
      }));
    }
    
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Отправляем сообщение
    if (config.elements.send?.selector) {
      const btn = document.querySelector(config.elements.send.selector);
      if (btn) {
        btn.click();
        callback({ status: 'success' });
      } else {
        callback({ status: 'error', message: 'Кнопка отправки не найдена по селектору' });
      }
    } else {
      // Фолбэк: имитируем нажатие Enter
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        code: 'Enter', 
        bubbles: true 
      }));
      callback({ status: 'success' });
    }
  });
}