// js/ad-detail.js
document.addEventListener('DOMContentLoaded', () => {

  // Проверяем авторизацию
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isLogged = localStorage.getItem('loggedIn') === 'true';

  const authLinks = document.getElementById('auth-links');
  const userGreeting = document.getElementById('user-greeting');
  const usernameEl = document.getElementById('username');
  const respondButton = document.getElementById('respond-button');

  if (isLogged && savedUser.name) {
    // Показываем приветствие
    if (authLinks) authLinks.style.display = 'none';
    if (userGreeting) userGreeting.style.display = 'flex';
    if (usernameEl) usernameEl.textContent = savedUser.name;

    // Показываем кнопку "Откликнуться"
    if (respondButton) respondButton.style.display = 'block';
  } else {
    // Не залогинен — скрываем кнопку "Откликнуться"
    if (respondButton) respondButton.style.display = 'none';
  }

  // Обработчик кнопки выхода
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('loggedIn');
      if (authLinks) authLinks.style.display = 'flex';
      if (userGreeting) userGreeting.style.display = 'none';
      if (respondButton) respondButton.style.display = 'none';
    });
  }

  // Защита: проверяем менеджер объявлений
  if (!window.adsManager || typeof window.adsManager.getAdById !== 'function') {
    alert('Ошибка: менеджер объявлений недоступен. Обновите страницу.');
    console.error('adsManager missing or invalid', window.adsManager);
    return;
  }

  // Получение текущего пользователя (через authManager или localStorage fallback)
  function getCurrentUser() {
    if (window.authManager && typeof window.authManager.getCurrentUser === 'function') {
      return window.authManager.getCurrentUser();
    }
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // Небольшая утилита экранирования (для безопасности при вставке в DOM)
  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
  }

  // Парсим id объявления из URL
  const params = new URLSearchParams(window.location.search);
  const adId = params.get('id');
  if (!adId) {
    window.location.href = 'index.html';
    return;
  }

  // Берём объявление
  const ad = window.adsManager.getAdById(adId);
  if (!ad) {
    alert('Объявление не найдено');
    window.location.href = 'index.html';
    return;
  }

  // Элементы DOM (ищем опционально)
  const els = {
    title: document.getElementById('ad-title'),
    price: document.getElementById('ad-price'),
    description: document.getElementById('ad-description'),
    photoWrap: document.getElementById('photo-wrap'),
    respondsList: document.getElementById('responds-list'),
    respondsCount: document.getElementById('responds-count'),
    authorName: document.getElementById('author-name'),
    authorPhone: document.getElementById('author-phone'),
    respondButton: document.getElementById('respond-button'),
    metaList: document.getElementById('meta-list'),
    deleteButton: document.getElementById('delete-button'),
    backBtn: document.getElementById('back-btn')
  };

  // Заполняем базовые данные
  if (els.title) els.title.textContent = ad.title || '';
  if (els.price) els.price.textContent = ad.price || '';
  if (els.description) els.description.textContent = ad.description || '';

  // Картинка
  if (els.photoWrap) {
    els.photoWrap.innerHTML = '';
    const src = ad.image || ad.imageUrl || 'images/no-image.jpg';
    const img = document.createElement('img');
    img.src = src;
    img.alt = ad.title || 'Фото';
    img.onerror = () => { img.src = 'images/no-image.jpg'; };
    els.photoWrap.appendChild(img);
  }

  // Отклики (локальная копия)
  const responds = Array.isArray(ad.responses) ? ad.responses.slice() : [];
  if (els.respondsCount) els.respondsCount.textContent = responds.length;
  if (els.respondsList) {
    els.respondsList.innerHTML = '';
    if (responds.length === 0) {
      const noEl = document.createElement('div');
      noEl.style.color = 'var(--gray-600)';
      noEl.style.padding = '12px 6px';
      noEl.textContent = 'Пока никто не откликнулся';
      els.respondsList.appendChild(noEl);
    } else {
      responds.forEach(r => {
        const row = document.createElement('div');
        row.className = 'respond-row';
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = r.name || r.email || '—';
        const phone = document.createElement('div');
        phone.className = 'phone';
        phone.textContent = r.phone || '—';
        row.appendChild(name);
        row.appendChild(phone);
        els.respondsList.appendChild(row);
      });
    }
  }

  // Автор и телефон
  const user = getCurrentUser();
  const isAuthor = user && (user.email === ad.authorEmail);
  
  if (els.authorName) els.authorName.textContent = ad.authorName || '';
  if (els.authorPhone) els.authorPhone.textContent = isLogged ? (ad.authorPhone || '') : '';

  // Настройка кнопки Удалить: видно только автору
  if (els.deleteButton) {
    if (isAuthor) {
      els.deleteButton.style.display = 'inline-block';
      // Навешиваем обработчик (убираем возможные старые слушатели через клон)
      const old = els.deleteButton;
      const clone = old.cloneNode(true);
      old.parentNode.replaceChild(clone, old);
      els.deleteButton = clone;
      els.deleteButton.addEventListener('click', (e) => {
        e.preventDefault();
        const ok = confirm('Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.');
        if (!ok) return;
        try {
          if (typeof window.adsManager.deleteAd === 'function') {
            window.adsManager.deleteAd(ad.id);
          } else {
            // fallback: если метод отсутствует, удаляем вручную из localStorage
            const key = window.adsManager && window.adsManager.adsKey ? window.adsManager.adsKey : 'userAds';
            const raw = localStorage.getItem(key);
            let arr = raw ? JSON.parse(raw) : [];
            arr = arr.filter(a => String(a.id) !== String(ad.id));
            localStorage.setItem(key, JSON.stringify(arr));
          }
          // После удаления переходим на главную
          alert('Объявление удалено');
          window.location.href = 'index.html';
        } catch (err) {
          console.error('deleteAd error', err);
          alert('Ошибка при удалении объявления');
        }
      });
    } else {
      // не автор — скрыть кнопку
      els.deleteButton.style.display = 'none';
    }
  }

  // Кнопка отклика: убираем/навешиваем обработчик корректно
  if (els.respondButton) {
    // заменим на клон чтобы очистить старые события
    const oldBtn = els.respondButton;
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    els.respondButton = newBtn;

    if (!isLogged) {
      els.respondButton.style.display = 'inline-block';
      els.respondButton.disabled = false;
      els.respondButton.textContent = 'Войдите, чтобы откликнуться';
      els.respondButton.addEventListener('click', () => {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('active');
        else alert('Пожалуйста, войдите в систему.');
      });
    } else if (isAuthor) {
      els.respondButton.style.display = 'none';
    } else {
      const already = responds.find(r => r.email === user.email);
      if (already) {
        els.respondButton.style.display = 'inline-block';
        els.respondButton.disabled = true;
        els.respondButton.textContent = 'Вы уже откликнулись';
      } else {
        els.respondButton.style.display = 'inline-block';
        els.respondButton.disabled = false;
        els.respondButton.textContent = 'Откликнуться на объявление';
        els.respondButton.addEventListener('click', () => {
          try {
            const res = window.adsManager.addResponse(ad.id, { name: user.name || user.email, phone: user.phone || '', email: user.email });
            if (res === true || (res && res.ok)) {
              responds.push({ name: user.name || user.email, phone: user.phone || '', email: user.email });
              if (els.respondsCount) els.respondsCount.textContent = responds.length;
              if (els.respondsList) {
                const row = document.createElement('div');
                row.className = 'respond-row';
                const name = document.createElement('div');
                name.className = 'name';
                name.textContent = user.name || user.email;
                const phone = document.createElement('div');
                phone.className = 'phone';
                phone.textContent = user.phone || '—';
                row.appendChild(name);
                row.appendChild(phone);
                els.respondsList.appendChild(row);
              }
              els.respondButton.disabled = true;
              els.respondButton.textContent = 'Вы откликнулись';
              alert('Отклик отправлен');
            } else {
              const errMsg = (res && res.error) ? res.error : 'Не удалось отправить отклик';
              alert(errMsg);
            }
          } catch (err) {
            console.error('addResponse error', err);
            alert('Ошибка при отправке отклика');
          }
        });
      }
    }
  }

  // Метаданные
  if (els.metaList) {
    els.metaList.innerHTML = '';
    const fields = [
      {k: 'Бренд', v: ad.brand},
      {k: 'Цвет', v: ad.color},
      {k: 'Формат', v: ad.format}
    ];
    fields.forEach(f => {
      if (f.v) {
        const div = document.createElement('div');
        div.className = 'meta-row';
        div.textContent = `${f.k}: ${f.v}`;
        els.metaList.appendChild(div);
      }
    });
  }

  // === Отклики: добавление/отрисовка/сохранение ===
