document.addEventListener('DOMContentLoaded', function() {

  const authModal = document.getElementById('auth-modal');
  const openLogin = document.getElementById('login-link');
  const openRegister = document.getElementById('register-link');
  const closeBtn = document.getElementById('close-modal');

  const tabAuth = document.getElementById('tab-auth');
  const tabRegister = document.getElementById('tab-register');
  const authForm = document.getElementById('auth-form');
  const registerForm = document.getElementById('register-form');

  const authEmail = document.getElementById('auth-email');
  const authPass = document.getElementById('auth-password');
  const authBtn = document.getElementById('auth-submit');

  const regName = document.getElementById('reg-name');
  const regEmail = document.getElementById('reg-email');
  const regPhone = document.getElementById('reg-phone');
  const regPass = document.getElementById('reg-password');
  const regPass2 = document.getElementById('reg-password-confirm');
  const regAgree = document.getElementById('reg-agreement');
  const regBtn = document.getElementById('reg-submit');

  const userGreeting = document.getElementById('user-greeting');
  const usernameEl = document.getElementById('username');
  const authLinks = document.querySelector('.auth-links');
  const logoutBtn = document.getElementById('logout-btn');

  // ---------- helper функции ----------
  function showAuth() {
    authModal.classList.add('active');
    tabAuth.classList.add('active');
    tabRegister.classList.remove('active');
    authForm.classList.add('active');
    registerForm.classList.remove('active');
  }
  function showRegister() {
    authModal.classList.add('active');
    tabRegister.classList.add('active');
    tabAuth.classList.remove('active');
    registerForm.classList.add('active');
    authForm.classList.remove('active');
  }

  function setButtonState(button, enabled) {
    if (!button) return;
    if (enabled) {
      button.removeAttribute('disabled');
      button.classList.remove('disabled');
    } else {
      button.setAttribute('disabled', 'disabled');
      button.classList.add('disabled');
    }
  }

  // простые проверки заполнения
  function authFieldsFilled() {
    return authEmail.value.trim() && authPass.value.trim();
  }
  function regFieldsValid() {
    return (
      regName.value.trim() &&
      regEmail.value.trim() &&
      regPhone.value.trim() &&
      regPass.value &&
      regPass2.value &&
      regPass.value === regPass2.value &&
      regAgree.checked
    );
  }

  // ---------- управление вкладками ----------
  openLogin && openLogin.addEventListener('click', e => { e.preventDefault(); showAuth(); });
  openRegister && openRegister.addEventListener('click', e => { e.preventDefault(); showRegister(); });
  closeBtn && closeBtn.addEventListener('click', () => authModal.classList.remove('active'));
  window.addEventListener('click', e => { if (e.target === authModal) authModal.classList.remove('active'); });
  tabAuth && tabAuth.addEventListener('click', e => { e.preventDefault(); showAuth(); });
  tabRegister && tabRegister.addEventListener('click', e => { e.preventDefault(); showRegister(); });

  // ---------- Регистрация ----------
  if (regBtn) {
    const updateReg = () => setButtonState(regBtn, regFieldsValid());
    [regName, regEmail, regPhone, regPass, regPass2].forEach(el => el && el.addEventListener('input', updateReg));
    regAgree && regAgree.addEventListener('change', updateReg);
    updateReg();

    regBtn.addEventListener('click', e => {
      e.preventDefault();
      if (regBtn.hasAttribute('disabled')) return;

      const user = {
        name: regName.value.trim(),
        email: regEmail.value.trim(),
        phone: regPhone.value.trim(),
        password: regPass.value.trim()
      };

      // сохраняем в localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loggedIn', 'true');

      // обновляем интерфейс
      showUserGreeting(user.name);
      authModal.classList.remove('active');
    });
  }

  // ---------- Авторизация ----------
  if (authBtn) {
    const updateAuth = () => setButtonState(authBtn, authFieldsFilled());
    [authEmail, authPass].forEach(el => el && el.addEventListener('input', updateAuth));
    updateAuth();

    authBtn.addEventListener('click', e => {
      e.preventDefault();
      if (authBtn.hasAttribute('disabled')) return;

      const email = authEmail.value.trim();
      const password = authPass.value.trim();
      const saved = JSON.parse(localStorage.getItem('user') || '{}');

      // проверяем совпадение с сохранённым пользователем
      if (saved.email === email && saved.password === password) {
        localStorage.setItem('loggedIn', 'true');
        showUserGreeting(saved.name);
        authModal.classList.remove('active');
      } else {
        alert('Неверный email или пароль.');
      }
    });
  }

  // ---------- Выход ----------
  logoutBtn && logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('loggedIn');
    authLinks.style.display = 'flex';
    userGreeting.style.display = 'none';
  });

  // ---------- Автоматический вход ----------
  function showUserGreeting(name) {
    if (usernameEl) usernameEl.textContent = name || 'Пользователь';
    if (authLinks) authLinks.style.display = 'none';
    if (userGreeting) userGreeting.style.display = 'flex';
  }

  const isLogged = localStorage.getItem('loggedIn') === 'true';
  if (isLogged) {
    const saved = JSON.parse(localStorage.getItem('user') || '{}');
    if (saved && saved.name) showUserGreeting(saved.name);
  }
});
