// js/header.js
// Управление заголовком и кнопкой выхода.
// Сейчас используем глобальный window.authManager, который создаётся в app.js.

document.addEventListener('DOMContentLoaded', function() {
  // Используем существующий экземпляр, если он есть
  const am = window.authManager;
  if (!am) {
    // Если authManager ещё не создан — просто безопасно выйти
    console.warn('header: window.authManager не найден (возможно app.js подключён позже)');
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Если authManager есть — вызываем logout и перезагружаем страницу
      if (am && typeof am.logout === 'function') {
        am.logout();
        // перезагрузим страницу, чтобы обновить состояние UI и видимость кнопок
        window.location.reload();
      } else {
        // Если менеджера нет — просто уберём запись currentUser и перезагрузим
        try { localStorage.removeItem('currentUser'); } catch (e) {}
        window.location.reload();
      }
    });
  }
});