(function() {
  // Удобные селекторы
  const respondsListEl = document.getElementById('responds-list');
  const respondsCountEl = document.getElementById('responds-count');
  const respondBtn = document.getElementById('respond-button');

  const authorNameEl = document.getElementById('author-name');
  const authorPhoneEl = document.getElementById('author-phone');

  // modal/auth селекторы (чтобы открывать модалку входа)
  const authModal = document.getElementById('auth-modal');
  const loginLink = document.getElementById('login-link') || document.querySelector('.auth-links a#login-link');

  // helper: получить adId (из query ?id=... или из data-ad-id атрибута)
  function getAdId() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('id')) return params.get('id');
    } catch (e) { /* ignore */ }
    // попытка взять data-ad-id
    const adGrid = document.querySelector('.ad-grid') || document.querySelector('.ads-grid') || document.getElementById('ads-container');
    if (adGrid && adGrid.dataset && adGrid.dataset.adId) return adGrid.dataset.adId;
    // fallback
    return 'ad-current';
  }

  const AD_ID = getAdId();
  const STORAGE_KEY = `responses_${AD_ID}`;

  // получить текущего залогиненного пользователя из localStorage
  function getCurrentUser() {
    try {
      const logged = localStorage.getItem('loggedIn') === 'true';
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return logged && user ? user : null;
    } catch (e) {
      return null;
    }
  }

  // загрузить отклики из localStorage (массив объектов {name, phone, ts})
  function loadResponses() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  // сохранить отклики
  function saveResponses(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) { /* ignore */ }
  }

  // отрисовать список откликов
  function renderResponses() {
    const items = loadResponses();
    // очистка
    if (!respondsListEl) return;
    respondsListEl.innerHTML = '';
    if (items.length === 0) {
      respondsListEl.innerHTML = '<p class="no-responds">Пока нет откликов</p>';
    } else {
      const frag = document.createDocumentFragment();
      items.forEach((it) => {
        const row = document.createElement('div');
        row.className = 'respond-row';
        // формат: имя — телефон (и время)
        const time = it.ts ? new Date(it.ts).toLocaleString() : '';
        row.innerHTML = `<div class="respond-name" style="font-weight:600">${escapeHtml(it.name)}</div>
                         <div class="respond-phone" style="color:#555">${escapeHtml(it.phone)}</div>
                         <div class="respond-ts" style="font-size:12px;color:#999">${escapeHtml(time)}</div>`;
        frag.appendChild(row);
      });
      respondsListEl.appendChild(frag);
    }
    // обновляем счётчик
    if (respondsCountEl) respondsCountEl.textContent = loadResponses().length;
  }

  // защитная функция для вывода текста
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"'`]/g, function(ch) {
      return ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
      })[ch];
    });
  }

  // добавить отклик текущего пользователя
  function addResponseForCurrentUser() {
    const user = getCurrentUser();
    if (!user) {
      // открыть модалку для входа (или кликнуть на ссылку входа)
      if (authModal) authModal.classList.add('active');
      else if (loginLink) loginLink.click();
      return;
    }

    // проверяем, не откликался ли уже этот пользователь
    const items = loadResponses();
    const already = items.find(it => it.email && user.email && it.email === user.email);
    if (already) {
      alert('Вы уже откликались на это объявление.');
      return;
    }

    const newItem = {
      name: user.name || (user.email ? user.email.split('@')[0] : 'Пользователь'),
      phone: user.phone || '',
      email: user.email || '',
      ts: Date.now()
    };
    items.push(newItem);
    saveResponses(items);
    renderResponses();
    // немного визуальной обратной связи
    if (respondBtn) {
      respondBtn.textContent = 'Отклик отправлен';
      respondBtn.disabled = true;
      respondBtn.classList.add('disabled');
      setTimeout(() => {
        if (respondBtn) {
          respondBtn.textContent = 'Откликнуться на объявление';
          // оставляем кнопку активной для других пользователей; текущий уже в списке
        }
      }, 1500);
    }
  }

  // показать данные автора объявления (берем их из DOM, если пусты — попытаемся из localStorage ads)
  function showAuthorInfo() {
    // если уже заполнено в DOM — не трогаем
    const nameInDom = authorNameEl && authorNameEl.textContent && authorNameEl.textContent.trim().length > 0;
    const phoneInDom = authorPhoneEl && authorPhoneEl.textContent && authorPhoneEl.textContent.trim().length > 0;
    if (nameInDom || phoneInDom) return;

    // пробуем получить автора из ads-manager (если он глобально доступен)
    try {
      if (window.adsManager && typeof window.adsManager.getAdById === 'function') {
        const ad = window.adsManager.getAdById(AD_ID);
        if (ad) {
          if (authorNameEl && ad.authorName) authorNameEl.textContent = ad.authorName;
          if (authorPhoneEl && ad.authorPhone) authorPhoneEl.textContent = ad.authorPhone;
          return;
        }
      }
    } catch (e) { /* ignore */ }

    // fallback: если нет данных, прячем блок (чтобы не показывать пустое место)
    if (authorNameEl) authorNameEl.textContent = 'Продавец';
    if (authorPhoneEl) authorPhoneEl.textContent = '';
  }

  // привязка обработчика к кнопке
  function attachHandlers() {
    if (!respondBtn) return;

    respondBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user) {
        // открыть модал авторизации
        if (authModal) authModal.classList.add('active');
        else if (loginLink) loginLink.click();
        return;
      }
      addResponseForCurrentUser();
    });
  }

  // Инициализация
  function init() {
    showAuthorInfo();
    renderResponses();

    // показываем/скрываем кнопку в зависимости от авторизации
    const user = getCurrentUser();
    if (user) {
      if (respondBtn) respondBtn.style.display = 'block';
    } else {
      if (respondBtn) respondBtn.style.display = 'none';
    }

    attachHandlers();
  }

  // запуск после загрузки DOM (если уже загружен — запустим сразу)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


});
