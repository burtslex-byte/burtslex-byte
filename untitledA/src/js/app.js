// Главный файл инициализации приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('Приложение загружается...');

    // Инициализируем менеджер авторизации
    const authManager = new AuthManager();
    authManager.init();
    window.authManager = authManager;

    // Обработчик кнопки выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        console.log('Кнопка выхода найдена');
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Нажата кнопка выхода');
            if (window.authManager) {
                authManager.logout();
                alert('Вы вышли из системы');
            } else {
                console.error('AuthManager не найден');
            }
        });
    } else {
        console.log('Кнопка выхода не найдена');
    }

    // Инициализируем основное приложение
    if (window.initializeApp) {
        initializeApp();
    }
});