// === STATE ===
let panelVisible = false;
let selectionMode = null; // 'input', 'send', 'end_response', 'download'
let config = { version: "1.0", domain: window.location.hostname, elements: {} };

// Загружаем сохранённый конфиг при старте
chrome.storage.local.get('chatTrainerConfig', (data) => {
  if (data.chatTrainerConfig) config = data.chatTrainerConfig;
});

// Слушаем команду от background.js (клик по иконке)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle_panel') {
    togglePanel();
    sendResponse({ status: 'toggled' });
  }
  return true;
});

// === СОЗДАНИЕ ПАНЕЛИ ===
function createPanel() {
  if (document.getElementById('chat-trainer-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'chat-trainer-panel';
  panel.innerHTML = `
    <div id="ct-header">
      <span>🎯 Chat DOM Trainer</span>
      <button id="ct-close">✕</button>
    </div>
    <div id="ct-info">📄 ${document.title.substring(0, 35)}... | 🌐 ${window.location.hostname}</div>
    <div id="ct-status"></div>
    
    <div class="ct-section">
      <div style="font-weight:bold; font-size:11px; margin-bottom:4px; color:#666;">ШАГ 1: ПОЛЕ ВВОДА</div>
      <button id="ct-find-input"> Найти поле ввода</button>
    </div>

    <div class="ct-section">
      <div style="font-weight:bold; font-size:11px; margin-bottom:4px; color:#666;">ШАГ 2: КНОПКИ</div>
      <button id="ct-find-send">📍 Найти кнопку Send</button>
      <button id="ct-find-end">🏁 Найти конец ответа (иконки)</button>
      <button id="ct-find-download">📥 Найти кнопку скачивания</button>
    </div>

    <div class="ct-section">
      <input type="text" id="ct-test-msg" placeholder="Тестовое сообщение...">
      <button id="ct-send-test">🚀 Отправить тест</button>
    </div>

    <div class="ct-section">
      <button id="ct-export">💾 Экспорт JSON</button>
      <button id="ct-import">📂 Импорт JSON</button>
      <input type="file" id="ct-file-input" accept=".json" style="display:none">
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #chat-trainer-panel {
      position: fixed; top: 20px; right: 20px; width: 300px;
      background: #fff; border: 1px solid #ccc; border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25); z-index: 999999;
      font-family: system-ui, sans-serif; font-size: 12px; color: #333;
      padding: 0; overflow: hidden; user-select: none;
    }
    #ct-header {
      background: #2196F3; color: #fff; padding: 10px 12px;
      display: flex; justify-content: space-between; align-items: center;
      font-weight: bold; cursor: move; font-size: 13px;
    }
    #ct-close { background: none; border: none; color: #fff; font-size: 16px; cursor: pointer; }
    #ct-info { padding: 6px 12px; background: #f5f5f5; font-size: 10px; color: #666; border-bottom: 1px solid #eee; }
    #ct-status { padding: 6px 12px; text-align: center; font-size: 11px; min-height: 18px; font-weight:bold; }
    .ct-section { padding: 10px 12px; border-bottom: 1px solid #eee; }
    .ct-section:last-child { border-bottom: none; }
    #chat-trainer-panel button {
      width: 100%; padding: 7px; margin: 3px 0; border: none; border-radius: 4px;
      cursor: pointer; font-size: 12px; color: #fff; transition: 0.2s;
    }
    #ct-find-input { background: #4CAF50; }
    #ct-find-send { background: #FF9800; }
    #ct-find-end { background: #9C27B0; }
    #ct-find-download { background: #E91E63; }
    #ct-send-test { background: #2196F3; }
    #ct-export { background: #607D8B; }
    #ct-import { background: #9C27B0; }
    #chat-trainer-panel button:hover { opacity: 0.9; }
    #chat-trainer-panel input { width: 100%; padding: 5px; margin-bottom: 5px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 11px; }
    .ct-mode-active { animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255,152,0,0.4); } 70% { box-shadow: 0 0 0 8px rgba(255,152,0,0); } 100% { box-shadow: 0 0 0 0 rgba(255,152,0,0); } }
  `;

  document.head.appendChild(style);
  document.body.appendChild(panel);

  // === ОБРАБОТЧИКИ КНОПОК ===
  document.getElementById('ct-close').onclick = () => togglePanel();
  document.getElementById('ct-find-input').onclick = () => startSelection('input');
  document.getElementById('ct-find-send').onclick = () => startSelection('send');
  document.getElementById('ct-find-end').onclick = () => startSelection('end_response');
  document.getElementById('ct-find-download').onclick = () => startSelection('download'); // НОВОЕ
  document.getElementById('ct-send-test').onclick = sendTestMessage;
  document.getElementById('ct-export').onclick = exportConfig;
  document.getElementById('ct-import').onclick = () => document.getElementById('ct-file-input').click();
  document.getElementById('ct-file-input').onchange = importConfig;

  // Перетаскивание панели
  const header = document.getElementById('ct-header');
  let isDragging = false, offsetX, offsetY;
  header.onmousedown = (e) => {
    isDragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;
  };
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = (e.clientX - offsetX) + 'px';
    panel.style.top = (e.clientY - offsetY) + 'px';
    panel.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => isDragging = false);
}

function togglePanel() {
  panelVisible = !panelVisible;
  if (panelVisible) {
    createPanel();
    document.getElementById('chat-trainer-panel').style.display = 'block';
    updateStatus('ℹ️ Панель открыта');
  } else {
    const p = document.getElementById('chat-trainer-panel');
    if (p) p.style.display = 'none';
    stopSelection();
  }
}

function updateStatus(msg, type = 'info') {
  const el = document.getElementById('ct-status');
  if (!el) return;
  el.textContent = msg;
  el.style.background = type === 'success' ? '#e8f5e9' : type === 'error' ? '#ffebee' : '#e3f2fd';
  el.style.color = type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#1565c0';
  setTimeout(() => { el.textContent = ''; el.style.background = ''; el.style.color = ''; }, 4000);
}

// === РЕЖИМ ВЫБОРА ===
function startSelection(type) {
  selectionMode = type;
  document.body.style.cursor = 'crosshair';
  
  let msg = '';
  if (type === 'input') msg = '🎯 Кликните по ПОЛЮ ВВОДА текста';
  if (type === 'send') msg = '🎯 Кликните по кнопке SEND (Отправить)';
  if (type === 'end_response') msg = '🎯 Кликните по ЛЮБОЙ иконке в КОНЦЕ ответа';
  if (type === 'download') msg = '🎯 Кликните по кнопке СКАЧАТЬ / СОХРАНИТЬ';
  
  updateStatus(msg, 'info');
  
  const btnMap = { 'input': 'ct-find-input', 'send': 'ct-find-send', 'end_response': 'ct-find-end', 'download': 'ct-find-download' };
  const btn = document.getElementById(btnMap[type]);
  if (btn) btn.classList.add('ct-mode-active');
}

function stopSelection() {
  selectionMode = null;
  document.body.style.cursor = '';
  document.querySelectorAll('.ct-mode-active').forEach(b => b.classList.remove('ct-mode-active'));
}

// === ГЛАВНЫЙ ПЕРЕХВАТ КЛИКОВ ===
document.addEventListener('click', (e) => {
  // Игнорируем клики внутри самой панели
  if (e.target.closest('#chat-trainer-panel')) return;

  if (selectionMode) {
    e.preventDefault();
    e.stopPropagation();

    let target = e.target;

    // --- ЛОГИКА ПОИСКА КНОПКИ СКАЧИВАНИЯ ---
    if (selectionMode === 'download') {
      while (target && target !== document.body) {
        const tag = target.tagName.toLowerCase();
        const aria = (target.getAttribute('aria-label') || '').toLowerCase();
        const text = (target.textContent || '').toLowerCase();
        const testid = (target.getAttribute('data-testid') || '').toLowerCase();
        
        // Ищем кнопку или ссылку с текстом "download", "save", "скачать"
        if ((tag === 'button' || tag === 'a') && 
            (aria.includes('download') || aria.includes('save') || aria.includes('скачать') || aria.includes('сохранить') ||
             text.includes('download') || text.includes('save') || text.includes('скачать') || text.includes('сохранить') ||
             testid.includes('download') || testid.includes('save'))) {
          break;
        }
        target = target.parentElement;
      }
    }

    // --- ЛОГИКА ПОИСКА "КОНЦЕВОГО БЛОКА" (Иконки) ---
    else if (selectionMode === 'end_response') {
      while (target && target !== document.body) {
        const isToolbar = (target.className.includes('action') || target.className.includes('footer') || target.className.includes('tool')) && (target.children.length > 1);
        if (isToolbar || (target.tagName === 'DIV' && target.children.length > 2)) {
           if (target.querySelector('button') || target.querySelector('svg')) break; 
        }
        if (target.tagName === 'BUTTON' || target.tagName === 'DIV') break;
        target = target.parentElement;
      }
    }

    // --- ЛОГИКА ПОИСКА SEND КНОПКИ ---
    else if (selectionMode === 'send') {
      while (target && target !== document.body) {
        const tag = target.tagName.toLowerCase();
        const role = target.getAttribute('role');
        const aria = (target.getAttribute('aria-label') || '').toLowerCase();
        const testid = (target.getAttribute('data-testid') || '').toLowerCase();
        if (tag === 'button' || (tag === 'input' && target.type === 'submit') || role === 'button' || aria.includes('send') || aria.includes('отправ') || testid.includes('send')) {
          break;
        }
        target = target.parentElement;
      }
    }

    // Финальный выбор
    const finalTarget = (target && target !== document.body) ? target : e.target;
    const selector = generateSelector(finalTarget);

    // Сохраняем в конфиг
    config.elements[selectionMode] = { selector, type: 'auto', updated: new Date().toISOString() };
    chrome.storage.local.set({ chatTrainerConfig: config });

    // Визуализация
    const orig = finalTarget.style.cssText;
    finalTarget.style.outline = '3px solid #4CAF50';
    finalTarget.style.outlineOffset = '2px';
    setTimeout(() => { finalTarget.style.cssText = orig; }, 1500);

    let successMsg = '';
    if (selectionMode === 'input') successMsg = '✅ Поле ввода сохранено!';
    if (selectionMode === 'send') successMsg = '✅ Кнопка Send сохранена!';
    if (selectionMode === 'end_response') successMsg = '✅ Конец ответа (иконки) сохранен!';
    if (selectionMode === 'download') successMsg = '✅ Кнопка скачивания сохранена!';
    
    updateStatus(successMsg, 'success');
    stopSelection();
  }
}, true);

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
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
    if (path.length >= 5) break;
  }
  return path.join(' > ');
}

