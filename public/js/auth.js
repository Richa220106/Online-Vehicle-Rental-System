/**
 * auth.js - Handles customer Registration and Login forms
 */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  // Handle Registration
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert('auth-alert');

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (password !== confirmPassword) {
        showAlert('auth-alert', 'Passwords do not match.', 'danger');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Account...';

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });

        const data = await res.json();

        if (data.success) {
          showAlert('auth-alert', 'Registration successful! Redirecting to fleet...', 'success');
          setTimeout(() => {
            window.location.href = 'vehicles.html';
          }, 1200);
        } else {
          showAlert('auth-alert', data.message || 'Registration failed.', 'danger');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      } catch (err) {
        console.error('Registration error:', err);
        showAlert('auth-alert', 'Unable to connect to server. Please try again.', 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert('auth-alert');

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
          showAlert('auth-alert', 'Login successful! Welcome back.', 'success');
          // If user was redirected here with a target vehicle to book, take them to it
          const redirect = getQueryParam('redirect');
          setTimeout(() => {
            window.location.href = redirect ? decodeURIComponent(redirect) : 'vehicles.html';
          }, 1000);
        } else {
          showAlert('auth-alert', data.message || 'Invalid credentials.', 'danger');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Login';
        }
      } catch (err) {
        console.error('Login error:', err);
        showAlert('auth-alert', 'Unable to connect to server. Please try again.', 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  }
});
