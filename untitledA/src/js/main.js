// Обновляем main.js
// Основная логика приложения
const adsContainer = document.getElementById('ads-container');
const loadMoreBtn = document.getElementById('load-more-btn');

// Переменные для пагинации
let currentPage = 1;
const adsPerPage = 8;

// Флаг, чтобы инициализация выполнялась только один раз
let appInitialized = false;

// Функция для отображения объявлений
function displayAds(page) {
    // Если рендерим первую страницу — очищаем контейнер
    if (page === 1 && adsContainer) {
        adsContainer.innerHTML = '';
    }

    const allAds = adsManager.getAds(); // Используем adsManager вместо adsData
    const startIndex = (page - 1) * adsPerPage;
    const endIndex = startIndex + adsPerPage;
    const adsToShow = allAds.slice(startIndex, endIndex);

    // Если нет контейнера — выходим
    if (!adsContainer) return;

    // Рендер в фрагмент для производительности
    const frag = document.createDocumentFragment();

    adsToShow.forEach(ad => {
        const adElement = document.createElement('div');
        adElement.className = 'ad-card';
        adElement.innerHTML = `
            <div class="ad-image-container">
                <img src="${ad.image}" alt="${ad.title}" class="ad-image" onerror="this.src='images/no-image.jpg'">
            </div>
            <div class="ad-content">
                <div class="ad-price">${ad.price}</div>
                <h3 class="ad-title">${ad.title}</h3>
            </div>
        `;

        //  Добавляем обработчик клика по карточке объявления
        adElement.addEventListener('click', () => {
            window.location.href = `ad-detail.html?id=${ad.id}`;
        });

        frag.appendChild(adElement);
    });

    adsContainer.appendChild(frag);

    // Скрываем кнопку, если показали все объявления
    if (endIndex >= allAds.length) {
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    } else {
        if (loadMoreBtn) loadMoreBtn.style.display = '';
    }
}

// Обработчик для кнопки "Показать еще"
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        displayAds(currentPage);
    });
}

// Инициализация приложения
function initializeApp() {
    if (appInitialized) {
        return;
    }
    appInitialized = true;

    // стартовый рендер
    displayAds(currentPage);
}