function sendTestMessage() {
  const text = document.getElementById('ct-test-msg').value.trim();
  if (!text) return updateStatus('❌ Введите текст!', 'error');
  if (!config.elements?.input) return updateStatus(' Сначала обучите поле ввода!', 'error');

  const input = document.querySelector(config.elements.input.selector);
  if (!input) return updateStatus('❌ Поле не найдено!', 'error');

  input.focus();
  if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    input.textContent = text;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: text }));
  }
  input.dispatchEvent(new Event('change', { bubbles: true }));

  // Если есть кнопка Send — кликаем по ней
  if (config.elements.send?.selector) {
    const btn = document.querySelector(config.elements.send.selector);
    if (btn) btn.click();
  } else {
    // Иначе имитируем Enter
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
  }
  updateStatus('✅ Отправлено!', 'success');
}

function exportConfig() {
  config.domain = window.location.hostname;
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trainer-${config.domain.replace(/\./g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  updateStatus('💾 Экспортировано!', 'success');
}

function importConfig(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!imported.elements) throw new Error('Ошибка структуры');
      config = imported;
      chrome.storage.local.set({ chatTrainerConfig: config });
      updateStatus('✅ Импортировано!', 'success');
    } catch (err) {
      updateStatus('❌ Ошибка файла', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ESC отменяет режим выбора
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && selectionMode) {
    stopSelection();
    updateStatus('⏹ Отмена', 'info');
  }
});