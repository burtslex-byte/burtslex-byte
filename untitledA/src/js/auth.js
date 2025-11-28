// js/auth.js
// AuthManager: управление пользователями, регистрация, вход, текущий пользователь.
// Хранение пользователей в localStorage по ключу 'users', текущего пользователя — 'currentUser'.

class AuthManager {
  constructor() {
    this.usersKey = 'users';
    this.curUserKey = 'currentUser';
    this.users = [];
    this.currentUser = null;
  }

  // Загрузить пользователей и currentUser из localStorage
  init() {
    console.log('AuthManager.init()');
    try {
      const raw = localStorage.getItem(this.usersKey);
      this.users = raw ? JSON.parse(raw) : [];

      const rawCur = localStorage.getItem(this.curUserKey);
      this.currentUser = rawCur ? JSON.parse(rawCur) : null;

      // Если currentUser восстановлен — обновим UI (если элементы есть)
      if (this.currentUser) {
        this.showUserGreeting();
        console.log('Пользователь восстановлен:', this.currentUser);
      } else {
        this.hideUserGreeting();
      }
    } catch (err) {
      console.error('Ошибка при инициализации AuthManager:', err);
      this.users = [];
      this.currentUser = null;
    }
  }

  // Сохранение users в localStorage
  saveUsers() {
    try {
      localStorage.setItem(this.usersKey, JSON.stringify(this.users));
    } catch (e) {
      console.error('Не удалось сохранить users в localStorage', e);
    }
  }

  // Регистрация: принимает объект {name, email, phone, password}
  register(userObj) {
    if (!userObj || !userObj.email || !userObj.password) {
      return { ok: false, error: 'Требуются email и пароль' };
    }
    const exists = this.users.find(u => u.email === userObj.email);
    if (exists) return { ok: false, error: 'Пользователь с таким email уже существует' };

    const newUser = {
      name: userObj.name || '',
      email: userObj.email,
      phone: userObj.phone || '',
      password: userObj.password
    };
    this.users.push(newUser);
    this.saveUsers();

    // Авто-вход после регистрации
    this.currentUser = { name: newUser.name, email: newUser.email, phone: newUser.phone };
    localStorage.setItem(this.curUserKey, JSON.stringify(this.currentUser));
    this.showUserGreeting();

    return { ok: true, user: this.currentUser };
  }

  // Вход: поддерживаем два варианта вызова:
  // login(email, password) и login({email, password})
  login(arg1, arg2) {
    let email, password;
    if (typeof arg1 === 'object' && arg1 !== null) {
      email = (arg1.email || '').trim();
      password = arg1.password || '';
    } else {
      email = (arg1 || '').trim();
      password = arg2 || '';
    }

    if (!email || !password) {
      return { ok: false, error: 'Требуются email и пароль' };
    }

    // Ищем пользователя в списке users
    const user = this.users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { ok: false, error: 'Неверный логин или пароль' };
    }

    // Успешный вход: сохраняем currentUser без пароля
    this.currentUser = { name: user.name, email: user.email, phone: user.phone || '' };
    try {
      localStorage.setItem(this.curUserKey, JSON.stringify(this.currentUser));
    } catch (e) {
      console.error('Не удалось сохранить currentUser', e);
    }

    this.showUserGreeting();

    return { ok: true, user: this.currentUser };
  }

  // Выход
  logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(this.curUserKey);
    } catch (e) { /* ignore */ }
    this.hideUserGreeting();
    return { ok: true };
  }

  // Получить текущего пользователя (без пароля)
  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Помощники UI — показываем / скрываем приветствие, если элементы есть на странице
  showUserGreeting() {
    const greetingElement = document.getElementById('user-greeting');
    const usernameElement = document.getElementById('username');
    const authLinks = document.querySelector('.auth-links');

    if (greetingElement && usernameElement && authLinks && this.currentUser) {
      usernameElement.textContent = this.currentUser.name || this.currentUser.email;
      authLinks.style.display = 'none';
      greetingElement.style.display = 'flex';
    }
  }

  hideUserGreeting() {
    const greetingElement = document.getElementById('user-greeting');
    const authLinks = document.querySelector('.auth-links');

    if (greetingElement && authLinks) {
      authLinks.style.display = 'flex';
      greetingElement.style.display = 'none';
    }
  }
}

// Не создаём экземпляр здесь — экземпляр создаётся в app.js и сохраняется в window.authManager
// (app.js должен делать: const authManager = new AuthManager(); authManager.init(); window.authManager = authManager;)
