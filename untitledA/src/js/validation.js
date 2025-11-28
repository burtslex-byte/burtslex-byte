// js/validation.js
// Универсальная и надёжная валидация форм входа и регистрации.
// Этот файл заменяет обработчики логина/регистрации,
// делая их совместимыми с разными реализациями authManager.

(function () {
  // ---- Утилиты валидации (оставил ваши функции) ----
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidName(name) {
    const nameRegex = /^[а-яА-ЯёЁ\s\-]+$/;
    return nameRegex.test(name);
  }

  function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  function isValidPassword(password) {
    return password && password.length >= 6 && !/^\d+$/.test(password);
  }

  // ---- Помощники работы с authManager/localStorage ----
  function getAuthManager() {
    return window.authManager || null;
  }

  function persistCurrentUser(userObj) {
    try {
      localStorage.setItem('currentUser', JSON.stringify(userObj));
    } catch (e) {
      console.error('Не удалось сохранить currentUser в localStorage', e);
    }
  }

  function tryAutoLoginByAuthManager(email, password) {
    const am = getAuthManager();
    if (!am) return { ok: false, reason: 'no_auth_manager' };

    // Попытки вызвать login в нескольких вариантах (разные реализации)
    try {
      // 1) Если authManager.login принимает (email, password)
      const res = am.login(email, password);
      // Если вернул объект {ok: true} или true или user
      if (res === true || (res && res.ok) || (res && res.user)) {
        // Если метод не сам установил currentUser, пробуем прочитать am.getCurrentUser или am.currentUser
        const cur = (typeof am.getCurrentUser === 'function') ? am.getCurrentUser() : (am.currentUser || null);
        if (cur) persistCurrentUser(cur);
        return { ok: true, via: 'login(email,password)' };
      }
      // Если res falsy — считаем, что вход не удался (попробуем другие варианты ниже)
    } catch (err) {
      // возможно login не принимает два аргумента — пробуем объект
      console.warn('authManager.login(email,password) вызвал ошибку:', err);
    }

    try {
      // 2) Если authManager.login принимает объект {email, password}
      const res2 = am.login({ email: email, password: password });
      if (res2 === true || (res2 && res2.ok) || (res2 && res2.user)) {
        const cur = (typeof am.getCurrentUser === 'function') ? am.getCurrentUser() : (am.currentUser || null);
        if (cur) persistCurrentUser(cur);
        return { ok: true, via: 'login({email,password})' };
      }
    } catch (err) {
      console.warn('authManager.login({email,password}) вызвал ошибку:', err);
    }

    // 3) Если authManager не выполняет логин, но есть массив users — проверим вручную и установим currentUser
    try {
      const users = am.users || null;
      if (Array.isArray(users)) {
        const u = users.find(x => x.email === email && x.password === password);
        if (u) {
          const cur = { name: u.name || '', email: u.email, phone: u.phone || '' };
          persistCurrentUser(cur);
          // если у authManager есть init() — вызовем её чтобы внутреннее состояние синхронизировалось
          if (typeof am.init === 'function') {
            try { am.init(); } catch (e) { /* ignore */ }
          }
          return { ok: true, via: 'manual-users-check' };
        }
      }
    } catch (err) {
      console.warn('manual users check failed', err);
    }

    return { ok: false, reason: 'credentials_not_matched' };
  }

  function tryRegisterUser(userObj) {
    const am = getAuthManager();
    if (!am) {
      // Если нет authManager — попытаемся сохранить в localStorage.users
      try {
        const raw = localStorage.getItem('users');
        const users = raw ? JSON.parse(raw) : [];
        // проверка на дубликат
        if (users.find(u => u.email === userObj.email)) {
          return { ok: false, error: 'Пользователь с таким email уже существует' };
        }
        users.push(userObj);
        localStorage.setItem('users', JSON.stringify(users));
        // сохраняем currentUser
        persistCurrentUser({ name: userObj.name, email: userObj.email, phone: userObj.phone || '' });
        return { ok: true, via: 'localStorage-users' };
      } catch (e) {
        return { ok: false, error: 'Ошибка при сохранении пользователя' };
      }
    }

    // Если есть authManager, попробуем вызвать register или addUser
    try {
      if (typeof am.register === 'function') {
        const res = am.register(userObj);
        if (res === true || (res && res.ok)) {
          // Попробуем авто-вход
          tryAutoLoginByAuthManager(userObj.email, userObj.password);
          return { ok: true, via: 'authManager.register' };
        } else {
          return { ok: false, error: (res && res.error) ? res.error : 'Регистрация не удалась' };
        }
      } else if (Array.isArray(am.users)) {
        // Добавим прямо в am.users и сохраним, если есть способ сохранения
        am.users.push(userObj);
        if (typeof am.saveUsers === 'function') {
          try { am.saveUsers(); } catch (e) { /* ignore */ }
        } else {
          // fallback — сохранить в localStorage.users
          try {
            localStorage.setItem('users', JSON.stringify(am.users));
          } catch (e) { /* ignore */ }
        }
        // автологин
        persistCurrentUser({ name: userObj.name, email: userObj.email, phone: userObj.phone || '' });
        if (typeof am.init === 'function') {
          try { am.init(); } catch (e) {}
        }
        return { ok: true, via: 'pushed-to-am.users' };
      } else {
        return { ok: false, error: 'Регистрация недоступна' };
      }
    } catch (e) {
      console.error('Ошибка tryRegisterUser', e);
      return { ok: false, error: 'Внутренняя ошибка регистрации' };
    }
  }

  // ---- Получаем элементы форм (могут быть на странице index.html и add-ad.html) ----
  const loginFormElement = document.getElementById('loginForm');
  const registerFormElement = document.getElementById('registerForm');
  const authModal = document.getElementById('auth-modal'); // если модалка есть

  // Защита: если форм нет — ничего не делать
  if (loginFormElement) {
    loginFormElement.addEventListener('submit', (e) => {
      e.preventDefault();

      // Поля
      const emailEl = document.getElementById('login-email');
      const passwordEl = document.getElementById('login-password');
      const emailError = document.getElementById('login-email-error');
      const passwordError = document.getElementById('login-password-error');

      let isValid = true;

      if (!emailEl || !isValidEmail(emailEl.value)) {
        if (emailError) {
          emailError.textContent = 'Введите корректный email';
          emailError.style.display = 'block';
        }
        isValid = false;
      } else if (emailError) {
        emailError.style.display = 'none';
      }

      if (!passwordEl || !passwordEl.value) {
        if (passwordError) {
          passwordError.textContent = 'Введите пароль';
          passwordError.style.display = 'block';
        }
        isValid = false;
      } else if (passwordError) {
        passwordError.style.display = 'none';
      }

      if (!isValid) return;

      const email = emailEl.value.trim();
      const password = passwordEl.value;

      // Попытка входа через authManager (несколько стратегий)
      const res = tryAutoLoginByAuthManager(email, password);

      if (res.ok) {
        // Закрываем модалку, очищаем форму и перезагружаем страницу,
        // чтобы остальной код (add-ad.js и т.п.) увидел обновлённый currentUser
        if (authModal) authModal.classList.remove('active');
        loginFormElement.reset();

        // Немного задержим перезагрузку, чтобы authManager успел обновить состояние
        setTimeout(() => {
          window.location.reload();
        }, 150);
      } else {
        console.warn('Login failed:', res);
        alert('Неверный логин или пароль');
      }
    });
  }

  if (registerFormElement) {
    registerFormElement.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('register-name');
      const email = document.getElementById('register-email');
      const phone = document.getElementById('register-phone');
      const password = document.getElementById('register-password');
      const passwordConfirm = document.getElementById('register-password-confirm');
      const agreement = document.getElementById('register-agreement');

      const nameError = document.getElementById('register-name-error');
      const emailError = document.getElementById('register-email-error');
      const phoneError = document.getElementById('register-phone-error');
      const passwordError = document.getElementById('register-password-error');
      const passwordConfirmError = document.getElementById('register-password-confirm-error');
      const agreementError = document.getElementById('register-agreement-error');

      let ok = true;

      if (!name || !isValidName(name.value)) {
        if (nameError) {
          nameError.textContent = 'Имя может содержать только русские буквы, пробелы и дефисы';
          nameError.style.display = 'block';
        }
        ok = false;
      } else if (nameError) {
        nameError.style.display = 'none';
      }

      if (!email || !isValidEmail(email.value)) {
        if (emailError) {
          emailError.textContent = 'Введите корректный email';
          emailError.style.display = 'block';
        }
        ok = false;
      } else if (emailError) {
        emailError.style.display = 'none';
      }

      if (!phone || !isValidPhone(phone.value)) {
        if (phoneError) {
          phoneError.textContent = 'Введите корректный номер телефона';
          phoneError.style.display = 'block';
        }
        ok = false;
      } else if (phoneError) {
        phoneError.style.display = 'none';
      }

      if (!password || !isValidPassword(password.value)) {
        if (passwordError) {
          passwordError.textContent = 'Пароль должен содержать минимум 6 символов и не состоять только из цифр';
          passwordError.style.display = 'block';
        }
        ok = false;
      } else if (passwordError) {
        passwordError.style.display = 'none';
      }

      if (!passwordConfirm || passwordConfirm.value !== password.value) {
        if (passwordConfirmError) {
          passwordConfirmError.textContent = 'Пароли не совпадают';
          passwordConfirmError.style.display = 'block';
        }
        ok = false;
      } else if (passwordConfirmError) {
        passwordConfirmError.style.display = 'none';
      }

      if (!agreement || !agreement.checked) {
        if (agreementError) {
          agreementError.textContent = 'Необходимо согласие на обработку персональных данных';
          agreementError.style.display = 'block';
        }
        ok = false;
      } else if (agreementError) {
        agreementError.style.display = 'none';
      }

      if (!ok) return;

      const userData = {
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        password: password.value
      };

      const r = tryRegisterUser(userData);
      if (r.ok) {
        if (authModal) authModal.classList.remove('active');
        registerFormElement.reset();
        // после регистрации — перезагрузим страницу чтобы состояние обновилось
        setTimeout(() => window.location.reload(), 150);
      } else {
        alert(r.error || 'Ошибка при регистрации');
      }
    });
  }

})();
