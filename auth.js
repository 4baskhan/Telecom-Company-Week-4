(function () {
  // If already logged in, skip straight to the dashboard
  if (Auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const heading = document.getElementById('form-heading');
  const subtitle = document.getElementById('form-subtitle');
  const alertBox = document.getElementById('auth-alert');

  function switchTab(target) {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === target));
    loginForm.classList.toggle('active', target === 'login');
    registerForm.classList.toggle('active', target === 'register');
    heading.textContent = target === 'login' ? 'Sign in to your console' : 'Request a staff account';
    subtitle.textContent =
      target === 'login'
        ? 'Enter your credentials to access customer and order records.'
        : 'New accounts are created with staff-level access by default.';
    hideAlert();
    clearFieldErrors();
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.classList.add('show');
  }
  function hideAlert() {
    alertBox.classList.remove('show');
  }

  function setFieldError(fieldId, hasError) {
    const el = document.getElementById(fieldId);
    if (el) el.classList.toggle('has-error', hasError);
  }
  function clearFieldErrors() {
    document.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
  }

  function setLoading(button, loading, label) {
    button.disabled = loading;
    button.innerHTML = loading
      ? '<span class="spinner"></span>'
      : `<span class="btn-label">${label}</span>`;
  }

  // ── Login ──────────────────────────────────────────────
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    clearFieldErrors();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('login-email-field', true);
      valid = false;
    }
    if (!password) {
      setFieldError('login-password-field', true);
      valid = false;
    }
    if (!valid) return;

    const submitBtn = document.getElementById('login-submit');
    setLoading(submitBtn, true);

    try {
      const res = await api.login({ email, password });
      Auth.setSession(res.data.token, res.data.user);
      showToast(`Welcome back, ${res.data.user.name.split(' ')[0]}.`, 'success', 1500);
      setTimeout(() => (window.location.href = 'dashboard.html'), 350);
    } catch (err) {
      showAlert(err.message);
    } finally {
      setLoading(submitBtn, false, 'Sign In');
    }
  });

  // ── Register ───────────────────────────────────────────
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    clearFieldErrors();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const department = document.getElementById('reg-department').value;
    const password = document.getElementById('reg-password').value;

    let valid = true;
    if (name.length < 2) {
      setFieldError('reg-name-field', true);
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('reg-email-field', true);
      valid = false;
    }
    if (password.length < 8 || !/\d/.test(password)) {
      setFieldError('reg-password-field', true);
      valid = false;
    }
    if (!valid) return;

    const submitBtn = document.getElementById('register-submit');
    setLoading(submitBtn, true);

    try {
      const res = await api.register({ name, email, department, password });
      Auth.setSession(res.data.token, res.data.user);
      showToast('Account created. Redirecting to your dashboard…', 'success', 1500);
      setTimeout(() => (window.location.href = 'dashboard.html'), 350);
    } catch (err) {
      showAlert(err.message);
    } finally {
      setLoading(submitBtn, false, 'Create Staff Account');
    }
  });
})();
