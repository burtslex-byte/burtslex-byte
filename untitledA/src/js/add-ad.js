// js/add-ad.js
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('add-ad-form');
  const imageInput = document.getElementById('ad-image');
  const imageUploadArea = document.getElementById('image-upload-area');
  const imagePreview = document.getElementById('image-preview');
  const successModal = document.getElementById('success-modal');
  const closeSuccessModal = document.getElementById('close-success-modal');
  const backToMainBtn = document.getElementById('back-to-main');
  const authModalEl = document.getElementById('auth-modal'); // модалка авторизации (если есть)

  if (!form) {
    console.warn('add-ad: форма не найдена на странице (id="add-ad-form")');
    return;
  }

  let selectedImage = null;

  // Клик по области загрузки изображения
  if (imageUploadArea && imageInput) {
    imageUploadArea.addEventListener('click', function () {
      imageInput.click();
    });
  }

  // При выборе файла — читаем в base64 и показываем предпросмотр
  if (imageInput) {
    imageInput.addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = function (ev) {
        selectedImage = ev.target.result;
        if (imagePreview) {
          imagePreview.innerHTML = `
            <img src="${selectedImage}" alt="Предпросмотр" style="max-width:100%;height:auto;">
            <button type="button" class="btn-remove-image" id="remove-image">×</button>
          `;
          const removeBtn = document.getElementById('remove-image');
          if (removeBtn) {
            removeBtn.addEventListener('click', function () {
              selectedImage = null;
              imageInput.value = '';
              imagePreview.innerHTML = '';
            });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Обработка отправки формы
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Проверяем, есть ли authManager; если нет — пробуем получить из window
    if (!window.authManager || typeof window.authManager.isLoggedIn !== 'function') {
      console.error('add-ad: authManager не найден. Убедитесь, что js/app.js подключен раньше.');
      alert('Ошибка авторизации. Перезагрузите страницу.');
      return;
    }

    if (!window.authManager.isLoggedIn()) {
      // Открываем модалку логина, если есть; иначе показываем alert
      if (authModalEl) {
        authModalEl.classList.add('active');
      } else {
        alert('Для добавления объявления необходимо войти в аккаунт.');
      }
      return;
    }

    // Получаем поля
    const titleEl = document.getElementById('ad-title');
    const priceEl = document.getElementById('ad-price');
    const descriptionEl = document.getElementById('ad-description');

    const title = titleEl ? titleEl.value.trim() : '';
    const priceRaw = priceEl ? priceEl.value.trim() : '';
    const description = descriptionEl ? descriptionEl.value.trim() : '';

    // Валидация
    if (!selectedImage) {
      alert('Пожалуйста, загрузите изображение');
      return;
    }
    if (!title || !priceRaw || !description) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    // Форматируем цену: удаляем лишние пробелы, если не указан символ ₽ — добавляем
    let price = priceRaw.replace(/\s+/g, ' ').trim();
    if (!price.includes('₽')) {
      price = price + ' ₽';
    }

    const adData = {
      title: title,
      price: price,
      image: selectedImage,
      description: description
    };

    try {
      // adsManager должен быть глобальным (подключён раньше)
      if (!window.adsManager || typeof window.adsManager.addAd !== 'function') {
        console.error('add-ad: adsManager не найден или не содержит addAd');
        alert('Внутренняя ошибка: менеджер объявлений не доступен');
        return;
      }

      const newAd = window.adsManager.addAd(adData); // ожидается, что addAd вернёт созданное объявление (с id)

      // Если addAd возвращает объект с id — переходим на страницу деталей
      if (newAd && newAd.id !== undefined) {
        // Перенаправляем на страницу деталей объявления
        window.location.href = `ad-detail.html?id=${encodeURIComponent(newAd.id)}`;
        return;
      }

      // Если нет id — показываем модалку успеха (как резерв)
      if (successModal) {
        successModal.classList.add('active');
      } else {
        alert('Объявление добавлено');
        window.location.href = 'index.html';
      }

      // Очистка формы
      form.reset();
      selectedImage = null;
      if (imagePreview) imagePreview.innerHTML = '';
    } catch (err) {
      console.error('Ошибка при добавлении объявления:', err);
      alert('Произошла ошибка при публикации объявления');
    }
  });

  // Закрытие модалки успеха
  if (closeSuccessModal) {
    closeSuccessModal.addEventListener('click', function () {
      if (successModal) successModal.classList.remove('active');
    });
  }
  if (backToMainBtn) {
    backToMainBtn.addEventListener('click', function () {
      if (successModal) successModal.classList.remove('active');
      window.location.href = 'index.html';
    });
  }

  // Закрытие при клике вне модального окна
  window.addEventListener('click', function (e) {
    if (e.target === successModal && successModal) {
      successModal.classList.remove('active');
    }
  });
});
